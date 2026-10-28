import threading
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np
from PIL import Image

from iad_core.consistency.errors import ConsistencyError
from iad_core.feature.base import FeatureExtractor
from iad_core.feature.profiles import ImageEncoderConfig

if TYPE_CHECKING:
    import torch


class ImageFeatureExtractor(FeatureExtractor):
    def __init__(self, config: ImageEncoderConfig):
        self.config=ImageEncoderConfig.model_validate(config)
        self.profile=self.config.profile
        self.model_id,self.profile_id=self.profile.model_id,self.profile.profile_id
        self.dim,self.dtype_str=self.profile.dim,{'float32':'fp32','float16':'fp16'}[self.profile.storage_dtype]
        self._model=None
        self._transform=None
        self._lock=threading.RLock()

    def preprocess(self, image) -> 'torch.Tensor':
        try:
            import torch
            from torchvision import transforms as transforms
        except ImportError as error:
            raise ConsistencyError('ENCODER_UNAVAILABLE', 'Install the encoders optional dependencies') from error
        if self._transform is None:
            normal=transforms.Normalize(self.profile.mean,self.profile.std)
            interpolation=getattr(transforms.InterpolationMode,self.profile.interpolation.upper())
            if self.profile.backend=='transformers':
                from transformers import DINOv3ViTImageProcessorFast
                self._transform=DINOv3ViTImageProcessorFast.from_pretrained(
                    str(Path(self.profile.weights_ref).parent),local_files_only=True)
            elif self.profile.processor=='dinov2_imagenet_eval':
                self._transform=transforms.Compose([transforms.Resize(self.profile.resize_size,interpolation=interpolation),
                    transforms.CenterCrop(self.profile.input_size),transforms.ToTensor(),normal])
            elif self.profile.processor=='dinov3_lvd_eval':
                from torchvision.transforms import v2
                self._transform=v2.Compose([v2.ToImage(),v2.Resize((self.profile.resize_size,self.profile.resize_size),interpolation=interpolation,antialias=True),
                    v2.ToDtype(torch.float32,scale=True),v2.Normalize(self.profile.mean,self.profile.std)])
            else:
                self._transform=transforms.Compose([transforms.Resize((self.profile.resize_size,self.profile.resize_size),interpolation=interpolation),transforms.ToTensor(),normal])
        owned=not isinstance(image,Image.Image)
        original=None
        try:
            original=Image.open(image) if isinstance(image,(str,Path)) else Image.fromarray(image) if isinstance(image,np.ndarray) else image
            if not isinstance(original,Image.Image):
                raise ValueError('Unsupported image input')
            if getattr(original,'n_frames',1)!=1:
                raise ValueError('Multi-frame image encoding is unsupported')
            if original.mode in ('I;16','I;16L','I;16B','I;16N') or (original.mode=='I' and original.format=='PNG'):
                pixels=np.asarray(original,dtype=np.float32)
                rgb=Image.fromarray(np.rint(pixels/257).clip(0,255).astype(np.uint8)).convert('RGB')
            elif original.mode in ('RGBA','LA') or (original.mode=='P' and 'transparency' in original.info):
                rgba=original.convert('RGBA')
                rgb=Image.alpha_composite(Image.new('RGBA',rgba.size,(255,255,255,255)),rgba).convert('RGB')
            elif original.mode in ('1','L','RGB','P'):
                rgb=original.convert('RGB')
            else:
                raise ValueError('Unsupported image mode: '+original.mode)
            if self.profile.backend=='transformers':
                return self._transform(rgb,return_tensors='pt')['pixel_values'][0]
            return self._transform(rgb)
        except (OSError,ValueError,TypeError) as error:
            raise ConsistencyError('UNSUPPORTED_IMAGE',str(error)) from error
        finally:
            if owned and original is not None and isinstance(original,Image.Image):
                original.close()

    def load(self) -> None:
        with self._lock:
            if self._model is not None:
                return
            self.profile.verify_artifacts()
            try:
                import torch
                device=torch.device(self.config.device)
                if device.type=='cuda':
                    if not torch.cuda.is_available() or device.index>=torch.cuda.device_count():
                        raise ValueError('Configured CUDA device is unavailable')
                    total=torch.cuda.get_device_properties(device).total_memory
                    torch.cuda.set_per_process_memory_fraction(min(1,self.config.gpu_memory_mb*1024**2/total),device)
                if self.profile.backend=='torchscript':
                    model=torch.jit.load(self.profile.weights_ref,map_location='cpu')
                    if model.backbone.original_name!='ResNet50' or tuple(model.embeddings._modules['1'].weight.shape)!=(512,2048):
                        raise ValueError('SSCD checkpoint does not contain the expected ResNet50 global head')
                elif self.profile.backend=='transformers':
                    from transformers import DINOv3ViTModel
                    model,loading=DINOv3ViTModel.from_pretrained(
                        str(Path(self.profile.weights_ref).parent),local_files_only=True,
                        use_safetensors=True,output_loading_info=True)
                    if any(loading.get(key) for key in ('missing_keys','unexpected_keys','mismatched_keys','error_msgs')):
                        raise ValueError('Local DINOv3 checkpoint does not strictly match its backbone: '+str(loading))
                    if model.config.hidden_size!=self.profile.dim:
                        raise ValueError('Backbone dimension differs from the configured profile')
                else:
                    import sys
                    from importlib import import_module
                    package=self.profile.model_id.split('_')[0]
                    imported=sys.modules.get(package)
                    if imported and not Path(imported.__file__).resolve().is_relative_to(Path(self.profile.source_ref)):
                        raise ValueError('Another model source is already imported; restart the worker before changing source')
                    sys.path.insert(0,self.profile.source_ref)
                    try:
                        factory=getattr(import_module(package+'.hub.backbones'),self.profile.model_id)
                        model=factory(pretrained=False)
                    finally:
                        sys.path.remove(self.profile.source_ref)
                    state=torch.load(self.profile.weights_ref,map_location='cpu',weights_only=True)
                    model.load_state_dict(state,strict=True)
                    if getattr(model,'embed_dim',None)!=self.profile.dim:
                        raise ValueError('Backbone dimension differs from the configured profile')
                dtype=torch.float16 if self.config.compute_dtype=='float16' else torch.float32
                self._model=model.eval().to(device=device,dtype=dtype)
            except Exception as error:
                self._model=None
                raise ConsistencyError('ENCODER_UNAVAILABLE',f'{self.model_id}: {error}') from error

    def encode_batch(self, images) -> np.ndarray:
        if not images:
            return np.empty((0,self.dim),dtype=self.profile.storage_dtype)
        with self._lock:
            self.load()
            import torch
            vectors=[]
            dtype=torch.float16 if self.config.compute_dtype=='float16' else torch.float32
            try:
                for start in range(0,len(images),self.config.batch_size):
                    batch=torch.stack([self.preprocess(image) for image in images[start:start+self.config.batch_size]])
                    batch=batch.to(device=self.config.device,dtype=dtype)
                    with torch.inference_mode():
                        if self.profile.pooling=='x_norm_clstoken':
                            output=self._model.forward_features(batch)['x_norm_clstoken']
                        elif self.profile.pooling=='pooler_output':
                            output=self._model(pixel_values=batch).pooler_output
                        else:
                            output=self._model(batch)
                        if output.ndim!=2 or tuple(output.shape)!=(len(batch),self.dim) or not torch.isfinite(output).all():
                            raise ValueError('Model returned invalid dimensions or non-finite features')
                        output=output.float()
                        norms=torch.linalg.vector_norm(output,dim=-1,keepdim=True)
                        if (norms<=1e-12).any():
                            raise ValueError('Model returned zero feature vectors')
                        vectors.append((output/norms).cpu().numpy())
                result=np.concatenate(vectors).astype(self.profile.storage_dtype)
                if not np.isfinite(result).all():
                    raise ValueError('Stored features must be finite')
                return result
            except ConsistencyError:
                raise
            except Exception as error:
                raise ConsistencyError('ENCODER_UNAVAILABLE',f'Image encoding failed: {error}') from error

    def close(self) -> None:
        with self._lock:
            if self._model is None:
                return
            self._model=None
            if self.config.device.startswith('cuda:'):
                import torch
                with torch.cuda.device(self.config.device):
                    torch.cuda.empty_cache()


@dataclass(frozen=True)
class EncoderRuntimeStats:
    instances_created: int
    encode_calls: int


class ImageEncoderRuntime:
    """Serialize model switches and batches; keep one loaded encoder per worker."""

    def __init__(self):
        self._lock=threading.RLock()
        self._encoder: ImageFeatureExtractor | None = None
        self._instances_created=0
        self._encode_calls=0

    def encode(self, config: ImageEncoderConfig, images) -> np.ndarray:
        with self._lock:
            if self._encoder is None or any(getattr(self._encoder.config, field) != getattr(config, field)
                    for field in ('profile', 'device', 'gpu_memory_mb', 'compute_dtype')):
                self.close()
                self._encoder=ImageFeatureExtractor(config)
                self._instances_created+=1
            else:
                self._encoder.config=config
            self._encode_calls+=1
            return self._encoder.encode_batch(images)

    def stats(self) -> EncoderRuntimeStats:
        with self._lock:
            return EncoderRuntimeStats(self._instances_created,self._encode_calls)

    def check(self, config: ImageEncoderConfig) -> dict:
        config.profile.verify_artifacts()
        vectors=self.encode(config,[Image.new('RGB',(config.profile.input_size,config.profile.input_size),(127,127,127))])
        return {'profile_id':config.profile.profile_id,'model_id':config.profile.model_id,'device':config.device,
            'dim':vectors.shape[1],'dtype':str(vectors.dtype),'norm':float(np.linalg.norm(vectors[0].astype(np.float32)))}

    def close(self) -> None:
        with self._lock:
            if self._encoder is not None:
                self._encoder.close()
                self._encoder=None
