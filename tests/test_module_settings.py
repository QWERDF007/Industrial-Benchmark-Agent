import pytest


def test_module_settings_persist_separately_and_reject_stale_writes(tmp_path):
    from iad_core.entry import module_settings_get, module_settings_save, model_settings_get
    database = str(tmp_path / 'modules.db')
    initial = module_settings_get({'module': 'consistency'}, database)
    assert initial['revision'] == 0
    assert initial['settings'] == {'model': None, 'mode': 'combined', 'min_similarity': .95}
    saved = module_settings_save({'module': 'consistency', 'expected_revision': 0,
        'settings': {'model': {'provider_id': 'vision', 'model_id': 'v2'}, 'mode': 'exact', 'min_similarity': .97}}, database)
    assert saved['revision'] == 1
    assert module_settings_get({'module': 'consistency'}, database) == saved
    assert module_settings_get({'module': 'knowledge'}, database)['settings'] == {'model': None}
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
