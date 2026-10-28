import json
import os
from pathlib import Path
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from PIL import Image


def test_live_gold_workflow_cli_records_audit_conflicts_review_and_formal_exports(mllm_api, tmp_path):
    client, _, _ = mllm_api

    class Model(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            response = client.post('http://local-model' + self.path, json=body)
            payload = response.content
            self.send_response(response.status_code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    server = ThreadingHTTPServer(('127.0.0.1', 0), Model)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        image = tmp_path / 'industrial-input.png'
        Image.new('RGB', (222, 415), '#405060').save(image)
        original = image.read_bytes()
        output = tmp_path / 'verification'
        project = Path(__file__).resolve().parents[1]
        run = subprocess.run([sys.executable, str(project / 'scripts/verify_gold_consistency.py'), '--image', str(image),
            '--output-dir', str(output), '--live-audit'], capture_output=True, text=True, timeout=45,
            cwd=project, env={**os.environ, 'LIVE_VLM_ENDPOINT': f'http://127.0.0.1:{server.server_port}/v1',
                'LIVE_VLM_MODEL': 'test-mllm', 'LIVE_VLM_KEY': 'local-only',
                'LIVE_VLM_CAPACITY_MODE': 'vllm_tokenize', 'IAD_KNOWLEDGE_MIN_SUPPORT_SOURCES': '2'})
        assert run.returncode == 0, run.stdout + run.stderr
        report = json.loads((output / 'verification.json').read_text())
        assert report['live_audit']['reference_kind'] == 'synthetic_controls'
        assert report['live_audit']['knowledge']['status'] == 'COMPLETED'
        assert report['live_audit']['batch']['completed'] == report['live_audit']['batch']['total'] == 4
        assert report['live_audit']['audit']['status'] == 'COMPLETED'
        assert report['live_audit']['visual_conclusion'] == 'PASS'
        assert report['live_audit']['same_image_quality_conflict'] is True
        assert report['live_audit']['before_review']['gold']['conflicts'] == 2
        assert report['live_audit']['after_review']['gold']['conflicts'] == 0
        assert report['formal_benchmark']['gold_count'] == 4
        assert report['same_split'] is True
        assert report['live_audit']['quality_report']['human_reviewed_count'] == 4
        assert image.read_bytes() == original
        assert (output / 'workspace/benchmark.db').is_file()
        assert report['live_audit']['audit']['model_calls']
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)
