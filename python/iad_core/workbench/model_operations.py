import os

from iad_core.storage.database import Database


def model_settings_get(args, db_path):
    from iad_core.workbench.model_settings import WorkbenchModels
    return WorkbenchModels(Database(db_path)).read().model_dump()


def model_settings_save(args, db_path):
    from iad_core.workbench.model_settings import WorkbenchModels
    return WorkbenchModels(Database(db_path)).save(args).model_dump()


def model_settings_view(args, db_path):
    from iad_core.workbench.model_settings import WorkbenchModels, WorkbenchModelView
    settings = WorkbenchModels(Database(db_path)).read()
    configured = settings.selection is None and bool(os.environ.get('LIVE_VLM_ENDPOINT') and os.environ.get('LIVE_VLM_CAPACITY_MODE'))
    return WorkbenchModelView(**settings.model_dump(), ready=configured,
        error=None if configured else '请在DSH工作台模型设置中选择提供商和模型').model_dump()


def model_settings_validate(args, db_path):
    from iad_core.workbench.model_settings import WorkbenchModelSelection
    return WorkbenchModelSelection.model_validate(args).model_dump()


def model_provider_validate(args, db_path):
    from iad_core.workbench.model_settings import ProviderEdit, ProviderReference, ProviderDiscovery
    model = {'save': ProviderEdit, 'delete': ProviderReference, 'models': ProviderDiscovery}[args['action']]
    request = {key: value for key, value in args['request'].items() if key != 'api_key'}
    return model.model_validate(request).model_dump(mode='json', exclude={'api_key'})


def model_connection_check(args, db_path):
    from iad_core.workbench.model_settings import ModelExecution
    from iad_core.workbench.vision import VlmClient
    execution = ModelExecution.model_validate(args['_model_execution'])
    client = VlmClient(profile=execution.profile, api_key=execution.api_key.get_secret_value() if execution.api_key else None)
    try:
        return client.check_connection()
    finally:
        client.close()


def model_environment_get(args, db_path):
    from iad_core.workbench.model_profile import ModelLimits, ModelProfile
    profile = ModelProfile.configured(os.environ.get('LIVE_VLM_ENDPOINT', 'http://127.0.0.1:8000/v1'))
    return {'endpoint': profile.endpoint, 'model_id': os.environ.get('LIVE_VLM_MODEL') or None,
            'limits': {field: getattr(profile, field) for field in ModelLimits.model_fields}}
