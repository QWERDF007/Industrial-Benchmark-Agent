import sqlite3
from typing import Optional, Dict, Any
from iad_core.storage.models import InspectionTask


def get_task(task_id: str, db_path: str = "data/benchmark.db") -> Optional[InspectionTask]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT task_id, product, station, camera, inspection_target, description
        FROM inspection_tasks WHERE task_id = ?
    """, (task_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return InspectionTask(
        task_id=row["task_id"],
        product=row["product"],
        station=row["station"],
        camera=row["camera"],
        inspection_target=row["inspection_target"],
        description=row["description"],
    )


def ensure_task(task: InspectionTask, db_path: str = "data/benchmark.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO inspection_tasks (task_id, product, station, camera, inspection_target, description)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(task_id) DO UPDATE SET
            product = excluded.product,
            station = excluded.station,
            camera = excluded.camera,
            inspection_target = excluded.inspection_target,
            description = excluded.description,
            updated_at = CURRENT_TIMESTAMP
    """, (
        task.task_id, task.product, task.station, task.camera,
        task.inspection_target, task.description,
    ))
    conn.commit()
    conn.close()


def inspect_task_summary(task_id: str, db_path: str = "data/benchmark.db") -> Dict[str, Any]:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM samples WHERE task_id = ?", (task_id,))
    sample_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT quality_status, COUNT(*) FROM samples
        WHERE task_id = ? GROUP BY quality_status
    """, (task_id,))
    quality_counts = dict(cursor.fetchall())

    cursor.execute("""
        SELECT a.geometry_status, COUNT(*)
        FROM annotations a
        JOIN samples s ON a.sample_id = s.sample_id
        WHERE s.task_id = ? GROUP BY a.geometry_status
    """, (task_id,))
    annotation_counts = dict(cursor.fetchall())

    cursor.execute("""
        SELECT COUNT(f.id)
        FROM feature_records f
        JOIN samples s ON f.sample_id = s.sample_id
        WHERE s.task_id = ?
    """, (task_id,))
    feature_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT r.decision, COUNT(*)
        FROM current_review_decisions r
        JOIN samples s ON r.sample_id = s.sample_id
        WHERE s.task_id = ? GROUP BY r.decision
    """, (task_id,))
    review_counts = dict(cursor.fetchall())

    cursor.execute("SELECT COUNT(*) FROM benchmark_builds WHERE task_id = ?", (task_id,))
    build_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM evaluation_runs WHERE task_id = ?", (task_id,))
    eval_count = cursor.fetchone()[0]

    conn.close()

    return {
        "task_id": task_id,
        "total_samples": sample_count,
        "quality_counts": quality_counts,
        "annotation_counts": annotation_counts,
        "feature_count": feature_count,
        "review_counts": review_counts,
        "total_reviews": sum(review_counts.values()),
        "build_count": build_count,
        "evaluation_count": eval_count,
    }
