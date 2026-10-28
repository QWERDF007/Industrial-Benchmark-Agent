"""Validated local Hugging Face DINOv3 artifacts; no network resolution."""

import hashlib
import json
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

from iad_core.consistency.errors import ConsistencyError


@dataclass(frozen=True)
class LocalDinoSnapshot:
    root: Path
    input_size: int
    artifacts_sha256: str
    runtime_version: str

    @classmethod
    def read(cls, root: Path) -> 'LocalDinoSnapshot':
        try:
            digest=hashlib.sha256()
            documents={}
            for name in ('config.json','preprocessor_config.json'):
                data=(root/name).read_bytes()
                digest.update(name.encode()+b'\0'+data)
                documents[name]=json.loads(data)
            config=documents['config.json']
            expected={'model_type':'dinov3_vit','hidden_size':768,'num_hidden_layers':12,
                'num_attention_heads':12,'intermediate_size':3072,'patch_size':16,
                'num_register_tokens':4,'num_channels':3}
            if any(config.get(key)!=value for key,value in expected.items()) or config.get('use_gated_mlp',False):
                raise ValueError('Local DINOv3 backbone must be ViT-B/16 with four register tokens')
            processor=documents['preprocessor_config.json']
            expected_processor={'image_processor_type':'DINOv3ViTImageProcessorFast',
                'do_resize':True,'do_rescale':True,'do_normalize':True,'resample':2,
                'rescale_factor':1/255,'image_mean':[.485,.456,.406],'image_std':[.229,.224,.225]}
            size=processor.get('size',{})
            input_size=size.get('height')
            if (any(processor.get(key)!=value for key,value in expected_processor.items())
                or processor.get('do_center_crop') or processor.get('do_convert_rgb')
                or type(input_size) is not int or input_size<=0 or input_size%16 or size!={'height':input_size,'width':input_size}):
                raise ValueError('Unsupported local DINOv3 image processor configuration')
            return cls(root,input_size,digest.hexdigest(),version('transformers'))
        except (OSError,ValueError,TypeError,AttributeError,PackageNotFoundError) as error:
            raise ConsistencyError('ENCODER_UNAVAILABLE',f'Local DINOv3: {error}') from error
