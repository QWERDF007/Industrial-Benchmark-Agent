"""Verify real MLLM audit recovery using synthetic images and an isolated database."""
import argparse
import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import httpx

from iad_core.entry import dataset_import, sample_get
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime


def main():
    started = time.monotonic()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('runs/verification/job-recovery') / str(time.time_ns()))
    args = parser.parse_args()
    if not os.environ.get('LIVE_VLM_ENDPOINT') or not os.environ.get('LIVE_VLM_KEY'):
        parser.error('Export LIVE_VLM_ENDPOINT and LIVE_VLM_KEY before verification')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    fixture = Path(__file__).resolve().parents[1] / 'apps/iad-harness/test/fixtures/knowledge_dataset.py'
    subprocess.run([sys.executable, str(fixture), str(output)], check=True)
    db_path = str(output / 'verification.db')
    dataset = dataset_import({'name': '合成部件恢复验证', 'image_dir': str(output / 'images'),
                              'annotation_dir': str(output / 'labels')}, db_path)
    target_id = dataset['dataset_id'] + ':part-2.png'
    before = sample_get({'sample_id': target_id}, db_path)
    runtime = WorkbenchRuntime(Database(db_path))
    knowledge_jobs = []
    normal = None
    try:
        for kind in ('normal', 'defect'):
            request = {'dataset_id': dataset['dataset_id'], 'kind': kind}
            if normal:
                request['normal_version_id'] = normal
            job = runtime.knowledge.start(**request)
            runtime.knowledge.wait(job['run_id'], 300)
            status = runtime.knowledge.status(job['run_id'])
            knowledge_jobs.append(status)
            assert status['status'] == 'COMPLETED', status.get('errors')
            if kind == 'normal':
                normal = status['knowledge_version_id']
    finally:
        runtime.close()
    endpoint = os.environ['LIVE_VLM_ENDPOINT'].removesuffix('/chat/completions').rstrip('/')
    origin = endpoint.removesuffix('/v1')
    entered, release = threading.Event(), threading.Event()
    observations = []
    proxy_client = httpx.Client(timeout=180, trust_env=False)

    class Proxy(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = self.rfile.read(int(self.headers['Content-Length']))
            document = json.loads(body)
            if self.path.endswith('/chat/completions') and document['response_format']['json_schema']['name'] == 'JointAnalysis':
                evidence = next(json.loads(item['text'][5:]) for item in document['messages'][0]['content']
                                if item['type'] == 'text' and item['text'].startswith('视觉证据：'))
                if evidence['evidence_id'] not in observations:
                    observations.append(evidence['evidence_id'])
                if len(observations) == 2:
                    entered.set()
                    if not release.wait(300):
                        return
                    # This pending local request was interrupted before forwarding.
                    return
            response = proxy_client.post(origin + self.path, content=body,
                                         headers={'Content-Type': 'application/json', 'Authorization': self.headers['Authorization']})
            self.send_response(response.status_code)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response.content)

    server = ThreadingHTTPServer(('127.0.0.1', 0), Proxy)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    worker = subprocess.Popen([sys.executable, '-m', 'iad_core.entry'], stdin=subprocess.PIPE,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        env={**os.environ, 'LIVE_VLM_ENDPOINT': f'http://127.0.0.1:{server.server_port}/v1'})
    runtime = None
    try:
        request = {'dataset_id': dataset['dataset_id'], 'normal_version_id': normal,
                   'defect_version_id': knowledge_jobs[-1]['knowledge_version_id']}
        worker.stdin.write(json.dumps({'request_id': 'start', 'operation': 'audit_start',
                                       'arguments': request, 'db_path': db_path}) + '\n')
        worker.stdin.flush()
        response = json.loads(worker.stdout.readline())
        assert response['event'] == 'result', response
        first = response['data']
        assert entered.wait(180), 'First real sample did not finish before the second generation request'
        committed = sample_get({'sample_id': first['sample_ids'][0]}, db_path)['suggestion']
        assert committed and committed['audit_run_id'] == first['run_id']
        worker.kill()
        worker.communicate(timeout=10)
        release.set()
        runtime = WorkbenchRuntime(Database(db_path))
        parent = runtime.audit.status(first['run_id'])
        assert (parent['status'], parent['completed'], parent['failed'], parent['unprocessed']) == ('INTERRUPTED', 1, 0, 2), parent
        child = runtime.audit.retry(run_id=first['run_id'])
        runtime.audit.wait(child['run_id'], 300)
        restored = runtime.audit.status(child['run_id'])
        assert (restored['status'], restored['completed'], restored['failed']) == ('COMPLETED', 2, 0), restored.get('errors')
        assert restored['parent_run_id'] == parent['run_id']
        assert first['sample_ids'][0] not in restored['sample_ids']
        assert sample_get({'sample_id': first['sample_ids'][0]}, db_path)['suggestion'] == committed
        assert runtime.audit.status(first['run_id']) == parent
        after = sample_get({'sample_id': target_id}, db_path)
        for field in ('annotations', 'review_decision'):
            assert after[field] == before[field]
        assert after['sample']['quality_status'] == before['sample']['quality_status']
        assert all(sample_get({'sample_id': sid}, db_path)['suggestion'] for sid in first['sample_ids'])
        result = {'elapsed_seconds': time.monotonic() - started, 'dataset_id': dataset['dataset_id'],
                  'knowledge_jobs': knowledge_jobs, 'interrupted': parent, 'restored': restored,
                  'industrial_quality': 'unassessed', 'autonomous_session': 'not tested', 'sidebar_pages': 'not tested'}
        (output / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
        print(json.dumps({'verified': True, 'output': str(output), 'parent': parent['run_id'],
                          'child': restored['run_id'], 'completed': 3}, ensure_ascii=False), flush=True)
    finally:
        release.set()
        if worker.poll() is None:
            worker.kill()
            worker.communicate(timeout=10)
        if runtime:
            runtime.close()
        server.shutdown()
        server.server_close()
        proxy_client.close()


if __name__ == '__main__':
    main()
