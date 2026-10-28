"""Verify shared features using real model weights and industrial source images."""

import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path
from PIL import Image

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.feature.builder import build_features
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig, ImageEncoderEdit, ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profiles-file',type=Path,required=True)
    parser.add_argument('--model-id',required=True)
    parser.add_argument('--image',type=Path,action='append',required=True)
    parser.add_argument('--device',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if len(args.image)!=2:
        parser.error('Provide two different industrial source images')
    profile=EmbeddingProfile.create(**next(item for item in json.loads(args.profiles_file.read_text()) if item['model_id']==args.model_id))
    config=ImageEncoderConfig(profile=profile,device=args.device,batch_size=2,gpu_memory_mb=12288)
    runtime=ImageEncoderRuntime()
    try:
        with tempfile.TemporaryDirectory(prefix='iad-real-content-features-') as temporary:
            root=Path(temporary)
            images,labels=root/'images',root/'labels'
            images.mkdir();labels.mkdir()
            for index in range(80):
                shutil.copyfile(args.image[0],images/(f'copy-{index:03}'+args.image[0].suffix))
            shutil.copyfile(args.image[1],images/('other'+args.image[1].suffix))
            db=Database(str(root/'test.db'))
            registry=DatasetRegistry(db)
            dataset=registry.import_labelme(DatasetImport(format='labelme',name='真实缓存验证',image_dir=str(images),annotation_dir=str(labels)))
            ImageEncoders(db).save(ImageEncoderEdit(expected_revision=0,selection=config))
            first=build_features(dataset.task.task_id,db_path=db.db_path,encoder_runtime=runtime,output_dir=str(root/'reports'))
            assert (first.total_samples,first.total_content,first.encoded_content_count,first.failed_count)==(81,2,2,0)
            assert first.completed_samples==81 and first.storage_bytes==2*profile.dim*4
            with Image.open(args.image[0]) as source_image:
                width,height=source_image.size
            (labels/'copy-000.json').write_text(json.dumps({'imageWidth':width,'imageHeight':height,'shapes':[
                {'label':'验证标注','shape_type':'rectangle','points':[[1,1],[4,4]]}]}),encoding='utf-8')
            registry.rescan(dataset.dataset.id)
            second=build_features(dataset.task.task_id,db_path=db.db_path,encoder_runtime=runtime,output_dir=str(root/'reports'))
            assert (second.encoded_content_count,second.cache_hit_count,second.completed_samples)==(0,2,81)
            repository=FeatureRepository(db)
            sample_id=dataset.dataset.id+':copy-000'+args.image[0].suffix
            original=repository.get_for_sample(sample_id,profile.profile_id)
            other=root/'copy-dataset';other.mkdir()
            shutil.copyfile(args.image[0],other/('last'+args.image[0].suffix))
            imported=registry.import_labelme(DatasetImport(format='labelme',name='跨集副本',image_dir=str(other),annotation_dir=str(labels)))
            cross=build_features(imported.task.task_id,db_path=db.db_path,encoder_runtime=runtime,output_dir=str(root/'other-report'))
            assert cross.encoded_content_count==0 and cross.cache_hit_count==1
            registry.delete(dataset.dataset.id)
            retained=repository.get_for_sample(imported.dataset.id+':last'+args.image[0].suffix,profile.profile_id)
            assert retained['embedding_blob']==original['embedding_blob'] and retained['attempt_count']==1
            registry.delete(imported.dataset.id)
            assert repository.get(original['content_group_id'],profile.profile_id) is None
            result={'profile':profile.model_dump(),'device':args.device,'source_images':[str(path) for path in args.image],
                'first':first.model_dump(),'after_annotation_rescan':second.model_dump(),'cross_dataset':cross.model_dump(),
                'retained_vector_sha256':hashlib.sha256(retained['embedding_blob']).hexdigest(),
                'retained_attempt_count':retained['attempt_count'],'last_member_removed':True}
        args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({key:value for key,value in result.items() if key not in ('profile','source_images')},ensure_ascii=False))
    finally:
        runtime.close()


if __name__=='__main__':
    main()
