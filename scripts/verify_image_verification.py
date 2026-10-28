"""Verify strict identity and a one-bit defect using a supplied industrial image."""

import argparse
import json
import tempfile
from pathlib import Path

from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.duplicate.verify import PairVerifier


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    source=SourceImage.read(str(args.image))
    pixels=source.pixels()
    if pixels.descriptor.decode_status!='COMPLETE':raise ValueError(pixels.descriptor.reason)
    verifier=PairVerifier()
    with tempfile.TemporaryDirectory(prefix='iad-real-verification-') as temporary:
        root=Path(temporary)
        clone,defect=root/'clone.png',root/'defect.png'
        clone.write_bytes(pixels.png())
        image=pixels.image()
        before=image.getpixel((0,0))
        image.putpixel((0,0),((before[0]^1,*before[1:]) if isinstance(before,tuple) else before^1))
        image.save(defect)
        exact=verifier.verify(str(args.image),str(clone))
        near=verifier.verify(str(args.image),str(defect),regions=[[0,0,2,2],[0,0,1,1]])
        assert exact.relation=='EXACT' and exact.pixel.changed_pixels==0
        assert near.relation=='NEAR_CANDIDATE' and near.pixel.changed_pixels==near.pixel.max_abs_diff==1
        assert near.local.compared_pixels==4 and near.local.changed_pixels==1
        assert near.registration.status=='UNSUPPORTED'
        args.output.write_text(json.dumps({'source':str(args.image),'source_sha256':source.sha256,
            'descriptor':pixels.descriptor.model_dump(mode='json'),'exact':exact.model_dump(mode='json'),
            'one_bit_defect':near.model_dump(mode='json')},ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'source_size':[pixels.descriptor.width,pixels.descriptor.height],
            'lossless_clone':exact.relation,'one_bit_defect':near.relation,'changed_pixels':near.pixel.changed_pixels,
            'max_abs_diff':near.pixel.max_abs_diff,'local_union_pixels':near.local.compared_pixels},ensure_ascii=False))


if __name__=='__main__':main()
