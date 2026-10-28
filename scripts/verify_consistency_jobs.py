"""Exercise cross-dataset batches with actual industrial images and local weights."""

import argparse
import json
import shutil
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image

from iad_core.consistency.models import ConsistencyStart,ImageIndexPrepare
from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
from iad_core.consistency.reports import ConsistencyReports
from iad_core.consistency.group_queries import GroupQueries,GroupQuery,GroupMemberQuery
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.feature.profiles import EmbeddingProfile,ImageEncoderConfig,ImageEncoderEdit,ImageEncoders
from iad_core.storage.database import Database
from iad_core.storage.features import FeatureRepository
from iad_core.workbench.runtime import close_workbenches,workbench


def wait_batch(runtime,identity):
    deadline=time.monotonic()+180
    while time.monotonic()<deadline:
        state=runtime.consistency.status(identity)
        assert state.completed+state.failed+state.unprocessed==state.total
        if state.status not in ('PENDING','RUNNING'):return state
        time.sleep(.05)
    raise TimeoutError('Batch did not reach a terminal state')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profiles-file',type=Path,required=True)
    parser.add_argument('--model-id',required=True)
    parser.add_argument('--device',required=True)
    parser.add_argument('--image',type=Path,action='append',required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if len(args.image)!=2:parser.error('Provide two distinct industrial source images')
    profile=EmbeddingProfile.create(**next(value for value in json.loads(args.profiles_file.read_text()) if value['model_id']==args.model_id))
    try:
        with tempfile.TemporaryDirectory(prefix='iad-real-batch-') as temporary:
            root=Path(temporary);db=Database(str(root/'batch.db'));registry=DatasetRegistry(db)
            policy={'policy_id':'industrial-batch-policy','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}
            configs=[]
            for directory,images in [('subjects',[(args.image[0],'surface-a'),(args.image[1],'surface-a')]),('corpus',[(args.image[0],'surface-b')])]:
                folder=root/directory;folder.mkdir()
                for index,(source,label) in enumerate(images):
                    destination=folder/(str(index)+source.suffix);shutil.copyfile(source,destination)
                    with Image.open(source) as image:width,height=image.size
                    destination.with_suffix('.json').write_text(json.dumps({'imageWidth':width,'imageHeight':height,
                        'shapes':[{'label':label,'shape_type':'rectangle','points':[[2,2],[10,10]]}]}))
                configs.append(registry.import_labelme(DatasetImport(format='labelme',name=directory,image_dir=str(folder),annotation_dir=str(folder),annotation_policy=policy)))
            runtime=workbench(db.db_path)
            exact_request=ConsistencyStart(subjects={'kind':'all_registered'},mode='exact',request_id='real-exact')
            exact=wait_batch(runtime,runtime.consistency.start(exact_request).batch_id)
            assert exact.status=='COMPLETED' and exact.completed==exact.total==3 and exact.pair_count==1
            assert not any(package in sys.modules for package in ('torch','faiss','transformers'))
            original=runtime.consistency.results(exact.batch_id)[0]
            selection=ImageEncoderConfig(profile=profile,device=args.device,batch_size=2)
            ImageEncoders(db).save(ImageEncoderEdit(expected_revision=0,selection=selection))
            started=time.perf_counter()
            prepared=wait_batch(runtime,runtime.consistency.prepare(ImageIndexPrepare(request_id='real-index')).batch_id)
            index_seconds=time.perf_counter()-started
            assert prepared.status=='COMPLETED' and prepared.completed==3 and len(prepared.children)==2
            with runtime.indexes.acquire(prepared.scopes.corpus,profile.profile_id) as index:
                index_info=index.info.model_dump(mode='json')
                assert index.info.vector_count==2 and index.info.member_count==3
                groups=list(index.group_ids)
            records=FeatureRepository(db).records(groups,profile.profile_id)
            attempts={row['content_group_id']:row['attempt_count'] for row in records}
            assert len(attempts)==2 and set(attempts.values())=={1}
            started=time.perf_counter()
            combined=wait_batch(runtime,runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},mode='combined',request_id='real-combined')).batch_id)
            comparison_seconds=time.perf_counter()-started
            assert combined.status=='COMPLETED' and combined.completed==3 and combined.pair_count==3
            assert [child.job_type for child in combined.children]==['IMAGE_INDEX','IMAGE_INDEX','DATA_CONSISTENCY','DATA_CONSISTENCY']
            assert {child.dataset_id for child in combined.children}=={config.dataset.id for config in configs}
            assert all(child.model_profile is None and child.model_calls==[] for child in combined.children)
            assert {row['content_group_id']:row['attempt_count'] for row in FeatureRepository(db).records(groups,profile.profile_id)}==attempts
            query=ResultQueries(db);page=query.query(ConsistencyQuery(selection={'kind':'batch','batch_id':combined.batch_id},page_size=1));results=[]
            while True:
                results.extend(page.items)
                if not page.next_cursor:break
                page=query.query(ConsistencyQuery(selection={'kind':'batch','batch_id':combined.batch_id},page_size=1,cursor=page.next_cursor))
            assert len(results)==len({item.result.result_id for item in results})==3
            assert original.evidence_id in {item.result.evidence_id for item in results}
            assert runtime.consistency.start(exact_request).batch_id==exact.batch_id
            assert runtime.consistency.retry(combined.batch_id,request_id='real-no-work').kind=='no_work'
            selection={'kind':'scope','subjects':{'kind':'all_registered'},'mode':'combined','profile_id':profile.profile_id}
            scope_report=ConsistencyReports(db).report(ConsistencyQuery(selection=selection))
            assert scope_report.page.execution.completed==scope_report.page.execution.total==3
            assert scope_report.page.retrieval_completeness=='TOP_K'
            assert scope_report.statistics.current.pairs==3 and scope_report.statistics.current.strict_groups==1
            groups_page=GroupQueries(db).query(GroupQuery(query_id=scope_report.page.query_id))
            assert groups_page.total==1 and groups_page.items[0].member_count==2 and groups_page.items[0].dataset_count==2
            members_page=GroupQueries(db).members(GroupMemberQuery(query_id=scope_report.page.query_id,group_id=groups_page.items[0].group_id))
            assert members_page.total==2
            for config in configs:registry.rescan(config.dataset.id)
            refreshed=ConsistencyReports(db).report(ConsistencyQuery(selection=selection))
            assert refreshed.page.total==0 and refreshed.page.execution.completed==0 and refreshed.page.execution.pending==3
            historical=ConsistencyReports(db).report(ConsistencyQuery(selection={**selection,'facts':'HISTORICAL'}))
            assert historical.statistics.historical.pairs==3
            copies=root/'batch-query-copies';copies.mkdir()
            for index in range(4):
                shutil.copyfile(args.image[0],copies/(str(index)+args.image[0].suffix))
            copied=registry.import_labelme(DatasetImport(format='labelme',name='同内容批量查询',image_dir=str(copies),annotation_dir=str(copies),annotation_policy=policy))
            before_queries=runtime.indexes.stats()
            batched=wait_batch(runtime,runtime.consistency.start(ConsistencyStart(
                subjects={'kind':'datasets','dataset_ids':[copied.dataset.id]},
                corpus_scope={'kind':'datasets','dataset_ids':[configs[1].dataset.id]},
                mode='combined',request_id='real-deduplicated-query-batch')).batch_id)
            after_queries=runtime.indexes.stats()
            assert batched.status=='COMPLETED' and batched.completed==batched.total==4
            assert after_queries.search_batches-before_queries.search_batches==1
            assert after_queries.queries-before_queries.queries==1
            assert {row['content_group_id']:row['attempt_count'] for row in FeatureRepository(db).records(groups,profile.profile_id)}==attempts
            report={'source_images':[str(image) for image in args.image],'profile_id':profile.profile_id,'device':args.device,
                'index_seconds':index_seconds,'comparison_seconds':comparison_seconds,'encoded_contents':len(attempts),
                'cached_feature_attempts_unchanged':True,'exact_evidence_reused':True,'no_chat_model_calls':True,
                'batched_query_samples':batched.total,'batched_query_search_calls':after_queries.search_batches-before_queries.search_batches,
                'batched_unique_query_vectors':after_queries.queries-before_queries.queries,
                'index':index_info,'exact_batch':exact.model_dump(mode='json'),'combined_batch':combined.model_dump(mode='json'),
                'results':[item.model_dump(mode='json') for item in results],
                'scope_report':scope_report.model_dump(mode='json'),'historical_report':historical.model_dump(mode='json'),
                'strict_groups':groups_page.model_dump(mode='json'),'strict_members':members_page.model_dump(mode='json')}
            args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
            print(json.dumps({key:value for key,value in report.items() if key not in ('index','exact_batch','combined_batch','results','scope_report','historical_report','strict_groups','strict_members')},ensure_ascii=False))
    finally:close_workbenches()


if __name__=='__main__':main()
