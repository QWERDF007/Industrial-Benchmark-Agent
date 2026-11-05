import pytest

from iad_core.entry import direction_exploration_presets, direction_exploration_preset_save


def test_preset_files_reload_full_editable_text_without_restarting(tmp_path, monkeypatch):
    directory = tmp_path / 'presets'
    directory.mkdir()
    monkeypatch.setenv('IAD_EXPLORATION_PRESETS_DIR', str(directory))
    file = directory / 'general.txt'
    file.write_text('通用方向\n只观察实际结构。\n', encoding='utf-8')
    db_path = str(tmp_path / 'workbench.db')
    first = direction_exploration_presets({}, db_path)['presets']
    assert first == [dict(id='general', name='通用方向', text='只观察实际结构。\n', builtin=True)]

    file.write_text('修改后的方向\n比较整图与真实人标。\n', encoding='utf-8')
    (directory / 'surface.txt').write_text('表面方向\n保留不确定性。', encoding='utf-8')
    refreshed = direction_exploration_presets({}, db_path)['presets']
    assert refreshed[0]['name'] == '修改后的方向'
    assert refreshed[0]['text'] == '比较整图与真实人标。\n'
    assert len(refreshed) == 2
    file.unlink()
    assert [p['name'] for p in direction_exploration_presets({}, db_path)['presets']] == ['表面方向']


def test_saved_presets_are_editable_files_in_the_same_directory(tmp_path, monkeypatch):
    directory = tmp_path / 'presets'
    monkeypatch.setenv('IAD_EXPLORATION_PRESETS_DIR', str(directory))
    db_path = str(tmp_path / 'workbench.db')
    saved = direction_exploration_preset_save({'name': '局部对照', 'text': '对照原图与人标。'}, db_path)
    files = list(directory.glob('*.txt'))
    assert len(files) == 1
    assert files[0].read_text(encoding='utf-8') == '局部对照\n对照原图与人标。'
    files[0].write_text('局部对照\n改为联合比较。', encoding='utf-8')
    assert direction_exploration_presets({}, db_path)['presets'] == [dict(saved, text='改为联合比较。')]
    with pytest.raises(ValueError, match='同名'):
        direction_exploration_preset_save({'name': ' 局部对照 ', 'text': '不可覆盖'}, db_path)


def test_invalid_preset_file_reports_the_filename(tmp_path, monkeypatch):
    monkeypatch.setenv('IAD_EXPLORATION_PRESETS_DIR', str(tmp_path))
    (tmp_path / 'empty.txt').write_text('空方向\n  ', encoding='utf-8')
    with pytest.raises(ValueError, match='empty.txt'):
        direction_exploration_presets({}, str(tmp_path / 'workbench.db'))


def test_knowledge_direction_files_reload_in_both_catalog_and_execution_prompt(dataset, tmp_path, monkeypatch):
    from iad_core.entry import knowledge_presets, knowledge_prompt_get

    directory = tmp_path / 'directions'
    directory.mkdir()
    monkeypatch.setenv('IAD_KNOWLEDGE_DIRECTIONS_DIR', str(directory))
    file = directory / 'shape.txt'
    file.write_text('整体形态\n观察可见轮廓。', encoding='utf-8')
    db, _, config = dataset
    query = dict(dataset_id=config.dataset.id, kind='normal')
    catalog = knowledge_presets({}, db.db_path)['directions']
    assert catalog == [dict(direction_id='shape', title='整体形态', instruction='观察可见轮廓。', enabled=True, origin='preset')]
    before = knowledge_prompt_get(query, db.db_path)
    assert before['configuration']['directions'] == catalog
    assert '观察可见轮廓。' in before['instruction']

    file.write_text('结构对照\n联合比较原图与人工标注。', encoding='utf-8')
    after = knowledge_prompt_get(query, db.db_path)
    assert after['configuration']['directions'] == knowledge_presets({}, db.db_path)['directions']
    assert after['configuration']['directions'][0]['title'] == '结构对照'
    assert '联合比较原图与人工标注。' in after['instruction']
    assert '观察可见轮廓。' not in after['instruction']
    assert after['revision'] != before['revision']
