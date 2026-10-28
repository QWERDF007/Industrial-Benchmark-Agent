"""Measure strict-pixel reuse and full annotation coverage for a real-image duplicate group."""

import argparse
import json
import resource
import shutil
import sys
import tempfile
import threading
import time
from pathlib import Path

from PIL import Image

from iad_core.consistency.models import ConsistencyStart
from iad_core.consistency.result_queries import ConsistencyQuery,ResultQueries
from iad_core.consistency.group_queries import GroupQueries,GroupQuery,GroupMemberQuery
from iad_core.dataset.registry import DatasetImport,DatasetRegistry
from iad_core.duplicate.pixels import PixelContent
from iad_core.storage.database import Database
from iad_core.workbench.runtime import WorkbenchRuntime


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--image',type=Path,required=True)
    parser.add_argument('--members',type=int,default=80)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    if args.members<2:parser.error('A duplicate group needs at least two members')
    with Image.open(args.image) as image:width,height=image.size
    with tempfile.TemporaryDirectory(prefix='iad-real-group-') as directory:
        root=Path(directory);folders=[root/'left',root/'right']
        for folder in folders:folder.mkdir()
        for index in range(args.members):
            destination=folders[index%2]/(f'{index:04}'+args.image.suffix)
            shutil.copyfile(args.image,destination)
            destination.with_suffix('.json').write_text(json.dumps({'imageWidth':width,'imageHeight':height,'shapes':[
                {'label':'surface-b' if index==args.members-1 else 'surface-a','shape_type':'rectangle','points':[[2,2],[10,10]]}]}))
        db=Database(str(root/'group.db'));registry=DatasetRegistry(db)
        policy={'policy_id':'real-group-policy','annotation_role':'REFERENCE','annotation_coverage':'EXHAUSTIVE'}
        for folder in folders:
            registry.import_labelme(DatasetImport(format='labelme',name=folder.name,image_dir=str(folder),annotation_dir=str(folder),annotation_policy=policy))
        comparisons=0;guard=threading.Lock()
        def profile(frame,event,arg):
            nonlocal comparisons
            if event=='call' and frame.f_code is PixelContent.compare.__code__:
                with guard:comparisons+=1
        previous=threading.getprofile();threading.setprofile(profile)
        runtime=WorkbenchRuntime(db);started=time.perf_counter()
        try:
            batch=runtime.consistency.start(ConsistencyStart(subjects={'kind':'all_registered'},request_id='real-duplicate-group'))
            deadline=time.monotonic()+600
            while time.monotonic()<deadline:
                state=runtime.consistency.status(batch.batch_id)
                if state.status not in ('PENDING','RUNNING'):break
                time.sleep(.1)
            elapsed=time.perf_counter()-started
            assert state.status=='COMPLETED' and state.completed==state.total==args.members
            assert state.pair_count==args.members*(args.members-1)//2
            conflicts=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'batch','batch_id':state.batch_id},confirmed_conflict=True,page_size=100))
            assert conflicts.total==args.members-1
            groups=GroupQueries(db).query(GroupQuery(query_id=conflicts.query_id))
            assert groups.total==1 and groups.items[0].member_count==args.members
            last=GroupQueries(db).members(GroupMemberQuery(query_id=conflicts.query_id,group_id=groups.items[0].group_id,page=(args.members-1)//20+1,page_size=20))
            assert last.total==args.members and len(last.items)>0
            assert 1<=comparisons<=args.members
            assert len(state.children)==2 and all(child.model_calls==[] for child in state.children)
            assert not any(package in sys.modules for package in ('torch','faiss','transformers'))
            evidence=list((root/'evidence/consistency/images').glob('*.png'))
            assert len(evidence)==1
            report={'source_image':str(args.image),'source_size':[width,height],'samples':state.total,'datasets':len(state.children),
                'full_pixel_comparisons':comparisons,'pair_results':state.pair_count,'last_member_conflicts':conflicts.total,
                'seconds_with_profiler':elapsed,'peak_process_rss_mib':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss/1024,
                'database_and_wal_bytes':sum(path.stat().st_size for path in root.glob('group.db*') if path.is_file()),
                'retained_image_count':len(evidence),'retained_image_bytes':sum(path.stat().st_size for path in evidence),
                'no_encoder_import':True,'batch':state.model_dump(mode='json')}
            args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
            print(json.dumps({key:value for key,value in report.items() if key!='batch'},ensure_ascii=False))
        finally:runtime.close();threading.setprofile(previous)


if __name__=='__main__':main()
