def model_provider_validate(args, db_path):
    from iad_core.workbench.model_settings import ProviderEdit, ProviderReference, ProviderDiscovery
    model = {'save': ProviderEdit, 'delete': ProviderReference, 'models': ProviderDiscovery}[args['action']]
    request = {key: value for key, value in args['request'].items() if key != 'api_key'}
    return model.model_validate(request).model_dump(mode='json', exclude={'api_key'})
