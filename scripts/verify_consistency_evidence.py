"""Verify retained consistency evidence using an actual industrial image; no model inference."""

import argparse
import hashlib
import io
import json
import shutil
import sys
import tempfile
import zipfile
from uuid import uuid4
from pathlib import Path

from PIL import Image

from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.service import ConsistencyService
from iad_core.consistency.review import ConsistencyReview
from iad_core.consistency.review_models import ConsistencyReviewSubmission, CorrectionVerification
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.duplicate.pixels import PixelContent
from iad_core.storage.database import Database


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image',type=Path,required=True)
    parser.add_argument('--output-dir',type=Path,required=True)
    args=parser.parse_args();args.output_dir.mkdir(parents=True,exist_ok=True)
    original=PixelContent.read(args.image)
    assert original.descriptor.decode_status=='COMPLETE'
    width,height=original.descriptor.width,original.descriptor.height
    box=[max(1,width//4),max(1,height//4),max(3,width//2),max(3,height//2)]
    with tempfile.TemporaryDirectory(prefix='iad-real-evidence-') as temporary:
        root=Path(temporary);images=root/'images';images.mkdir()
        for name,label in [('left','surface-a'),('right','surface-b')]:
            shutil.copyfile(args.image,images/(name+args.image.suffix))
            (images/(name+'.json')).write_text(json.dumps({'imageWidth':width,'imageHeight':height,
                'shapes':[{'label':label,'shape_type':'rectangle','points':[box[:2],box[2:]]}]}))
        db=Database(str(root/'workbench.db'));registry=DatasetRegistry(db)
        config=registry.import_labelme(DatasetImport(format='labelme',name='实际工业图证据',image_dir=str(images),annotation_dir=str(images),
            annotation_policy={'policy_id':'same-industrial-policy','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}))
        service=ConsistencyService(db)
        result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':left'+args.image.suffix,sample_b=config.dataset.id+':right'+args.image.suffix))
        assert result.verification.relation=='EXACT' and result.annotation.confirmed_conflict
        bundle=service.evidence(result.evidence_id)
        assert bundle.sources.left.image==bundle.sources.right.image
        review=ConsistencyReview(db)
        category=next(item for item in result.annotation.differences if item.type=='CATEGORY')
        label_path=images/'right.json';original_label=label_path.read_bytes()
        proposed=review.submit(ConsistencyReviewSubmission(client_request_id=uuid4(),evidence_id=result.evidence_id,
            result_id=result.result_id,difference_ids=[category.difference_id],reviewer='local-verification',comment='受控差异按原图核实',
            action={'kind':'PROPOSE_REGION_CHANGE','changes':[{'operation':'relabel','sample_id':bundle.parameters.sample_b,
                'annotation_id':category.right[0].annotation_id,'category':'surface-a'}]}))
        assert label_path.read_bytes()==original_label
        awaiting=review.verify(CorrectionVerification(client_request_id=uuid4(),decision_id=proposed.decision_id,
            evidence_id=result.evidence_id,reviewer='local-verification'))
        assert awaiting.correction_state=='AWAITING_RESCAN'
        applied=json.loads(original_label);applied['shapes'][0]['label']='surface-a';label_path.write_text(json.dumps(applied))
        registry.rescan(config.dataset.id)
        corrected=service.compare(ConsistencyCompare(sample_a=bundle.parameters.sample_a,sample_b=bundle.parameters.sample_b))
        verified=review.verify(CorrectionVerification(client_request_id=uuid4(),decision_id=proposed.decision_id,
            evidence_id=corrected.evidence_id,reviewer='local-verification'))
        assert verified.correction_state=='VERIFIED' and corrected.annotation.differences==[]
        shutil.rmtree(images);registry.delete(config.dataset.id)
        shutil.rmtree(root/'cache',ignore_errors=True)
        reopened=service.evidence(result.evidence_id)
        assert reopened.source_states.left==reopened.source_states.right=='MISSING'
        assert original.compare(PixelContent.read(service.evidence_media(result.evidence_id,'left-original')['path'])).exact_equal
        for side in ('left','right'):
            info=service.evidence_media(result.evidence_id,side+'-annotation_overlay')
            shutil.copyfile(info['path'],args.output_dir/(side+'-overlay.png'))
        artifact=service.evidence_export(result.evidence_id)
        exported=args.output_dir/'evidence.zip';shutil.copyfile(artifact.path,exported)
        with zipfile.ZipFile(exported) as archive:
            manifest=json.loads(archive.read('evidence.json'))
            for name in archive.namelist():
                if not name.startswith('assets/'):continue
                payload=archive.read(name)
                assert hashlib.sha256(payload).hexdigest()==Path(name).stem
                with Image.open(io.BytesIO(payload)) as image:image.load()
            source=archive.read(manifest['files']['left-original'])
            with Image.open(io.BytesIO(source)) as image:assert original.compare(PixelContent.read(image)).exact_equal
        assert not any(package in sys.modules for package in ('torch','faiss','transformers'))
        report={'verification':__doc__,'source':str(args.image),'source_size':[width,height],
            'controlled_annotation_review':review.context(result.evidence_id).model_dump(mode='json'),
            'retained_original_count':len({bundle.sources.left.image.sha256,bundle.sources.right.image.sha256}),
            'restored_after_source_dataset_and_preview_removal':True,'export':str(exported),
            'no_encoder_import':True,'bundle':reopened.model_dump(mode='json')}
        (args.output_dir/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({key:value for key,value in report.items() if key not in ('bundle','controlled_annotation_review')},ensure_ascii=False))


if __name__=='__main__':main()
