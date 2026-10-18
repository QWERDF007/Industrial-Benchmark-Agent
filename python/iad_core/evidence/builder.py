import os
import json
import logging
from typing import Optional, List, Dict, Any, Tuple
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.repositories import FeatureRepository, SampleRepository, AnnotationRepository
from iad_core.candidate.schemas import CandidateSignals
from iad_core.candidate.reference import get_normal_reference_set
from iad_core.evidence.schemas import (
    EvidencePackage,
    NormalReferenceEvidence,
    NeighborEvidence,
    DuplicateEvidence,
    AnnotationEvidence,
    DirectVerifiedPairEvidence,
    VerifiedComponentMemberEvidence,
)

logger = logging.getLogger("iad_core.evidence.builder")


class EvidenceBuilder:
    """
    On-demand Evidence Package builder for candidate samples.
    Builds comprehensive visual and contextual evidence:
    - Query image and sample metadata
    - Mining score and signal breakdown
    - Nearest Normal references
    - Top similar historical neighbors
    - Direct verified duplicate pairs
    - Verified component members
    - Annotations and geometric details
    """

    def __init__(
        self,
        task_id: str,
        db: Optional[Database] = None,
        db_path: str = "data/benchmark.db",
        model_id: str = "dinov2_vitb14_reg",
        preprocess_key: str = "dinov2_224_norm",
        verified_groups_path: Optional[str] = None,
        verified_pairs_path: Optional[str] = None,
        candidates_json_path: Optional[str] = None,
    ):
        self.task_id = task_id
        self.db = db or Database(db_path)
        self.model_id = model_id
        self.preprocess_key = preprocess_key
        self.verified_groups_path = verified_groups_path or os.path.join(
            "runs", "near_duplicate", task_id, "verified_groups.json"
        )
        self.verified_pairs_path = verified_pairs_path or os.path.join(
            "runs", "near_duplicate", task_id, "verified_pairs.json"
        )
        self.candidates_json_path = candidates_json_path or os.path.join(
            "runs", "candidate_mining", task_id, "candidates.json"
        )

        self.sample_repo = SampleRepository(self.db)
        self.feat_repo = FeatureRepository(self.db)
        self.anno_repo = AnnotationRepository(self.db)

        self._samples_cache: Optional[Dict[str, Dict[str, Any]]] = None
        self._feat_cache: Optional[Dict[str, np.ndarray]] = None
        self._feat_matrix: Optional[np.ndarray] = None
        self._feat_sample_ids: Optional[List[str]] = None
        self._normal_ref_ids: Optional[List[str]] = None
        self._normal_ref_embeds: Optional[np.ndarray] = None
        self._direct_verified_pairs_map: Optional[Dict[str, List[DirectVerifiedPairEvidence]]] = None
        self._verified_component_members_map: Optional[Dict[str, List[VerifiedComponentMemberEvidence]]] = None
        self._verified_duplicates_map: Optional[Dict[str, List[DuplicateEvidence]]] = None
        self._candidates_score_map: Optional[Dict[str, Tuple[float, CandidateSignals]]] = None

    def _ensure_samples_loaded(self):
        if self._samples_cache is not None:
            return
        self._samples_cache = {}
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT sample_id, task_id, dataset_id, image_path, relative_path,
                       data_origin, physical_sample_id, capture_sequence_id, batch_id,
                       station, camera, width, height, quality_status, quality_source
                FROM samples WHERE task_id = ?
                """,
                (self.task_id,),
            )
            for row in cursor.fetchall():
                self._samples_cache[row["sample_id"]] = dict(row)

    def _ensure_features_loaded(self):
        if self._feat_cache is not None:
            return
        self._feat_cache = {}
        raw_feats = self.feat_repo.list_by_task(self.task_id, self.model_id, self.preprocess_key)
        id_list = []
        vec_list = []
        for r in raw_feats:
            np_dtype = np.float16 if r["dtype"] == "fp16" else np.float32
            vec = np.frombuffer(r["embedding_blob"], dtype=np_dtype).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            self._feat_cache[r["sample_id"]] = vec
            id_list.append(r["sample_id"])
            vec_list.append(vec)

        self._feat_sample_ids = id_list
        if vec_list:
            self._feat_matrix = np.stack(vec_list, axis=0)
        else:
            self._feat_matrix = np.empty((0, 768), dtype=np.float32)

    def _ensure_normal_refs_loaded(self):
        if self._normal_ref_ids is not None:
            return
        ref_ids, ref_embeds, _ = get_normal_reference_set(
            task_id=self.task_id,
            db=self.db,
            model_id=self.model_id,
            preprocess_key=self.preprocess_key,
            include_hard_normal=True,
        )
        self._normal_ref_ids = ref_ids
        self._normal_ref_embeds = ref_embeds

    def _ensure_direct_verified_pairs_loaded(self):
        if self._direct_verified_pairs_map is not None:
            return
        self._direct_verified_pairs_map = {}
        if not os.path.exists(self.verified_pairs_path):
            return

        try:
            with open(self.verified_pairs_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            pairs = data.get("pairs", [])
            for p in pairs:
                s1 = p.get("sample_id_a")
                s2 = p.get("sample_id_b")
                if not s1 or not s2:
                    continue
                dino_cos = float(p.get("dino_cosine", 0.0))
                pix_cos = float(p.get("pixel_cosine", 0.0))
                ncc = float(p.get("ncc", 0.0))
                mad = float(p.get("mean_abs_diff", 0.0))
                hdr = float(p.get("high_diff_ratio", 0.0))
                shift = tuple(p.get("best_shift", (0, 0)))
                ver = bool(p.get("verified", True))

                meta1 = self._get_sample_meta(s1)
                meta2 = self._get_sample_meta(s2)

                ev_for_s1 = DirectVerifiedPairEvidence(
                    sample_id=s2,
                    image_path=meta2.get("image_path", ""),
                    dino_cosine=dino_cos,
                    pixel_cosine=pix_cos,
                    ncc=ncc,
                    mean_abs_diff=mad,
                    high_diff_ratio=hdr,
                    best_shift=shift,
                    verified=ver,
                    data_origin=meta2.get("data_origin", "UNKNOWN"),
                )
                ev_for_s2 = DirectVerifiedPairEvidence(
                    sample_id=s1,
                    image_path=meta1.get("image_path", ""),
                    dino_cosine=dino_cos,
                    pixel_cosine=pix_cos,
                    ncc=ncc,
                    mean_abs_diff=mad,
                    high_diff_ratio=hdr,
                    best_shift=shift,
                    verified=ver,
                    data_origin=meta1.get("data_origin", "UNKNOWN"),
                )

                if s1 not in self._direct_verified_pairs_map:
                    self._direct_verified_pairs_map[s1] = []
                self._direct_verified_pairs_map[s1].append(ev_for_s1)

                if s2 not in self._direct_verified_pairs_map:
                    self._direct_verified_pairs_map[s2] = []
                self._direct_verified_pairs_map[s2].append(ev_for_s2)
        except Exception as e:
            logger.warning(f"Failed to load direct verified pairs from {self.verified_pairs_path}: {e}")

    def _ensure_verified_duplicates_loaded(self):
        if self._verified_duplicates_map is not None and self._verified_component_members_map is not None:
            return
        self._verified_duplicates_map = {}
        self._verified_component_members_map = {}
        if not os.path.exists(self.verified_groups_path):
            return

        try:
            with open(self.verified_groups_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            groups = data.get("groups", [])
            for grp in groups:
                gid = grp.get("group_id", "")
                is_cross = grp.get("is_cross_origin", False)
                is_ver = grp.get("is_verified", True)
                sample_ids = grp.get("sample_ids", [])
                avg_sim = grp.get("avg_similarity", 0.98)

                for s_id in sample_ids:
                    dups_for_s = []
                    comps_for_s = []
                    for other_id in sample_ids:
                        if other_id == s_id:
                            continue
                        other_meta = self._get_sample_meta(other_id)
                        dups_for_s.append(
                            DuplicateEvidence(
                                group_id=gid,
                                sample_id=other_id,
                                image_path=other_meta.get("image_path", ""),
                                verified=is_ver,
                                pixel_similarity=round(avg_sim, 4),
                                feature_similarity=round(avg_sim, 4),
                                is_cross_origin=is_cross,
                                data_origin=other_meta.get("data_origin", "UNKNOWN"),
                            )
                        )
                        comps_for_s.append(
                            VerifiedComponentMemberEvidence(
                                group_id=gid,
                                sample_id=other_id,
                                image_path=other_meta.get("image_path", ""),
                                data_origin=other_meta.get("data_origin", "UNKNOWN"),
                                is_cross_origin=is_cross,
                                group_size=len(sample_ids),
                            )
                        )
                    if s_id not in self._verified_duplicates_map:
                        self._verified_duplicates_map[s_id] = []
                    self._verified_duplicates_map[s_id].extend(dups_for_s)

                    if s_id not in self._verified_component_members_map:
                        self._verified_component_members_map[s_id] = []
                    self._verified_component_members_map[s_id].extend(comps_for_s)
        except Exception as e:
            logger.warning(f"Failed to load verified duplicates from {self.verified_groups_path}: {e}")

    def _ensure_candidates_score_loaded(self):
        if self._candidates_score_map is not None:
            return
        self._candidates_score_map = {}
        if not os.path.exists(self.candidates_json_path):
            return
        try:
            with open(self.candidates_json_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            cands = (
                raw.get("items", [])
                if (isinstance(raw, dict) and "items" in raw)
                else (raw.get("candidates", []) if isinstance(raw, dict) else raw)
            )
            for c in cands:
                sid = c.get("sample_id")
                if not sid:
                    continue
                score = c.get("candidate_score") or c.get("dino_score") or 0.0
                sig = c.get("signals") or {}
                signals_obj = CandidateSignals(
                    normal_distance=sig.get("normal_distance", 0.0),
                    density_outlier=sig.get("density_outlier", 0.0),
                    domain_novelty=sig.get("domain_novelty", 0.0),
                    annotation_signal=sig.get("annotation_signal", 0.0),
                )
                self._candidates_score_map[sid] = (float(score), signals_obj)
        except Exception as e:
            logger.warning(f"Failed to load candidates score from {self.candidates_json_path}: {e}")

    def _get_sample_meta(self, sample_id: str) -> Dict[str, Any]:
        self._ensure_samples_loaded()
        if sample_id in self._samples_cache:
            return self._samples_cache[sample_id]
        with self.db.connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM samples WHERE sample_id = ?", (sample_id,))
            row = cursor.fetchone()
            if row:
                res = dict(row)
                self._samples_cache[sample_id] = res
                return res
        return {}

    def build_evidence(
        self,
        sample_id: str,
        candidate_score: Optional[float] = None,
        signals: Optional[CandidateSignals] = None,
        top_k_normal: int = 4,
        top_k_neighbors: int = 8,
    ) -> EvidencePackage:
        self._ensure_samples_loaded()
        self._ensure_features_loaded()
        self._ensure_normal_refs_loaded()
        self._ensure_verified_duplicates_loaded()
        self._ensure_candidates_score_loaded()

        meta = self._get_sample_meta(sample_id)
        if not meta:
            raise ValueError(f"Sample '{sample_id}' not found in task '{self.task_id}'")

        cand_score = candidate_score
        cand_signals = signals
        if cand_score is None or cand_signals is None:
            if self._candidates_score_map and sample_id in self._candidates_score_map:
                cand_score, cand_signals = self._candidates_score_map[sample_id]
            else:
                cand_score = 0.5
                cand_signals = CandidateSignals(
                    normal_distance=0.5,
                    density_outlier=0.5,
                    domain_novelty=0.5,
                    annotation_signal=0.0,
                )

        raw_annos = self.anno_repo.list_by_sample(sample_id)
        anno_evidence = [
            AnnotationEvidence(
                annotation_id=a.annotation_id,
                annotation_type=a.annotation_type.value if hasattr(a.annotation_type, "value") else str(a.annotation_type),
                raw_label=a.raw_label,
                phenomenon=a.phenomenon,
                bbox_json=json.dumps(a.bbox) if a.bbox else None,
                polygon_json=json.dumps(a.polygon) if a.polygon else None,
                geometry_status=a.geometry_status.value if hasattr(a.geometry_status, "value") else str(a.geometry_status),
                source=a.source.value if hasattr(a.source, "value") else str(a.source),
            )
            for a in raw_annos
        ]

        query_vec = self._feat_cache.get(sample_id)

        nearest_normal: List[NormalReferenceEvidence] = []
        if query_vec is not None and self._normal_ref_embeds is not None and len(self._normal_ref_ids) > 0:
            sims = np.dot(self._normal_ref_embeds, query_vec)
            top_normal_indices = np.argsort(-sims)[:top_k_normal]
            for idx in top_normal_indices:
                ref_id = self._normal_ref_ids[idx]
                ref_meta = self._get_sample_meta(ref_id)
                nearest_normal.append(
                    NormalReferenceEvidence(
                        sample_id=ref_id,
                        image_path=ref_meta.get("image_path", ""),
                        similarity=round(float(sims[idx]), 4),
                        quality_status=ref_meta.get("quality_status", "PASS"),
                        batch_id=ref_meta.get("batch_id"),
                        physical_sample_id=ref_meta.get("physical_sample_id"),
                    )
                )

        nearest_neighbors: List[NeighborEvidence] = []
        if query_vec is not None and self._feat_matrix is not None and len(self._feat_sample_ids) > 1:
            all_sims = np.dot(self._feat_matrix, query_vec)
            sorted_indices = np.argsort(-all_sims)
            count = 0
            for idx in sorted_indices:
                nbr_id = self._feat_sample_ids[idx]
                if nbr_id == sample_id:
                    continue
                nbr_meta = self._get_sample_meta(nbr_id)
                nearest_neighbors.append(
                    NeighborEvidence(
                        sample_id=nbr_id,
                        image_path=nbr_meta.get("image_path", ""),
                        similarity=round(float(all_sims[idx]), 4),
                        quality_status=nbr_meta.get("quality_status", "UNKNOWN"),
                        data_origin=nbr_meta.get("data_origin", "UNKNOWN"),
                        batch_id=nbr_meta.get("batch_id"),
                        physical_sample_id=nbr_meta.get("physical_sample_id"),
                    )
                )
                count += 1
                if count >= top_k_neighbors:
                    break

        self._ensure_direct_verified_pairs_loaded()
        direct_pairs = self._direct_verified_pairs_map.get(sample_id, []) if self._direct_verified_pairs_map else []
        component_members = self._verified_component_members_map.get(sample_id, []) if self._verified_component_members_map else []
        duplicates = self._verified_duplicates_map.get(sample_id, []) if self._verified_duplicates_map else []

        is_complete = bool(
            meta.get("image_path")
            and query_vec is not None
            and (len(nearest_neighbors) > 0 or len(self._feat_sample_ids) <= 1)
        )
        status_str = "COMPLETE" if is_complete else "INCOMPLETE"

        metadata_dict = {
            "dataset_id": meta.get("dataset_id"),
            "data_origin": meta.get("data_origin"),
            "physical_sample_id": meta.get("physical_sample_id"),
            "capture_sequence_id": meta.get("capture_sequence_id"),
            "batch_id": meta.get("batch_id"),
            "station": meta.get("station"),
            "camera": meta.get("camera"),
            "width": meta.get("width"),
            "height": meta.get("height"),
            "quality_status": meta.get("quality_status"),
            "quality_source": meta.get("quality_source"),
        }

        return EvidencePackage(
            sample_id=sample_id,
            image_path=meta.get("image_path", ""),
            relative_path=meta.get("relative_path", ""),
            task_id=self.task_id,
            candidate_score=round(float(cand_score), 4),
            signals=cand_signals,
            nearest_normal=nearest_normal,
            nearest_neighbors=nearest_neighbors,
            direct_verified_pairs=direct_pairs,
            verified_component_members=component_members,
            verified_duplicates=duplicates,
            metadata=metadata_dict,
            annotations=anno_evidence,
            evidence_status=status_str,
            evidence_version="v2",
        )


def build_evidence(
    sample_id: str,
    task_id: str,
    db: Optional[Database] = None,
    db_path: str = "data/benchmark.db",
    candidate_score: Optional[float] = None,
    signals: Optional[CandidateSignals] = None,
    top_k_normal: int = 4,
    top_k_neighbors: int = 8,
    verified_groups_path: Optional[str] = None,
    verified_pairs_path: Optional[str] = None,
) -> EvidencePackage:
    builder = EvidenceBuilder(
        task_id=task_id,
        db=db,
        db_path=db_path,
        verified_groups_path=verified_groups_path,
        verified_pairs_path=verified_pairs_path,
    )
    return builder.build_evidence(
        sample_id=sample_id,
        candidate_score=candidate_score,
        signals=signals,
        top_k_normal=top_k_normal,
        top_k_neighbors=top_k_neighbors,
    )
