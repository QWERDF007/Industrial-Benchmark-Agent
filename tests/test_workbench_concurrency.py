from concurrent.futures import ThreadPoolExecutor
import json
import subprocess
import sys
from threading import Barrier

from iad_core.entry import dataset_list


def test_concurrent_first_workbench_queries_share_a_fresh_database(tmp_path):
    for index in range(20):
        db_path = str(tmp_path / f'fresh-{index}.db')
        barrier = Barrier(4)

        def read(_):
            barrier.wait()
            return dataset_list({}, db_path)

        with ThreadPoolExecutor(4) as pool:
            results = list(pool.map(read, range(4)))
        assert all(result['datasets'] == [] for result in results)


def test_independent_workers_can_query_the_same_fresh_workbench(tmp_path):
    db_path = str(tmp_path / 'workers.db')
    barrier = Barrier(4)

    def read(index):
        barrier.wait()
        request = {'request_id': str(index), 'operation': 'dataset_list', 'arguments': {}, 'db_path': db_path}
        worker = subprocess.run([sys.executable, '-m', 'iad_core.entry', json.dumps(request)],
                                capture_output=True, text=True, timeout=10)
        assert worker.returncode == 0, worker.stderr
        return json.loads(worker.stdout)

    with ThreadPoolExecutor(4) as pool:
        results = list(pool.map(read, range(4)))
    assert all(result['event'] == 'result' and result['data']['datasets'] == [] for result in results), results
