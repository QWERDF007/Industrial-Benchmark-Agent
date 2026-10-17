import os
import json
import time
import logging
from typing import List, Dict, Optional, Any, Union
import numpy as np

from iad_core.storage.database import Database
from iad_core.storage.models import EvaluationRunRecord, Sample, SplitAssignmentRecord, GoldRecord
from iad_core.storage.repositories import (
    EvaluationRepository,
    BenchmarkRepository,
    GoldRepository,
    SampleRepository,
)
from iad_core.evaluation.contracts import (
    PredictionRecord,
    ThresholdStrategy,
    ThresholdResult,
    ImageMetrics,
    PixelMetrics,
    HardNormalMetrics,
    DomainMetrics,
    EvaluationRun,
    EvaluationPlan,
    EvaluationInvariantError,
)
from iad_core.evaluation.threshold import ThresholdSelector
from iad_core.evaluation.metrics import (
    compute_image_metrics,
    compute_hard_normal_metrics,
    compute_domain_metrics,
    compute_pixel_metrics,
)
from iad_core.evaluation.baselines.base import BaselineRunner
from iad_core.evaluation.baselines.mock import MockBaselineRunner
from iad_core.evaluation.baselines.feature_knn import FeatureMemoryBankRunner
from iad_core.evaluation.baselines.patchcore import PatchCoreRunner
from iad_core.evaluation.baselines.dinomaly import Dinomaly2Runner
from iad_core.evaluation.baselines.efficientad import EfficientADRunner

logger = logging.getLogger("iad_core.evaluation.evaluator")


def resolve_runner(model_id_or_runner: Union[str, BaselineRunner]) -> BaselineRunner:
    if isinstance(model_id_or_runner, BaselineRunner):
        return model_id_or_runner
    m = model_id_or_runner.lower()
    if "mock" in m:
        return MockBaselineRunner(name=model_id_or_runner)
    elif "patchcore" in m:
        return PatchCoreRunner(name=model_id_or_runner)
    elif "dinomaly" in m:
        return Dinomaly2Runner(name=model_id_or_runner)
    elif "feature" in m or "knn" in m or "bank" in m:
        return FeatureMemoryBankRunner(name=model_id_or_runner)
    else:
        raise ValueError(
            f"Unknown baseline runner '{model_id_or_runner}'. "
            f"Expected one of: feature_knn_dinov2, patchcore, dinomaly2, mock."
        )


class EvaluationService:
    """
    Unified Anomaly Detection Evaluation Service (R601~R612).
    Enforces Val-only threshold selection, evaluates Image/Pixel/HardNormal/Domain metrics,
    and exports standardized report artifacts.
    """

    def __init__(self, db: Optional[Database] = None, db_path: str = "data/benchmark.db"):
        self.db = db or Database(db_path)
        self.eval_repo = EvaluationRepository(self.db)
        self.bench_repo = BenchmarkRepository(self.db)
        self.gold_repo = GoldRepository(self.db)
        self.sample_repo = SampleRepository(self.db)

    def evaluate_model(
        self,
        task_id: str,
        build_id: str,
        model: Union[str, BaselineRunner],
        threshold_strategy: ThresholdStrategy = ThresholdStrategy.F1_MAX,
        target_fpr: float = 0.01,
        output_dir: Optional[str] = None,
    ) -> EvaluationRun:
        runner = resolve_runner(model)
        model_id = runner.name
        t0 = time.perf_counter()

        # 1. Load benchmark build & split assignments
        build = self.bench_repo.get_build(build_id)
        if not build:
            raise ValueError(f"Benchmark build not found: {build_id}")

        assignments = self.bench_repo.get_split_assignments_by_build(build_id)
        if not assignments:
            raise ValueError(f"No split assignments found for build: {build_id}")

        # Map sample_id to split name
        split_map: Dict[str, str] = {a.sample_id: a.split_name for a in assignments}

        # 2. Load samples & gold records
        all_samples = self.sample_repo.list_by_task(task_id)
        sample_dict = {s.sample_id: s for s in all_samples}
        gold_records = self.gold_repo.list_by_task(task_id, policy_name=build.gold_policy)
        gold_dict = {g.sample_id: g for g in gold_records}

        train_samples = [sample_dict[sid] for sid, sp in split_map.items() if sp == "train" and sid in sample_dict]
        val_samples = [sample_dict[sid] for sid, sp in split_map.items() if sp == "val" and sid in sample_dict]
        test_samples = [sample_dict[sid] for sid, sp in split_map.items() if sp == "test" and sid in sample_dict]

        if not val_samples:
            raise ValueError(f"Validation set is empty for build {build_id}. Cannot fit threshold!")
        if not test_samples:
            raise ValueError(f"Test set is empty for build {build_id}. Cannot evaluate test metrics!")

        # 3. Baseline training / preparation
        logger.info(f"Preparing baseline {model_id} on {len(train_samples)} training samples...")
        runner.prepare(task_id, build_id, train_samples)

        # 4. Predict on Val set
        logger.info(f"Predicting on {len(val_samples)} validation samples...")
        val_preds = runner.predict(val_samples, split_name="val")

        # Binary labels: 0 for Normal/HardNormal, 1 for Anomaly
        val_labels: Dict[str, int] = {}
        val_normal_count = 0
        val_anomaly_count = 0
        for s in val_samples:
            g = gold_dict.get(s.sample_id)
            if not g or g.gold_status != "CONFIRMED":
                raise EvaluationInvariantError(
                    f"Sample {s.sample_id} in Validation split lacks CONFIRMED Gold record!"
                )
            if g.binary_label == "ANOMALY":
                val_labels[s.sample_id] = 1
                val_anomaly_count += 1
            elif g.binary_label == "NORMAL":
                val_labels[s.sample_id] = 0
                val_normal_count += 1
            else:
                raise EvaluationInvariantError(
                    f"Sample {s.sample_id} has invalid binary_label: '{g.binary_label}'"
                )

        val_class_counts = {
            "NORMAL": val_normal_count,
            "ANOMALY": val_anomaly_count,
        }

        # 5. STRICT SECURITY INVARIANT (R608): Select threshold using Val set ONLY!
        th_res = ThresholdSelector.select_threshold(
            val_predictions=val_preds,
            val_labels=val_labels,
            strategy=threshold_strategy,
            target_fpr=target_fpr,
        )
        selected_threshold = th_res.threshold

        # 6. Predict on Test set
        logger.info(f"Predicting on {len(test_samples)} test samples...")
        test_preds = runner.predict(test_samples, split_name="test")

        # 7. Compute Test Metrics
        test_scores = []
        test_binary_labels = []
        normal_scores = []
        hard_normal_scores = []
        gold_labels_str = {}
        sample_domains = {}
        test_normal_count = 0
        test_hn_count = 0
        test_anomaly_count = 0

        for p in test_preds:
            sid = p.sample_id
            g = gold_dict.get(sid)
            s_obj = sample_dict.get(sid)
            if not g or g.gold_status != "CONFIRMED":
                raise EvaluationInvariantError(
                    f"Sample {sid} in Test split lacks CONFIRMED Gold record!"
                )
            domain = s_obj.batch_id if s_obj and s_obj.batch_id else (g.batch_id or "UNKNOWN")
            sample_domains[sid] = domain

            if g.binary_label == "ANOMALY":
                is_anomaly = 1
                test_anomaly_count += 1
            elif g.binary_label == "NORMAL":
                is_anomaly = 0
                test_normal_count += 1
            else:
                raise EvaluationInvariantError(
                    f"Sample {sid} has invalid binary_label: '{g.binary_label}'"
                )

            is_hn = bool(g.hard_normal)
            if is_hn:
                test_hn_count += 1

            gold_labels_str[sid] = "ANOMALY" if is_anomaly == 1 else ("HARD_NORMAL" if is_hn else "NORMAL")
            test_scores.append(p.image_score)
            test_binary_labels.append(is_anomaly)

            if is_anomaly == 0:
                if is_hn:
                    hard_normal_scores.append(p.image_score)
                else:
                    normal_scores.append(p.image_score)

        test_class_counts = {
            "NORMAL": test_normal_count,
            "HARD_NORMAL": test_hn_count,
            "ANOMALY": test_anomaly_count,
        }

        image_metrics = compute_image_metrics(
            scores=np.array(test_scores, dtype=np.float32),
            binary_labels=np.array(test_binary_labels, dtype=np.int32),
            threshold=selected_threshold,
        )

        hard_normal_metrics = compute_hard_normal_metrics(
            normal_scores=np.array(normal_scores, dtype=np.float32),
            hard_normal_scores=np.array(hard_normal_scores, dtype=np.float32),
            threshold=selected_threshold,
        )

        domain_metrics = compute_domain_metrics(
            test_predictions=test_preds,
            gold_labels=gold_labels_str,
            sample_domains=sample_domains,
            threshold=selected_threshold,
        )

        pixel_metrics = compute_pixel_metrics(test_preds)

        # 8. Output artifacts
        run_id = f"eval_{task_id}_{model_id}_{int(time.time())}"
        out_dir = output_dir or os.path.join("runs", "evaluation", run_id)
        os.makedirs(out_dir, exist_ok=True)

        preds_path = os.path.join(out_dir, "predictions.jsonl")
        with open(preds_path, "w", encoding="utf-8") as f:
            for p in val_preds + test_preds:
                f.write(p.model_dump_json() + "\n")

        th_path = os.path.join(out_dir, "threshold.json")
        with open(th_path, "w", encoding="utf-8") as f:
            f.write(th_res.model_dump_json(indent=2))

        eval_run = EvaluationRun(
            run_id=run_id,
            task_id=task_id,
            build_id=build_id,
            model_id=model_id,
            threshold=th_res,
            image_metrics=image_metrics,
            pixel_metrics=pixel_metrics,
            hard_normal_metrics=hard_normal_metrics,
            domain_metrics=domain_metrics,
            val_class_counts=val_class_counts,
            test_class_counts=test_class_counts,
            implementation_name=getattr(runner, "implementation_name", model_id),
            implementation_source=getattr(runner, "implementation_source", "unknown"),
            implementation_revision=getattr(runner, "implementation_revision", None),
            runtime_config=getattr(runner, "runtime_config", {}),
            predictions_path=preds_path,
            metrics_json_path=os.path.join(out_dir, "metrics.json"),
            report_md_path=os.path.join(out_dir, "metrics.md"),
            error_analysis_md_path=os.path.join(out_dir, "error_analysis.md"),
            elapsed_seconds=float(time.perf_counter() - t0),
        )

        with open(eval_run.metrics_json_path, "w", encoding="utf-8") as f:
            f.write(eval_run.model_dump_json(indent=2))

        # Write metrics.md
        self._write_metrics_md(eval_run)
        # Write error_analysis.md
        self._write_error_analysis_md(eval_run, test_preds, gold_labels_str, sample_dict)

        # 9. Record in SQLite
        eval_record = EvaluationRunRecord(
            run_id=run_id,
            task_id=task_id,
            build_id=build_id,
            model_id=model_id,
            threshold_strategy=threshold_strategy.value,
            metrics=eval_run.model_dump(),
            status="COMPLETED",
            output_dir=out_dir,
        )
        self.eval_repo.save_run(eval_record)
        logger.info(f"Evaluation completed for {model_id} in {eval_run.elapsed_seconds:.2f}s -> {out_dir}")

        return eval_run

    def execute_plan(self, plan: EvaluationPlan) -> List[EvaluationRun]:
        runs = []
        for mid in plan.model_ids:
            run = self.evaluate_model(
                task_id=plan.task_id,
                build_id=plan.build_id,
                model=mid,
                threshold_strategy=plan.threshold_strategy,
                target_fpr=plan.target_fpr,
                output_dir=plan.output_dir,
            )
            runs.append(run)
        return runs

    def _write_metrics_md(self, run: EvaluationRun):
        im = run.image_metrics
        hn = run.hard_normal_metrics
        th = run.threshold

        lines = [
            f"# Evaluation Report: {run.model_id}",
            "",
            f"- **Task ID**: `{run.task_id}`",
            f"- **Build ID**: `{run.build_id}`",
            f"- **Run ID**: `{run.run_id}`",
            f"- **Elapsed**: `{run.elapsed_seconds:.2f}s`",
            "",
            "## 1. Split & Class Counts",
            "",
            f"- **Val Samples**: `{th.fit_samples_count}` (Normal: `{run.val_class_counts.get('NORMAL', 0)}`, Anomaly: `{run.val_class_counts.get('ANOMALY', 0)}`)",
            f"- **Test Samples**: `{im.true_positive + im.false_positive + im.true_negative + im.false_negative}` (Normal: `{run.test_class_counts.get('NORMAL', 0)}`, Hard Normal: `{run.test_class_counts.get('HARD_NORMAL', 0)}`, Anomaly: `{run.test_class_counts.get('ANOMALY', 0)}`)",
            "",
            "## 2. Threshold Configuration (Val-Fitted)",
            "",
            f"- **Strategy**: `{th.strategy.value}`",
            f"- **Fitted Split**: `{th.fit_split}` ({th.fit_samples_count} samples)",
            f"- **Selected Threshold**: `{th.threshold:.4f}`",
            f"- **Val Best F1**: `{th.best_f1 if th.best_f1 is not None else 'N/A'}`",
            "",
            "## 3. Test Image Metrics",
            "",
            "| Metric | Value |",
            "|---|---|",
            f"| I-AUROC | `{f'{im.i_auroc:.4f}' if im.i_auroc is not None else 'N/A'}` |",
            f"| I-AP | `{f'{im.i_ap:.4f}' if im.i_ap is not None else 'N/A'}` |",
            f"| Recall@FPR=1% | `{f'{im.recall_at_fpr_01:.4f}' if im.recall_at_fpr_01 is not None else 'N/A'}` |",
            f"| Recall@FPR=5% | `{f'{im.recall_at_fpr_05:.4f}' if im.recall_at_fpr_05 is not None else 'N/A'}` |",
            f"| Accuracy | `{im.accuracy:.4f}` |",
            f"| Precision | `{im.precision:.4f}` |",
            f"| Recall | `{im.recall:.4f}` |",
            f"| F1 Score | `{im.f1:.4f}` |",
            f"| Confusion (TP / FP / TN / FN) | `{im.true_positive} / {im.false_positive} / {im.true_negative} / {im.false_negative}` |",
            "",
            "## 4. Hard Normal Robustness",
            "",
            "| Metric | Value |",
            "|---|---|",
            f"| Hard Normal Count | `{hn.hard_normal_count}` |",
            f"| Hard Normal FPR | `{hn.hard_normal_fpr:.4f}` |",
            f"| Hard Normal Mean Score | `{hn.hard_normal_score_mean:.4f}` |",
            f"| Normal Mean Score | `{hn.normal_score_mean:.4f}` |",
            f"| Separation Margin | `{hn.separation_margin:.4f}` |",
            "",
            "## 5. Domain Stratified Breakdown",
            "",
            "| Domain | Samples | Anomaly / Normal | Accuracy | F1 | I-AUROC | FP |",
            "|---|---|---|---|---|---|---|",
        ]

        for dom, m in run.domain_metrics.metrics_by_domain.items():
            auroc_str = f"{m['i_auroc']:.4f}" if m['i_auroc'] is not None else "N/A"
            lines.append(
                f"| `{dom}` | {m['sample_count']} | {m['anomaly_count']} / {m['normal_count']} | {m['accuracy']:.4f} | {m['f1']:.4f} | {auroc_str} | {m['false_positive']} |"
            )

        with open(run.report_md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

    def _write_error_analysis_md(
        self,
        run: EvaluationRun,
        test_preds: List[PredictionRecord],
        gold_labels: Dict[str, str],
        sample_dict: Dict[str, Sample],
    ):
        th = run.threshold.threshold
        fps = []
        fns = []

        for p in test_preds:
            g_lbl = gold_labels.get(p.sample_id, "NORMAL")
            pred_anomaly = 1 if p.image_score >= th else 0
            true_anomaly = 1 if g_lbl == "ANOMALY" else 0

            if pred_anomaly == 1 and true_anomaly == 0:
                fps.append((p.sample_id, p.image_score, g_lbl))
            elif pred_anomaly == 0 and true_anomaly == 1:
                fns.append((p.sample_id, p.image_score, g_lbl))

        fps.sort(key=lambda x: x[1], reverse=True)
        fns.sort(key=lambda x: x[1])

        lines = [
            f"# Error Analysis: {run.model_id}",
            "",
            f"- **Threshold**: `{th:.4f}`",
            f"- **Total False Positives (FP)**: {len(fps)}",
            f"- **Total False Negatives (FN)**: {len(fns)}",
            "",
            "## 1. Top False Positives (Normal or Hard Normal predicted as Anomaly)",
            "",
            "| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |",
            "|---|---|---|---|---|",
        ]

        for sid, score, lbl in fps[:20]:
            s = sample_dict.get(sid)
            batch = s.batch_id if s else "N/A"
            path = s.image_path if s else "N/A"
            lines.append(f"| `{sid}` | `{score:.4f}` | `{lbl}` | `{batch}` | `{path}` |")

        lines.extend([
            "",
            "## 2. Top False Negatives (Anomaly predicted as Normal)",
            "",
            "| Sample ID | Image Score | Gold Label | Batch / Domain | Image Path |",
            "|---|---|---|---|---|",
        ])

        for sid, score, lbl in fns[:20]:
            s = sample_dict.get(sid)
            batch = s.batch_id if s else "N/A"
            path = s.image_path if s else "N/A"
            lines.append(f"| `{sid}` | `{score:.4f}` | `{lbl}` | `{batch}` | `{path}` |")

        with open(run.error_analysis_md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
