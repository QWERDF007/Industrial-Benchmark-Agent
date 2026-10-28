"""Real-model cross-dataset index smoke; not a recall or scale acceptance benchmark."""

import argparse
import hashlib
import json
import resource
import shutil
import tempfile
import time
from pathlib import Path

import faiss
import numpy as np

from iad_core.dataset.registry import DatasetImport, DatasetRegistry
from iad_core.feature.cache import ContentFeatureCache
from iad_core.feature.encoder import ImageEncoderRuntime
from iad_core.feature.index import CorpusIndexes
from iad_core.feature.profiles import EmbeddingProfile, ImageEncoderConfig
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.storage.repositories import SampleRepository


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profiles-file',type=Path,required=True)
    parser.add_argument('--model-id',required=True)
    parser.add_argument('--image',type=Path,action='append',required=True)
    parser.add_argument('--device',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if len(args.image)!=2:parser.error('Provide two different industrial source images')
    profile=EmbeddingProfile.create(**next(item for item in json.loads(args.profiles_file.read_text()) if item['model_id']==args.model_id))
    config=ImageEncoderConfig(profile=profile,device=args.device,batch_size=2,gpu_memory_mb=12288)
    runtime=ImageEncoderRuntime()
    try:
        with tempfile.TemporaryDirectory(prefix='iad-real-corpus-index-') as temporary:
            root=Path(temporary)
            left,right,labels=root/'left',root/'right',root/'labels'
            left.mkdir();right.mkdir();labels.mkdir()
            for index,image in enumerate(args.image):shutil.copyfile(image,left/(str(index)+image.suffix))
            shutil.copyfile(args.image[0],right/('copy'+args.image[0].suffix))
            db=Database(str(root/'corpus.db'))
            registry=DatasetRegistry(db)
            datasets=[registry.import_labelme(DatasetImport(format='labelme',name=name,image_dir=str(images),annotation_dir=str(labels)))
                for name,images in [('left',left),('right',right)]]
            ids=[sample.sample_id for sample in SampleRepository(db).list_by_task(datasets[0].task.task_id)]
            ids.extend(sample.sample_id for sample in SampleRepository(db).list_by_task(datasets[1].task.task_id))
            prepared=ContentFeatureCache(db,runtime).prepare(ids,config)
            assert (prepared.total_samples,prepared.total_content,prepared.encoded_content_count)==(3,2,2)
            repository=FeatureRepository(db)
            source_id=datasets[0].dataset.id+':0'+args.image[0].suffix
            record=repository.get_for_sample(source_id,profile.profile_id)
            vector=np.frombuffer(record['embedding_blob'],dtype=record['dtype']).astype(np.float32).reshape(1,-1)
            with CorpusIndexes(db) as indexes:
                first=indexes.prepare({'kind':'all_registered'},profile.profile_id)
                assert first.vector_count==2 and first.member_count==3
                timings=[]
                with indexes.acquire({'kind':'all_registered'},profile.profile_id) as old:
                    for _ in range(100):
                        started=time.perf_counter()
                        with indexes.acquire({'kind':'all_registered'},profile.profile_id) as query:
                            hits=query.search(vector,top_k=2)[0]
                            assert hits[0].group_id==record['content_group_id'] and len(query.members(hits[0].group_id))==2
                        timings.append((time.perf_counter()-started)*1000)
                    warm=indexes.stats()
                    assert warm.builds==1 and warm.disk_loads==0 and warm.queries==100
                    registry.delete(datasets[0].dataset.id)
                    current=indexes.prepare({'kind':'all_registered'},profile.profile_id)
                    assert current.vector_count==1 and current.member_count==1 and old.info.vector_count==2
                    assert len(old.search(vector,top_k=2)[0])==2
                assert indexes.stats().resident_bytes==current.resident_bytes
                final=indexes.stats()
            with CorpusIndexes(db) as indexes:
                cold=indexes.prepare({'kind':'all_registered'},profile.profile_id)
                assert cold.generation==current.generation
                assert indexes.stats().disk_loads==1 and indexes.stats().builds==0
                cold_stats=indexes.stats()
            retained=repository.get_for_sample(datasets[1].dataset.id+':copy'+args.image[0].suffix,profile.profile_id)
            assert retained['attempt_count']==1 and retained['embedding_blob']==record['embedding_blob']
            result={'verification':'real-model cross-dataset index smoke','profile':profile.model_dump(),
                'model_device':args.device,'faiss_version':faiss.__version__,'faiss_cpu_threads':faiss.omp_get_max_threads(),
                'prepared':prepared.model_dump(),'initial_index':first.model_dump(),'warm':warm.model_dump(),
                'query_end_to_end_ms':timings,'query_p50_ms':float(np.percentile(timings,50)),
                'query_p95_ms':float(np.percentile(timings,95)),'after_delete':current.model_dump(),
                'final_stats':final.model_dump(),'cold_stats':cold_stats.model_dump(),
                'rss_peak_bytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*1024,
                'retained_vector_sha256':hashlib.sha256(retained['embedding_blob']).hexdigest(),
                'retained_feature_attempt_count':retained['attempt_count']}
        args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({key:result[key] for key in ('verification','query_p50_ms','query_p95_ms','rss_peak_bytes','warm','cold_stats')},ensure_ascii=False))
    finally:runtime.close()


if __name__=='__main__':main()
