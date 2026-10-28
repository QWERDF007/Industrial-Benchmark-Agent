import builtins
import os
import sqlite3
from pathlib import Path

import pytest
import yaml

from iad_core.benchmark.builder import run_benchmark_pipeline
from iad_core.storage.repositories import BenchmarkRepository, GoldRepository, SampleRepository


@pytest.fixture
def formal_benchmark(dataset, tmp_path):
    db, _, config = dataset
    samples = SampleRepository(db)
    for sample in samples.list_by_task(config.task.task_id):
        sample.quality_status = 'PASS' if Path(sample.relative_path).stem.startswith('normal') else 'FAIL'
        sample.quality_source = 'imported'
        samples.upsert(sample)
    config_path = tmp_path / 'formal.yaml'
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    return db, dict(task_id=config.task.task_id, config_path=str(config_path), db_path=db.db_path)


def test_failed_artifact_write_does_not_publish_a_partial_benchmark(dataset, tmp_path, monkeypatch):
    db, _, config = dataset
    config_path = tmp_path / 'benchmark.yaml'
    config_path.write_text(yaml.safe_dump(config.model_dump(mode='json')))
    output = tmp_path / 'published'
    original_open = builtins.open

    def fail_subset(path, mode='r', *args, **kwargs):
        if Path(path).name == 'train.jsonl' and 'w' in mode:
            raise OSError('Storage write failed during benchmark export')
        return original_open(path, mode, *args, **kwargs)

    monkeypatch.setattr(builtins, 'open', fail_subset)
    with pytest.raises(OSError, match='Storage write failed'):
        run_benchmark_pipeline(config.task.task_id, build_id='failed-export', config_path=str(config_path),
            db_path=db.db_path, output_dir=str(output))
    assert BenchmarkRepository(db).get_build('failed-export') is None
    assert GoldRepository(db).list_by_task(config.task.task_id) == []
    assert not output.exists()


@pytest.mark.parametrize('failure_stage', ['split', 'commit', 'rename', 'parent_sync'])
def test_publication_failure_rolls_back_gold_build_and_files(formal_benchmark, tmp_path, monkeypatch, failure_stage):
    db, arguments = formal_benchmark
    output = tmp_path / 'published'
    output.mkdir()
    if failure_stage == 'split':
        with db.connection() as connection:
            connection.execute("CREATE TRIGGER fail_split BEFORE INSERT ON split_assignments BEGIN SELECT RAISE(ABORT, 'split write failed'); END")
        expected_error = sqlite3.IntegrityError
    elif failure_stage == 'commit':
        with db.connection() as connection:
            connection.execute('CREATE TABLE publication_parent(id INTEGER PRIMARY KEY)')
            connection.execute('CREATE TABLE publication_child(id INTEGER REFERENCES publication_parent(id) DEFERRABLE INITIALLY DEFERRED)')
            connection.execute('CREATE TRIGGER fail_commit AFTER INSERT ON benchmark_builds BEGIN INSERT INTO publication_child VALUES (1); END')
        expected_error = sqlite3.IntegrityError
    elif failure_stage == 'rename':
        def fail_replace(source, target):
            assert Path(source).is_dir() and Path(target) == output
            raise OSError('directory rename failed')
        monkeypatch.setattr(os, 'replace', fail_replace)
        expected_error = OSError
    else:
        original_open = os.open

        def fail_parent_sync(path, flags, *args, **kwargs):
            if Path(path) == output.parent and flags & os.O_DIRECTORY:
                assert (output / 'gold.jsonl').is_file()
                raise OSError('parent directory sync failed')
            return original_open(path, flags, *args, **kwargs)

        monkeypatch.setattr(os, 'open', fail_parent_sync)
        expected_error = OSError
    with pytest.raises(expected_error):
        run_benchmark_pipeline(**arguments, build_id='failed-publication', output_dir=str(output))
    assert BenchmarkRepository(db).get_build('failed-publication') is None
    assert GoldRepository(db).list_by_task(arguments['task_id']) == []
    assert output.is_dir() and list(output.iterdir()) == []
    assert not list(tmp_path.glob('.benchmark-*'))


def test_published_benchmark_and_build_identity_are_immutable(formal_benchmark, tmp_path):
    db, arguments = formal_benchmark
    output = tmp_path / 'published'
    result = run_benchmark_pipeline(**arguments, build_id='first', output_dir=str(output))
    assert result.gold_count == 4
    assert result.train_count + result.val_count + result.test_count == 4
    original_files = {path.name: path.read_bytes() for path in output.iterdir()}
    assert len(original_files) == 9
    original_gold = GoldRepository(db).list_by_task(arguments['task_id'])
    original_build = BenchmarkRepository(db).get_build('first')
    with pytest.raises(FileExistsError, match='output already exists'):
        run_benchmark_pipeline(**arguments, build_id='second', output_dir=str(output))
    other_output = tmp_path / 'other'
    with pytest.raises(FileExistsError, match='build ID already exists'):
        run_benchmark_pipeline(**arguments, build_id='first', output_dir=str(other_output))
    assert not other_output.exists()
    assert BenchmarkRepository(db).get_build('second') is None
    assert BenchmarkRepository(db).get_build('first') == original_build
    assert GoldRepository(db).list_by_task(arguments['task_id']) == original_gold
    assert {path.name: path.read_bytes() for path in output.iterdir()} == original_files


def test_public_build_and_status_preserve_unready_benchmark_status(formal_benchmark, tmp_path):
    from iad_core.contracts import ToolStatus
    from iad_core.tools.benchmark_tools import benchmark_build, benchmark_status

    db, arguments = formal_benchmark
    result = benchmark_build(**arguments, build_id='too-small', output_dir=str(tmp_path / 'small'))
    assert result.metrics['status'] == 'NOT_READY'
    assert result.metrics['gold_count'] == 4
    assert result.status == ToolStatus.NOT_READY
    assert 'NOT_READY' in result.summary
    assert result.artifacts and all(Path(item.path).exists() for item in result.artifacts)
    assert result.warnings
    saved = benchmark_status('too-small', db_path=db.db_path)
    assert saved.status == result.status
    assert saved.metrics['status'] == result.metrics['status']
    assert saved.next_actions == result.next_actions
    assert all('baseline_run' not in action for action in result.next_actions)
