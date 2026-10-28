import os
from pathlib import Path
import shutil
import subprocess

import pytest


@pytest.fixture
def launcher(tmp_path):
    shutil.copyfile(Path(__file__).resolve().parents[1] / 'start.sh', tmp_path / 'start.sh')
    commands = tmp_path / 'commands'
    commands.mkdir()
    for name, body in {
        'hostname': 'echo 127.0.0.1',
        'lsof': 'exit 0',
        'pnpm': 'command -v node > "$LAUNCHER_NODE_RECORD"',
    }.items():
        command = commands / name
        command.write_text('#!/bin/sh\n' + body + '\n')
        command.chmod(0o755)
    runtime = tmp_path / 'runtime/bin'
    runtime.mkdir(parents=True)
    node = runtime / 'node'
    node.write_text('#!/bin/sh\necho v24.22.0\n')
    node.chmod(0o755)
    environment = {**os.environ, 'PATH': str(commands) + ':' + os.environ['PATH'],
        'LAUNCHER_NODE_RECORD': str(tmp_path / 'selected-node'), 'IAD_NODE_PATH': str(node)}
    return tmp_path, environment


def test_launcher_uses_configured_node_for_host_and_build(launcher):
    root, environment = launcher
    result = subprocess.run(['bash', str(root / 'start.sh')], env=environment, capture_output=True, text=True, timeout=20)
    assert result.returncode == 0, result.stderr
    assert str(root / 'runtime/bin/node') in result.stdout
    assert (root / 'selected-node').read_text().strip() == str(root / 'runtime/bin/node')


@pytest.mark.parametrize('setting', ['IAD_NODE_PATH', 'IAD_PYTHON_PATH'])
def test_launcher_rejects_missing_explicit_runtime_before_building(launcher, setting):
    root, environment = launcher
    environment[setting] = str(root / 'missing-runtime')
    result = subprocess.run(['bash', str(root / 'start.sh')], env=environment, capture_output=True, text=True, timeout=20)
    assert result.returncode != 0
    assert setting in result.stderr
    assert not (root / 'selected-node').exists()
