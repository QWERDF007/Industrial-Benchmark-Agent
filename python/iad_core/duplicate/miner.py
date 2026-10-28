import os
import json
import time
import logging
from typing import Optional
from pathlib import Path
from pydantic import JsonValue

from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.consistency.errors import ConsistencyError
from iad_core.duplicate.verify import PairVerifier
from iad_core.duplicate.models import DuplicateMiningResult, Pair
from iad_core.duplicate.pair_repository import PairObservations
from iad_core.duplicate.clusters import cluster_pairs
from iad_core.duplicate.report import generate_duplicate_report_markdown

logger=logging.getLogger(__name__)


def mine_near_duplicates(
    task_id: str,
    similarity_threshold: float = 0.98,
    top_k_neighbors: int = 50,
    db_path: str = "data/benchmark.db",
    output_dir: Optional[str] = None,
    verifier: Optional[PairVerifier] = None,
    verify_duplicates: bool = True,
) -> DuplicateMiningResult:
    start_time = time.time()
    from iad_core.workbench.runtime import workbench
    db = Database(db_path)
    with db.connection() as connection:
        datasets=[row[0] for row in connection.execute('SELECT dataset_id FROM datasets WHERE task_id=? ORDER BY dataset_id',(task_id,))]
    if not datasets:
        raise ConsistencyError('INDEX_NOT_READY','No registered corpus exists for this task')
    sample_repo = SampleRepository(db)
    candidate_pairs: list[Pair] = []
    seen_edges: set[tuple[str,str]] = set()
    with workbench(db_path).indexes.acquire({'kind':'datasets','dataset_ids':datasets}) as index:
        coverage=index.info.coverage
        total_samples=coverage.total
        if not index.info.member_count:
            raise ConsistencyError('INDEX_NOT_READY','Prepare visual features before duplicate mining')
        sample_ids=[member for group in index.group_ids for member in index.members(group)]
        samples_map={sample.sample_id:sample for sample in sample_repo.get_many(sample_ids)}
        for group in index.group_ids:
            members=index.members(group)
            for member in members[1:]:
                pair=tuple(sorted((members[0],member)))
                seen_edges.add(pair);candidate_pairs.append((*pair,1.0,None))
        count=len(index.group_ids)
        for offset in range(0,count,128):
            vectors=index.vectors(offset,min(128,count-offset))
            neighbors=index.search(vectors,top_k=min(200,top_k_neighbors+1))
            for position,hits in enumerate(neighbors):
                source_group=index.group_ids[offset+position]
                source=index.members(source_group)[0]
                for hit in hits:
                    if hit.group_id==source_group or hit.score<similarity_threshold:continue
                    pair=tuple(sorted((source,index.members(hit.group_id)[0])))
                    if pair not in seen_edges:
                        seen_edges.add(pair);candidate_pairs.append((*pair,hit.score,None))

    logger.info(f"Found {len(candidate_pairs)} candidate duplicate pairs above threshold {similarity_threshold}")

    candidate_groups, cand_sample_ids, cand_cross_count, cand_cross_pairs = cluster_pairs(
        pairs=candidate_pairs,
        samples_map=samples_map,
        id_prefix="cand_group",
        is_verified=False,
    )

    if verify_duplicates and verifier is None:
        verifier = PairVerifier()

    logger.info(f"Verifying {len(candidate_pairs)} candidate pairs using PairVerifier...")
    verified_pairs: list[Pair] = []
    saved_verified_pair_records: list[dict[str,JsonValue]] = []
    near_pair_records=[]
    verification_failed_count=0
    observations = PairObservations(db)

    for s1, s2, cos_score, _ in candidate_pairs:
        if not verify_duplicates:
            break
        try:
            observation = observations.verify(s1, s2, verifier=verifier, dino_cosine=cos_score)
        except ConsistencyError:
            verification_failed_count += 1
            continue
        v_res = observation.verification
        verification_failed_count+=v_res.relation=='UNCHECKED'
        if v_res.verified:
            extra = {
                "dino_cosine": cos_score,
                "pixel_cosine": v_res.pixel_cosine,
                "ncc": v_res.ncc,
                "mean_abs_diff": v_res.mean_abs_diff,
                "high_diff_ratio": v_res.high_diff_ratio,
                "best_shift": list(v_res.best_shift),
            }
            if v_res.relation=='EXACT':verified_pairs.append((s1,s2,cos_score,extra))
            record={
                "sample_id_a": min(s1, s2),
                "sample_id_b": max(s1, s2),
                "dino_cosine": round(float(cos_score), 4),
                "pixel_cosine": v_res.pixel_cosine,
                "ncc": v_res.ncc,
                "mean_abs_diff": v_res.mean_abs_diff,
                "high_diff_ratio": v_res.high_diff_ratio,
                "best_shift": list(v_res.best_shift),
                'relation':v_res.relation,'pixel':v_res.pixel.model_dump(mode='json'),
                'processing':v_res.details,'registration':v_res.registration.model_dump(mode='json'),
                'image_sha256_a':observation.image_sha256_a,'image_sha256_b':observation.image_sha256_b,
                'checked_at':observation.checked_at.isoformat(),'config':observation.config.model_dump(mode='json'),
                "verified": v_res.relation=='EXACT',
            }
            (saved_verified_pair_records if v_res.relation=='EXACT' else near_pair_records).append(record)

    logger.info(f"Verified {len(verified_pairs)} / {len(candidate_pairs)} pairs as true near-duplicates")

    verified_groups, ver_sample_ids, ver_cross_count, ver_cross_pairs = cluster_pairs(
        pairs=verified_pairs,
        samples_map=samples_map,
        id_prefix="ver_group",
        is_verified=True,
    )

    out_dir = output_dir or os.path.join("runs", "near_duplicate", task_id)
    os.makedirs(out_dir, exist_ok=True)
    (Path(out_dir)/'groups.json').unlink(missing_ok=True)
    candidate_json_path = os.path.join(out_dir, "candidate_groups.json")
    verified_json_path = os.path.join(out_dir, "verified_groups.json")
    verified_pairs_json_path = os.path.join(out_dir, "verified_pairs.json")
    near_pairs_json_path=os.path.join(out_dir,'near_candidates.json')
    report_md_path = os.path.join(out_dir, "duplicate_report.md")

    cand_data = {
        "task_id": task_id,
        "type": "CANDIDATE_COMPONENTS",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "group_count": len(candidate_groups),
        "duplicate_sample_count": len(cand_sample_ids),
        "cross_origin_group_count": cand_cross_count,
        "cross_origin_pairs": dict(cand_cross_pairs),
        "groups": [g.model_dump() for g in candidate_groups],
    }
    with open(candidate_json_path, "w", encoding="utf-8") as f:
        json.dump(cand_data, f, indent=2, ensure_ascii=False)


    ver_data = {
        "task_id": task_id,
        "type": "EXACT_CONTENT_GROUPS",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "group_count": len(verified_groups),
        "duplicate_sample_count": len(ver_sample_ids),
        "cross_origin_group_count": ver_cross_count,
        "cross_origin_pairs": dict(ver_cross_pairs),
        "groups": [g.model_dump() for g in verified_groups],
    }
    with open(verified_json_path, "w", encoding="utf-8") as f:
        json.dump(ver_data, f, indent=2, ensure_ascii=False)

    ver_pairs_data = {
        "task_id": task_id,
        "type": "DIRECT_EXACT_PAIRS",
        "similarity_threshold": similarity_threshold,
        "total_samples": total_samples,
        "total_verified_pairs": len(saved_verified_pair_records),
        "pairs": saved_verified_pair_records,
    }
    with open(verified_pairs_json_path, "w", encoding="utf-8") as f:
        json.dump(ver_pairs_data, f, indent=2, ensure_ascii=False)
    with open(near_pairs_json_path,'w',encoding='utf-8') as source:
        json.dump({'task_id':task_id,'type':'DIRECT_NEAR_CANDIDATES','pairs':near_pair_records},source,indent=2,ensure_ascii=False)

    elapsed = time.time() - start_time

    result=DuplicateMiningResult(
        task_id=task_id,
        similarity_threshold=similarity_threshold,
        total_samples=total_samples,
        candidate_group_count=len(candidate_groups),
        candidate_sample_count=len(cand_sample_ids),
        candidate_cross_origin_group_count=cand_cross_count,
        verified_group_count=len(verified_groups),
        verified_sample_count=len(ver_sample_ids),
        verified_cross_origin_group_count=ver_cross_count,
        cross_origin_pairs=dict(cand_cross_pairs),
        verified_cross_origin_pairs=dict(ver_cross_pairs),
        candidate_groups_json_path=candidate_json_path,
        verified_groups_json_path=verified_json_path,
        verified_pairs_json_path=verified_pairs_json_path,
        near_pairs_json_path=near_pairs_json_path,near_candidate_pair_count=len(near_pair_records),
        verification_requested=verify_duplicates,verification_failed_count=verification_failed_count,corpus_coverage=coverage,
        report_md_path=report_md_path,
        elapsed_seconds=round(elapsed, 2),
    )
    with open(report_md_path,'w',encoding='utf-8') as source:
        source.write(generate_duplicate_report_markdown(result,verified_groups,samples_map))
    return result
