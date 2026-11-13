import json

import pytest

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.settings import DinoEncoderEdit, DinoEncoderSettings
from iad_core.feature.profiles import ImageEncoders
from iad_core.storage.database import Database


@pytest.fixture
def dino_settings(tmp_path):
    models = tmp_path / 'models' / 'dinov3'
    for model, dim, heads, intermediate in [('dinov3_vits16', 384, 6, 1536), ('dinov3_vitb16', 768, 12, 3072)]:
        root = models / model
        root.mkdir(parents=True)
        (root / 'model.safetensors').write_bytes(b'configuration fixture; not model inference')
        (root / 'config.json').write_text(json.dumps(dict(model_type='dinov3_vit', hidden_size=dim,
            num_hidden_layers=12, num_attention_heads=heads, intermediate_size=intermediate,
            patch_size=16, num_register_tokens=4, num_channels=3, use_gated_mlp=False)))
        (root / 'preprocessor_config.json').write_text(json.dumps(dict(image_processor_type='DINOv3ViTImageProcessorFast',
            size={'height': 224, 'width': 224}, do_resize=True, do_rescale=True, do_normalize=True,
            resample=2, rescale_factor=1/255, image_mean=[.485, .456, .406], image_std=[.229, .224, .225])))
    database = Database(str(tmp_path / 'settings.db'))
    yield DinoEncoderSettings(database, model_root=models), database, models


def test_dino_settings_resolve_fixed_weights_and_reuse_profiles_for_batch_edits(dino_settings):
    settings, db, models = dino_settings
    view = settings.view()
    assert [model.model_id for model in view.models] == ['dinov3_vits16', 'dinov3_vits16plus', 'dinov3_vitb16', 'dinov3_vitl16']
    assert [model.label for model in view.models] == [
        'dinov3-vits16-pretrain-lvd1689m',
        'dinov3-vits16plus-pretrain-lvd1689m',
        'dinov3-vitb16-pretrain-lvd1689m',
        'dinov3-vitl16-pretrain-lvd1689m',
    ]
    assert [model.model_id for model in view.models if model.available] == ['dinov3_vits16', 'dinov3_vitb16']
    first = settings.save(DinoEncoderEdit(expected_revision=0, model_id='dinov3_vitb16', batch_size=8, input_size=224))
    assert first.selection.profile.weights_ref == str(models / 'dinov3_vitb16' / 'model.safetensors')
    assert first.selection.compute_dtype == first.selection.profile.storage_dtype == 'float16'
    assert first.selection.device == 'cuda:0'
    second = settings.save(DinoEncoderEdit(expected_revision=1, model_id='dinov3_vitb16', batch_size=16, input_size=224))
    assert second.selection.profile == first.selection.profile
    third = settings.save(DinoEncoderEdit(expected_revision=2, model_id='dinov3_vits16', batch_size=16, input_size=256))
    assert third.selection.profile.dim == 384 and third.selection.profile.input_size == 256
    assert third.selection.profile.profile_id != first.selection.profile.profile_id
    assert ImageEncoders(db).profile(first.selection.profile.profile_id) == first.selection.profile
    with pytest.raises(ValueError, match='配置已变化'):
        settings.save(DinoEncoderEdit(expected_revision=1, model_id='dinov3_vitb16', batch_size=4, input_size=224))
    with pytest.raises(ConsistencyError):
        settings.save(DinoEncoderEdit(expected_revision=3, model_id='dinov3_vitl16', batch_size=4, input_size=224))
    assert settings.view().selection == third.selection


@pytest.mark.parametrize('patch', [dict(input_size=225), dict(input_size=True), dict(batch_size=0),
    dict(batch_size=257), dict(weights_ref='/tmp/other-model'), dict(source_ref='/tmp/source')])
def test_dino_settings_reject_invalid_inputs_and_client_weight_paths(patch):
    with pytest.raises(ValueError):
        DinoEncoderEdit.model_validate(dict(expected_revision=0, model_id='dinov3_vitb16', batch_size=8,
            input_size=224) | patch)
