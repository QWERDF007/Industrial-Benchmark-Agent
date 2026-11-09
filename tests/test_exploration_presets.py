import pytest

from iad_core.entry import direction_exploration_presets, direction_exploration_preset_save


def test_builtin_user_prompts_exclude_tool_workflow_and_annotation_color_boilerplate(tmp_path, monkeypatch):
    from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPromptConfiguration

    monkeypatch.delenv('IAD_EXPLORATION_PRESETS_DIR', raising=False)
    presets = direction_exploration_presets({}, str(tmp_path / 'workbench.db'))['presets']
    mining = FrozenMiningPrompt.capture(MiningPromptConfiguration(objective='比较边缘', directions=[]))
    for text in [*(preset['text'] for preset in presets), mining.instruction]:
        assert 'analysis_images' not in text
        assert '标注框颜色' not in text
        assert '标注颜色也不是采集信息' not in text
        assert '不能把 NG、标注' not in text


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


def test_knowledge_direction_files_reload_in_both_catalog_and_execution_prompt(agent_jobs, tmp_path, monkeypatch):
    from uuid import uuid4
    from iad_core.entry import knowledge_presets
    from iad_core.workbench.module_settings import ModuleSettings
    jobs,dataset_id,role = agent_jobs
    ModuleSettings(jobs.db).save({'module':'knowledge','expected_revision':0,
        'settings':{'model':{'provider_id':'swift-30003','model_id':'fixture'}}})
    directory = tmp_path/'directions'
    directory.mkdir()
    monkeypatch.setenv('IAD_KNOWLEDGE_DIRECTIONS_DIR',str(directory))
    file = directory/'shape.txt'
    file.write_text('整体形态\n观察可见轮廓。',encoding='utf-8')
    original = knowledge_presets({},jobs.db.db_path)['directions'][0]
    assert (original['direction_id'],original['title'],original['instruction']) == ('shape','整体形态','观察可见轮廓。')
    request = dict(submission_id=str(uuid4()),analysis_kind='knowledge',dataset_ids=[dataset_id],
        mining_prompt=dict(objective='观察图像。',instruction=original['instruction'],directions=[original]))
    first = jobs.start(request,agent=role)
    before = jobs.snapshot(first['run_id'])
    file.write_text('整体形态\n联合比较外轮廓与局部转角。',encoding='utf-8')
    changed = knowledge_presets({},jobs.db.db_path)['directions'][0]
    assert changed['source']['revision'] != original['source']['revision']
    assert jobs.start(request,agent=role)['run_id'] == first['run_id']
    with pytest.raises(ValueError,match='版本已变化'):
        jobs.start({**request,'submission_id':str(uuid4())},agent=role)
    jobs.cancel(first['run_id'])
    second = jobs.start({**request,'submission_id':str(uuid4()),'mining_prompt':dict(
        objective='观察图像。',instruction=changed['instruction'],directions=[changed])},agent=role)
    assert jobs.snapshot(second['run_id']).selected_directions[0].source_instruction == '联合比较外轮廓与局部转角。'
    assert before.selected_directions[0].source_instruction == '观察可见轮廓。'
    assert jobs.snapshot(first['run_id']) == before
