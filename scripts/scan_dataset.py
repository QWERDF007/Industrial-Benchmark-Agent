import argparse
import sys
import logging
from iad_core.dataset.scanner import scan_dataset

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


def main():
    parser = argparse.ArgumentParser(description="Scan dataset into SQLite database.")
    parser.add_argument("--config", "-c", required=True, help="Path to dataset YAML config")
    parser.add_argument(
        "--db", default="data/benchmark.db", help="Path to SQLite benchmark database"
    )
    parser.add_argument(
        "--batch-size", type=int, default=500, help="Batch size for writing to database"
    )
    args = parser.parse_args()

    try:
        result = scan_dataset(
            config_path=args.config, db_path=args.db, batch_size=args.batch_size
        )
        print("\n--- Scan Result ---")
        print(f"Task ID:          {result.task_id}")
        print(f"Images Scanned:   {result.image_count:,}")
        print(f"Annotations:      {result.annotation_count:,}")
        print(f"Issues Recorded:  {result.issue_count:,}")
        print(f"Database:         {result.db_path}")
        sys.exit(0)
    except Exception as e:
        print(f"\n[ERROR] Dataset scan failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
