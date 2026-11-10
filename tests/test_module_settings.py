import pytest


def test_sampling_ratios_default_old_settings_and_persist_independently(dataset):
    from iad_core.workbench.module_settings import ModuleSettings
    db, _, _ = dataset
    with db.connection() as connection:
        connection.execute("INSERT INTO workbench_module_settings VALUES('exploration',4,?)",
            ('{"batch_size":5,"whole_image_max_side":1024}',))
    store = ModuleSettings(db)
    old = store.read('exploration')
    assert old.settings.model_dump()['sampling_ratio'] == dict(normal=1, abnormal=1)
    assert old.revision == 4 and old.settings.batch_size == 5 and old.settings.whole_image_max_side == 1024
    exploration = store.save(dict(module='exploration', expected_revision=4,
        settings=dict(sampling_ratio=dict(normal=3, abnormal=1))))
    knowledge = store.save(dict(module='knowledge', expected_revision=0,
        settings=dict(sampling_ratio=dict(normal=1, abnormal=3))))
    assert store.read('exploration') == exploration
    assert store.read('knowledge') == knowledge
    assert exploration.settings.sampling_ratio.normal == knowledge.settings.sampling_ratio.abnormal == 3
    for invalid in [{}, {'normal':1}, {'abnormal':1}, {'normal':0,'abnormal':1},
            {'normal':-1,'abnormal':1}, {'normal':1,'abnormal':1.5}, {'normal':True,'abnormal':1},
            {'normal':'3','abnormal':1}, None]:
        with pytest.raises(ValueError):
            store.save(dict(module='exploration', expected_revision=5, settings=dict(sampling_ratio=invalid)))
        assert store.read('exploration') == exploration


def test_module_settings_persist_separately_and_reject_stale_writes(tmp_path):
    from iad_core.entry import module_settings_get, module_settings_save, model_settings_get
    database = str(tmp_path / 'modules.db')
    initial = module_settings_get({'module': 'consistency'}, database)
    assert initial['revision'] == 0
    assert initial['settings'] == {'model': None, 'mode': 'combined', 'min_similarity': .98,
        'max_exact_candidates': 5, 'max_similar_candidates': 10, 'concurrency': 1,
        'agent_limits': {'context_tokens': None, 'max_output_tokens': None, 'request_parameters': {}, 'generation_timeout_seconds': None}}
    saved = module_settings_save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'model': {'provider_id': 'vision', 'model_id': 'v2'}, 'mode': 'exact', 'min_similarity': .97}}, database)
    assert saved['revision'] == 1
    assert module_settings_get({'module': 'consistency'}, database) == saved
    assert module_settings_get({'module': 'knowledge'}, database)['settings'] == {'model': None,
        'batch_size': 12, 'sampling_ratio': {'normal':1,'abnormal':1}, 'whole_image_max_side': None,
        'agent_limits': {'context_tokens': None, 'max_output_tokens': None, 'request_parameters': {}, 'generation_timeout_seconds': None}}
    assert model_settings_get({}, database) == {'revision': 0, 'selection': None}
    with pytest.raises(ValueError, match='配置已变化'):
        module_settings_save({'module': 'consistency', 'expected_revision': 0, 'settings': saved['settings']}, database)
    for invalid in [{'min_similarity': 1.1}, {'mode': 'visual'}, {'model': {'provider_id': 'vision', 'model_id': ''}}, {'api_key': 'secret'}]:
        with pytest.raises(ValueError):
            module_settings_save({'module': 'consistency', 'expected_revision': 1, 'settings': invalid}, database)
    with pytest.raises(ValueError):
        module_settings_save({'module': 'knowledge', 'expected_revision': 0, 'settings': {'min_similarity': .8}}, database)
    assert module_settings_get({'module': 'consistency'}, database) == saved


def test_consistency_defaults_preserve_explicit_request_and_freeze_values(tmp_path):
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.storage.database import Database
    store = ModuleSettings(Database(str(tmp_path / 'modules.db')))
    store.save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'mode': 'exact', 'min_similarity': .97}})
    request = {'analysis_kind': 'consistency', 'dataset_ids': ['a']}
    frozen = store.consistency_request(request)
    assert request == {'analysis_kind': 'consistency', 'dataset_ids': ['a']}
    assert frozen['mode'] == 'exact' and frozen['min_similarity'] == .97
    assert store.consistency_request({'mode': 'combined', 'min_similarity': .96}) == {'mode': 'combined', 'min_similarity': .96}
    store.save({'module': 'consistency', 'expected_revision': 1, 'settings': {'mode': 'combined', 'min_similarity': .99}})
    assert frozen['mode'] == 'exact' and frozen['min_similarity'] == .97


def test_saving_one_field_preserves_other_module_settings(tmp_path):
    from iad_core.entry import module_settings_get, module_settings_save, module_settings_validate
    database = str(tmp_path / 'module-patches.db')
    first = module_settings_save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'model': {'provider_id': 'vision', 'model_id': 'v2'}, 'mode': 'exact', 'min_similarity': .97}}, database)
    patch = module_settings_validate({'module': 'consistency', 'expected_revision': first['revision'],
        'settings': {'min_similarity': .98}}, database)
    assert patch['settings'] == {'min_similarity': .98}
    changed = module_settings_save(patch, database)
    assert changed['settings'] == {'model': {'provider_id': 'vision', 'model_id': 'v2'},
        'mode': 'exact', 'min_similarity': .98, 'max_exact_candidates': 5, 'max_similar_candidates': 10, 'concurrency': 1,
        'agent_limits': {'context_tokens': None, 'max_output_tokens': None, 'request_parameters': {}, 'generation_timeout_seconds': None}}
    assert module_settings_get({'module': 'consistency'}, database) == changed


def test_consistency_roles_and_candidate_limits_persist_without_leaking_into_retrieval(tmp_path):
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.storage.database import Database
    from iad_core.consistency.models import ConsistencyStart

    store = ModuleSettings(Database(str(tmp_path / 'roles.db')))
    saved = store.save({'module': 'consistency', 'expected_revision': 0, 'settings': {
        'model': {'provider_id': 'vision', 'model_id': 'observer'},
        'max_exact_candidates': 3, 'max_similar_candidates': 7, 'min_similarity': .90}})
    assert store.read('consistency') == saved
    assert 'agent_model' not in saved.settings.model_dump()
    assert saved.settings.model.provider_id == 'vision'
    assert saved.settings.max_exact_candidates == 3
    assert saved.settings.max_similar_candidates == 7
    request = store.consistency_request({'subjects': {'kind': 'all_registered'}, 'request_id': 'retrieval'})
    parsed = ConsistencyStart.model_validate(request)
    assert parsed.min_similarity == .90
    assert not {'agent_model', 'model', 'max_exact_candidates', 'max_similar_candidates'} & request.keys()


@pytest.mark.parametrize('field', ['max_exact_candidates', 'max_similar_candidates'])
@pytest.mark.parametrize('invalid', [0, -1, 1.5, True, '3', None])
def test_candidate_limits_reject_invalid_values_without_changing_settings(tmp_path, field, invalid):
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.storage.database import Database
    store = ModuleSettings(Database(str(tmp_path / 'limits.db')))
    saved = store.save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'max_exact_candidates': 3, 'max_similar_candidates': 7}})
    with pytest.raises(ValueError):
        store.save({'module': 'consistency', 'expected_revision': 1, 'settings': {field: invalid}})
    assert store.read('consistency') == saved


def test_legacy_consistency_settings_preserve_threshold_and_only_supply_missing_defaults(tmp_path):
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.storage.database import Database
    database = Database(str(tmp_path / 'legacy.db'))
    with database.connection() as conn:
        conn.execute('INSERT INTO workbench_module_settings(module,revision,settings_json) VALUES(?,?,?)',
            ('consistency', 4, '{"model":null,"mode":"combined","min_similarity":0.90}'))
    snapshot = ModuleSettings(database).read('consistency')
    assert snapshot.revision == 4
    assert snapshot.settings.min_similarity == .90
    assert snapshot.settings.max_exact_candidates == 5
    assert snapshot.settings.max_similar_candidates == 10
    assert 'agent_model' not in snapshot.settings.model_dump()
def test_agent_generation_limits_are_independent_of_visual_capacity_settings(dataset):
    from iad_core.workbench.model_settings import WorkbenchModels
    from iad_core.workbench.module_settings import ModuleSettings
    from iad_core.consistency.agent_jobs import ConsistencyAgentJobs
    from iad_core.workbench.runtime import WorkbenchRuntime

    database, _, _ = dataset
    WorkbenchModels(database).save({'expected_revision': 0, 'selection': {'provider_id': 'visual', 'model_id': 'image',
        'limits': {'capacity_mode': 'vllm_tokenize', 'max_visual_inputs': 4,
            'request_parameters': {'response_format': {'type': 'json_object'}}}}})
    modules = ModuleSettings(database)
    modules.save({'module': 'consistency', 'expected_revision': 0, 'settings': {'agent_limits': {
        'context_tokens': 4096, 'max_output_tokens': 512, 'generation_timeout_seconds': 30,
        'request_parameters': {'temperature': .6}}}})
    runtime = WorkbenchRuntime(database)
    try:
        configuration = ConsistencyAgentJobs(runtime).configuration()
        assert configuration.settings.agent_limits.context_tokens == 4096
        assert configuration.settings.agent_limits.max_output_tokens == 512
        assert configuration.settings.agent_limits.request_parameters == {'temperature': .6}
        assert configuration.model_limits.request_parameters == {'response_format': {'type': 'json_object'}}
        assert configuration.model_limits.max_visual_inputs == 4
        with pytest.raises(ValueError):
            modules.save({'module': 'consistency', 'expected_revision': 1, 'settings': {'agent_limits': {'max_visual_inputs': 2}}})
    finally:
        runtime.close()


def test_old_model_settings_are_migrated_to_one_selection_without_changing_history(tmp_path):
    import json
    from iad_core.storage.database import Database
    from iad_core.workbench.module_settings import ModuleSettings
    path = str(tmp_path / 'old-models.db')
    database = Database(path)
    with database.connection() as conn:
        conn.execute("INSERT INTO workbench_module_settings VALUES('consistency',3,?)", (json.dumps({
            'model': {'provider_id': 'vision', 'model_id': 'observer'},
            'agent_model': {'provider_id': 'agent', 'model_id': 'planner'}, 'min_similarity': .98}),))
    Database._schema_revisions.clear()
    reopened = Database(path)
    settings = ModuleSettings(reopened).read('consistency')
    assert settings.revision == 3
    assert settings.settings.model.model_id == 'observer'
    assert 'agent_model' not in settings.settings.model_dump()
    with pytest.raises(ValueError):
        ModuleSettings(reopened).save({'module': 'consistency', 'expected_revision': 3,
            'settings': {'agent_model': {'provider_id': 'agent', 'model_id': 'planner'}}})
