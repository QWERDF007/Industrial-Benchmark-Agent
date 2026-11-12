import hashlib
import json
from collections import Counter
from pathlib import Path

import numpy as np

from iad_core.audit.profile_models import (AuditBenchmarkSource, AuditDatasetProfile, AuditGeometryProfile,
    AuditMetadataCoverage, AuditQuantiles)
from iad_core.benchmark.readiness import evaluate_track_readiness
from iad_core.dataset.registry import DatasetRegistry
from iad_core.duplicate.pair_repository import PairObservations
from iad_core.duplicate.relations import ContentRelations
from iad_core.gold.schemas import GoldRecord
from iad_core.split.builder import SplitResult
from iad_core.split.leakage import LeakageReport
from iad_core.split.group import physical_sample_key
from iad_core.storage.repositories import BenchmarkRepository
from iad_core.workbench.analysis_manifest import AnalysisManifest


class AuditDatasetProfiles:
    def __init__(self, db):
        self.db = db

    def freeze(self, manifest: AnalysisManifest, build_id: str | None = None) -> AuditDatasetProfile:
        records = manifest.records
        ids = {record.sample.sample_id for record in records}
        configs = {identity:DatasetRegistry(self.db).get(identity) for identity in manifest.dataset_ids}
        metadata = {}
        for name in ('physical_sample_id','capture_sequence_id','batch_id','station','camera','data_origin'):
            values = [str(getattr(record.sample,name).value if hasattr(getattr(record.sample,name),'value')
                else getattr(record.sample,name)) for record in records
                if getattr(record.sample,name) and (name!='data_origin' or record.sample.data_origin.value!='UNKNOWN')]
            if name=='physical_sample_id':
                values=[physical_sample_key(record.sample,configs[record.sample.dataset_id].split.physical_sample_scope)
                    for record in records if record.sample.physical_sample_id]
            distribution = Counter(values)
            metadata[name] = AuditMetadataCoverage(covered_images=len(values),
                distinct_count=len(distribution) if distribution else None,distribution=dict(distribution))
        geometry = None
        if records[0].dataset_format == 'labelme':
            measures = {key:[] for key in ('relative_area','relative_width','relative_height','aspect_ratio','center_x','center_y')}
            instance_counts = Counter()
            annotated_images = 0
            for record in records:
                boxes = [annotation.bbox for annotation in record.annotations if annotation.bbox and annotation.geometry_status=='VALID']
                instance_counts[str(len(boxes))] += 1
                annotated_images += bool(boxes)
                for x0,y0,x1,y1 in boxes:
                    width,height = x1-x0,y1-y0
                    values = dict(relative_area=width*height/(record.sample.width*record.sample.height),
                        relative_width=width/record.sample.width,relative_height=height/record.sample.height,
                        aspect_ratio=width/height,center_x=(x0+x1)/(2*record.sample.width),center_y=(y0+y1)/(2*record.sample.height))
                    for key,value in values.items():
                        measures[key].append(value)
            quantiles = {key:AuditQuantiles(**dict(zip(AuditQuantiles.model_fields,np.quantile(values,[0,.25,.5,.75,1]).tolist())))
                if values else None for key,values in measures.items()}
            geometry = AuditGeometryProfile(box_count=len(measures['relative_area']),annotated_images=annotated_images,
                instance_distribution=dict(instance_counts),**quantiles)
        groups = ContentRelations(self.db).groups(list(ids))
        covered = {identity for group in groups for identity in group.sample_ids} >= ids
        duplicates = [ids.intersection(group.sample_ids) for group in groups if len(ids.intersection(group.sample_ids))>1]
        tasks={record.sample.task_id for record in records}
        pairs = [pair for task_id in tasks for pair in PairObservations(self.db).current(task_id)
            if pair.sample_id_a in ids and pair.sample_id_b in ids and pair.verification.relation=='NEAR_CANDIDATE']
        benchmark = None
        if build_id is not None:
            build = BenchmarkRepository(self.db).get_build(build_id)
            if build is None or build.task_id not in tasks:
                raise ValueError('Benchmark 成果不属于当前任务')
            config=DatasetRegistry(self.db).get(next(record.sample.dataset_id for record in records if record.sample.task_id==build.task_id))
            directory = Path(build.output_dir)
            contents = {name:(directory/name).read_bytes() for name in ('gold.jsonl','split.json','leakage_report.json')}
            gold = [GoldRecord.model_validate_json(line) for line in contents['gold.jsonl'].splitlines() if line.strip()]
            saved = json.loads(contents['split.json'])
            assignments = saved['assignments']
            split = SplitResult(assignments=assignments,group_assignments=saved['group_assignments'],total_samples=len(assignments),
                **{key+'_ids':[identity for identity,value in assignments.items() if value==key] for key in ('train','val','test')},
                **{key+'_count':sum(value==key for value in assignments.values()) for key in ('train','val','test')})
            leakage = LeakageReport.model_validate_json(contents['leakage_report.json'])
            readiness = evaluate_track_readiness(gold,split,leakage,config.readiness_policy,config.metadata_semantics)
            benchmark = AuditBenchmarkSource(build_id=build_id,source_image_count=len(assignments),covered_images=len(ids & assignments.keys()),
                source_matches_scope=ids==assignments.keys(),split_distribution=dict(Counter(assignments.values())),
                confirmed_gold_images=sum(record.gold_status=='CONFIRMED' for record in gold),
                pixel_gold_images=sum(record.gold_status=='CONFIRMED' and record.binary_label=='ANOMALY' and any(annotation.annotation_type in ('mask','polygon') for annotation in record.annotations) for record in gold),
                leakage=leakage,readiness=readiness,source_hashes={name:hashlib.sha256(content).hexdigest() for name,content in contents.items()})
        return AuditDatasetProfile(total_images=len(records),dataset_format=records[0].dataset_format,
            registered_quality=dict(Counter(record.sample.quality_status.value for record in records)),geometry=geometry,metadata=metadata,
            strict_duplicate_groups=len(duplicates) if covered else None,
            strict_duplicate_images=len(set().union(*duplicates)) if covered else None,near_candidate_pairs=len(pairs),benchmark=benchmark)
