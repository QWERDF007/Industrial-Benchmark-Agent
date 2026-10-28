import subprocess
import json
import os
import shutil
from pathlib import Path

import numpy as np
import pytest
from PIL import Image
from pydantic import ValidationError

from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
from iad_core.feature.encoder import ImageFeatureExtractor, ImageEncoderRuntime
from iad_core.consistency.errors import ConsistencyError
from iad_core.storage.database import Database


@pytest.fixture
def local_dinov3_snapshot(tmp_path):
    pytest.importorskip('transformers')
    snapshot=tmp_path/'snapshot';snapshot.mkdir()
    (snapshot/'model.safetensors').write_bytes(b'profile test; not a model')
    config={'model_type':'dinov3_vit','architectures':['DINOv3ViTModel'],
        'hidden_size':768,'num_hidden_layers':12,'num_attention_heads':12,
        'intermediate_size':3072,'patch_size':16,'num_register_tokens':4,'num_channels':3,'use_gated_mlp':False}
    processor={'image_processor_type':'DINOv3ViTImageProcessorFast','size':{'height':224,'width':224},
        'do_resize':True,'do_rescale':True,'do_normalize':True,'resample':2,
        'rescale_factor':1/255,'image_mean':[.485,.456,.406],'image_std':[.229,.224,.225]}
    (snapshot/'config.json').write_text(json.dumps(config))
    (snapshot/'preprocessor_config.json').write_text(json.dumps(processor))
    return snapshot


def test_local_dinov3_snapshot_records_official_processor_and_artifact_changes(local_dinov3_snapshot):
    snapshot=local_dinov3_snapshot
    profile=EmbeddingProfile.create('dinov3_vitb16',str(snapshot))
    assert profile.backend=='transformers' and profile.pooling=='pooler_output'
    assert profile.input_size==224 and profile.resize_size==224
    assert profile.source_ref is None and profile.artifacts_sha256 and profile.runtime_version
    assert profile.weights_ref==str(snapshot/'model.safetensors')
    assert EmbeddingProfile.create('dinov3_vitb16',profile.weights_ref)==profile
    config=json.loads((snapshot/'config.json').read_text())
    config['layer_norm_eps']=1e-6
    (snapshot/'config.json').write_text(json.dumps(config))
    changed=EmbeddingProfile.create('dinov3_vitb16',str(snapshot))
    assert changed.profile_id!=profile.profile_id
    with pytest.raises(ConsistencyError,match='changed'):
        ImageFeatureExtractor(ImageEncoderConfig(profile=profile)).load()
    config['hidden_size']=384
    (snapshot/'config.json').write_text(json.dumps(config))
    with pytest.raises(ConsistencyError,match='backbone'):
        EmbeddingProfile.create('dinov3_vitb16',str(snapshot))


def test_local_dinov3_snapshot_preserves_hugging_face_blob_symlinks(local_dinov3_snapshot):
    snapshot=local_dinov3_snapshot
    weights=snapshot/'model.safetensors'
    blob=snapshot.parent/'weight-blob'
    weights.rename(blob);weights.symlink_to(blob)
    profile=EmbeddingProfile.create('dinov3_vitb16',str(snapshot))
    assert EmbeddingProfile.create('dinov3_vitb16',profile.weights_ref)==profile


def test_local_dinov3_preprocess_uses_official_rescale_before_resize(local_dinov3_snapshot):
    from transformers import DINOv3ViTImageProcessorFast
    profile=EmbeddingProfile.create('dinov3_vitb16',str(local_dinov3_snapshot))
    extractor=ImageFeatureExtractor(ImageEncoderConfig(profile=profile))
    image=Image.fromarray(np.random.default_rng(17).integers(0,256,(47,31,3),dtype=np.uint8))
    expected=DINOv3ViTImageProcessorFast.from_pretrained(str(local_dinov3_snapshot),local_files_only=True)(
        image,return_tensors='pt')['pixel_values'][0]
    actual=extractor.preprocess(image)
    assert tuple(actual.shape)==(3,224,224)
    assert np.array_equal(actual.numpy(),expected.numpy())


def test_real_local_dinov3_rejects_changed_processor_and_incomplete_checkpoint(tmp_path):
    checkpoint=os.environ.get('IAD_TEST_DINOV3_SNAPSHOT')
    if not checkpoint:
        pytest.skip('Set IAD_TEST_DINOV3_SNAPSHOT to validate real local DINOv3 artifacts')
    from safetensors import safe_open
    from safetensors.torch import save_file
    snapshot=tmp_path/'snapshot';snapshot.mkdir()
    for name in ('config.json','preprocessor_config.json'):
        shutil.copyfile(Path(checkpoint)/name,snapshot/name)
    (snapshot/'model.safetensors').symlink_to(Path(checkpoint)/'model.safetensors')
    profile=EmbeddingProfile.create('dinov3_vitb16',str(snapshot))
    runtime=ImageEncoderRuntime()
    try:
        config=ImageEncoderConfig(profile=profile,device='cpu')
        checked=runtime.check(config)
        assert checked['dim']==768 and abs(checked['norm']-1)<1e-5
        processor=snapshot/'preprocessor_config.json'
        original=processor.read_bytes()
        document=json.loads(original)
        document['size']={'height':256,'width':256}
        processor.write_text(json.dumps(document))
        with pytest.raises(ConsistencyError,match='changed'):
            runtime.check(config)
        processor.write_bytes(original)
    finally:
        runtime.close()
    with safe_open(str(snapshot/'model.safetensors'),framework='pt',device='cpu') as weights:
        one_parameter=weights.get_tensor('norm.bias')
    (snapshot/'model.safetensors').unlink()
    save_file({'norm.bias':one_parameter},str(snapshot/'model.safetensors'))
    incomplete=EmbeddingProfile.create('dinov3_vitb16',str(snapshot))
    with pytest.raises(ConsistencyError,match='strictly match'):
        ImageFeatureExtractor(ImageEncoderConfig(profile=incomplete)).encode_batch([Image.new('RGB',(31,47),'red')])


def test_profile_identity_includes_actual_weights_and_preprocessing(tmp_path):
    weights=tmp_path/'weights.pt';weights.write_bytes(b'not-a-model')
    first=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    assert first.dim==512 and first.input_size==320 and first.backend=='torchscript'
    assert first.pooling=='serialized_global' and first.processor=='sscd_skew320'
    assert first.resize_mode=='stretch' and first.crop=='none' and first.interpolation=='bilinear'
    assert first.mean==(.485,.456,.406) and first.std==(.229,.224,.225)
    assert first.profile_id==EmbeddingProfile.create('sscd_disc_mixup',str(weights)).profile_id
    weights.write_bytes(b'different-weights')
    second=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    assert second.profile_id!=first.profile_id
    with pytest.raises(ValidationError,match='backbone'):
        EmbeddingProfile.model_validate({**second.model_dump(),'dim':768})
    assert EmbeddingProfile.create('sscd_disc_mixup',str(weights),storage_dtype='float16').profile_id!=second.profile_id


def test_image_configuration_is_separate_from_chat_and_uses_optimistic_revision(tmp_path):
    db=Database(str(tmp_path/'settings.db'))
    weights=tmp_path/'model.pt';weights.write_bytes(b'invalid')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    settings=ImageEncoders(db)
    assert settings.read().revision==0 and settings.read().selection is None
    config=ImageEncoderConfig(profile=profile,device='cpu',batch_size=4,gpu_memory_mb=2048)
    saved=settings.save(ImageEncoderEdit(expected_revision=0,selection=config))
    assert saved.revision==1 and saved.selection.profile==profile
    assert ImageEncoders(Database(db.db_path)).read()==saved
    from iad_core.workbench.model_settings import WorkbenchModels
    assert WorkbenchModels(db).read().selection is None
    with pytest.raises(ValueError,match='配置已变化'):
        settings.save(ImageEncoderEdit(expected_revision=0,selection=config))
    with pytest.raises(ValidationError):
        ImageEncoderConfig(profile=profile,device='cuda',batch_size=0)


def test_missing_changed_and_invalid_weights_fail_without_fallback(tmp_path):
    with pytest.raises(ConsistencyError) as missing:
        EmbeddingProfile.create('sscd_disc_mixup',str(tmp_path/'missing.pt'))
    assert missing.value.code=='ENCODER_UNAVAILABLE'
    weights=tmp_path/'broken.pt';weights.write_bytes(b'broken-model')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    extractor=ImageFeatureExtractor(ImageEncoderConfig(profile=profile,device='cpu'))
    with pytest.raises(ConsistencyError) as broken:
        extractor.encode_batch([Image.new('RGB',(20,30),'red')])
    assert broken.value.code=='ENCODER_UNAVAILABLE'
    weights.write_bytes(b'changed-model')
    with pytest.raises(ConsistencyError,match='changed'):
        ImageFeatureExtractor(ImageEncoderConfig(profile=profile,device='cpu')).encode_batch([Image.new('RGB',(20,30),'red')])


def test_configured_color_conversion_preserves_alpha_and_16bit_rules(tmp_path):
    weights=tmp_path/'unused.pt';weights.write_bytes(b'not loaded by preprocessing')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    extractor=ImageFeatureExtractor(ImageEncoderConfig(profile=profile,device='cpu'))
    rgba=Image.new('RGBA',(17,23),(255,0,0,0))
    tensor=extractor.preprocess(rgba)
    assert tuple(tensor.shape)==(3,320,320)
    expected=(np.array([1,1,1])-np.array([.485,.456,.406]))/np.array([.229,.224,.225])
    assert np.allclose(tensor[:,0,0].numpy(),expected,atol=1e-6)
    integer=Image.fromarray(np.full((17,23),257*128,dtype=np.uint16))
    result=extractor.preprocess(integer)
    expected=(np.array([128/255]*3)-np.array([.485,.456,.406]))/np.array([.229,.224,.225])
    assert np.allclose(result[:,0,0].numpy(),expected,atol=1e-6)
    assert rgba.mode=='RGBA' and rgba.getpixel((0,0))==(255,0,0,0)


def test_profile_and_settings_import_without_torch(tmp_path):
    interpreter=Path('/tmp/iad-consistency-cpu/bin/python')
    if not interpreter.exists():
        pytest.skip('The separate base-only environment is not installed')
    code='''
import importlib.util,sys
from iad_core.feature.profiles import ImageEncoders
from iad_core.feature.encoder import ImageFeatureExtractor
from iad_core.storage.database import Database
assert importlib.util.find_spec('torch') is None
assert ImageEncoders(Database(sys.argv[1])).read().selection is None
assert 'torch' not in sys.modules
'''
    result=subprocess.run([str(interpreter),'-c',code,str(tmp_path/'cpu.db')],capture_output=True,text=True,timeout=20)
    assert result.returncode==0,result.stderr


def test_feature_preparation_reports_encoder_failure_without_publishing_fake_coverage(dataset,tmp_path):
    from iad_core.feature.builder import build_features,get_feature_stats
    db,_,config=dataset
    weights=tmp_path/'broken.pt';weights.write_bytes(b'broken encoder')
    profile=EmbeddingProfile.create('sscd_disc_mixup',str(weights))
    ImageEncoders(db).save(ImageEncoderEdit(expected_revision=0,selection=ImageEncoderConfig(profile=profile,device='cpu')))
    with pytest.raises(ConsistencyError) as error:
        build_features(config.task.task_id,db_path=db.db_path,output_dir=str(tmp_path/'output'))
    assert error.value.code=='ENCODER_UNAVAILABLE'
    assert get_feature_stats(config.task.task_id,db_path=db.db_path)['cached_features']==0
