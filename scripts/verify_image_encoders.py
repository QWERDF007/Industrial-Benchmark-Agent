"""Verify configured real encoders; this is not a retrieval quality evaluation."""

import argparse
import hashlib
import json
import time
from pathlib import Path

import numpy as np
from PIL import Image

from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profiles-file',type=Path,required=True)
    parser.add_argument('--image',type=Path,action='append',required=True)
    parser.add_argument('--device',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    runtime=ImageEncoderRuntime()
    results=[]
    try:
        for item in json.loads(args.profiles_file.read_text(encoding='utf-8')):
            runtime.close()
            profile=EmbeddingProfile.create(**item)
            config=ImageEncoderConfig(profile=profile,device=args.device,batch_size=2,gpu_memory_mb=12288)
            if args.device.startswith('cuda:'):
                import torch
                torch.cuda.init()
                torch.cuda.reset_peak_memory_stats(torch.device(args.device))
            started=time.monotonic()
            vectors=runtime.encode(config,[str(p) for p in args.image])
            cold=time.monotonic()-started
            started=time.monotonic()
            repeated=runtime.encode(config,[str(p) for p in args.image])
            hot=time.monotonic()-started
            assert vectors.shape==(len(args.image),profile.dim)
            assert np.isfinite(vectors).all()
            norms=np.linalg.norm(vectors.astype(np.float32),axis=1)
            assert np.allclose(norms,1,atol=1e-3)
            assert np.array_equal(vectors,repeated)
            record={'profile':profile.model_dump(),'device':args.device,'images':[str(p) for p in args.image],
                'shape':list(vectors.shape),'norms':norms.tolist(),'cold_seconds':cold,'hot_seconds':hot,
                'vectors_sha256':hashlib.sha256(vectors.tobytes()).hexdigest(),'repeat_identical':True}
            record['image_shapes']=[]
            for path in args.image:
                with Image.open(path) as original:record['image_shapes'].append(list(original.size))
            if args.device.startswith('cuda:'):
                import torch
                record['peak_gpu_bytes']=torch.cuda.max_memory_allocated(torch.device(args.device))
            results.append(record)
            temporary=args.output.with_suffix('.tmp')
            temporary.write_text(json.dumps({'encoder_verification':results},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            temporary.replace(args.output)
            print(json.dumps({key:value for key,value in record.items() if key not in ('profile','images')},ensure_ascii=False),flush=True)
    finally:
        runtime.close()


if __name__=='__main__':
    main()
