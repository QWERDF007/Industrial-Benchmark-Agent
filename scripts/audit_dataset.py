import argparse
import sys
import logging
from app.services.audit_service import audit_dataset

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


def main():
    parser = argparse.ArgumentParser(description="Audit dataset in SQLite database.")
    parser.add_argument("--task", "-t", required=True, help="Task ID to audit")
    parser.add_argument(
        "--db", default="data/benchmark.db", help="Path to SQLite benchmark database"
    )
    parser.add_argument(
        "--output-dir", "-o", default=None, help="Directory to save audit reports"
    )
    args = parser.parse_args()

    try:
        audit = audit_dataset(
            task_id=args.task, db_path=args.db, output_dir=args.output_dir
        )
        s = audit.samples
        m = audit.metadata
        tr = audit.track_readiness

        print(f"\nTask: {audit.task_id}\n")
        print("Samples")
        print("-" * 25)
        print(f"PASS        {s['pass']:>12,}")
        print(f"FAIL        {s['fail']:>12,}")
        print(f"UNCERTAIN   {s['uncertain']:>12,}")
        print(f"TOTAL       {s['total']:>12,}\n")

        print("Metadata Missing Rates")
        print("-" * 25)
        print(f"Missing batch        {m.get('missing_batch_id', 0.0):>10.1%}")
        print(f"Missing sample id    {m.get('missing_physical_sample_id', 0.0):>10.1%}")
        print(f"Missing sequence     {m.get('missing_capture_sequence_id', 0.0):>10.1%}\n")

        print("Track Readiness")
        print("-" * 25)
        for track, status in tr.items():
            print(f"{track:<20} {status}")

        print(f"\nAudit completed successfully for task '{args.task}'.")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Audit failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
