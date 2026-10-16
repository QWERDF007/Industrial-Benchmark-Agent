import os
import sys
import typer
from rich.console import Console
from rich.table import Table

from app.services.dataset_service import scan_dataset
from app.services.audit_service import audit_dataset

app = typer.Typer(
    name="iad-benchmark",
    help="Industrial AD Benchmark Agent - Dataset Foundation CLI",
    add_completion=False,
)
console = Console()


@app.command("scan")
def scan_cmd(
    config: str = typer.Option(..., "--config", "-c", help="Path to dataset YAML config"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    batch_size: int = typer.Option(500, "--batch-size", help="Batch size for writing records"),
):
    """Scan dataset according to configuration file and persist records into SQLite."""
    try:
        console.print(f"[bold cyan]Scanning dataset using config:[/bold cyan] {config}")
        result = scan_dataset(config_path=config, db_path=db, batch_size=batch_size)

        console.print("\n[bold green]✓ Dataset Scan Complete[/bold green]\n")
        console.print(f"Task: [bold]{result.task_id}[/bold]")
        console.print(f"Images:         {result.image_count:>10,}")
        console.print(f"Annotations:    {result.annotation_count:>10,}")
        console.print(f"Issues:         {result.issue_count:>10,}")
        console.print(f"\nDatabase:\n{result.db_path}\n")
    except Exception as e:
        console.print(f"[bold red]Scan failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("audit")
def audit_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to audit"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    output_dir: str = typer.Option(
        None, "--output-dir", "-o", help="Custom output directory for reports"
    ),
):
    """Audit scanned dataset in SQLite and output JSON/Markdown quality report."""
    try:
        console.print(f"[bold cyan]Auditing task:[/bold cyan] {task}")
        audit = audit_dataset(task_id=task, db_path=db, output_dir=output_dir)

        s = audit.samples
        m = audit.metadata
        tr = audit.track_readiness

        console.print(f"\nTask: [bold]{audit.task_id}[/bold]\n")

        console.print("Samples")
        console.print("-" * 25)
        console.print(f"PASS        {s['pass']:>12,}")
        console.print(f"FAIL        {s['fail']:>12,}")
        console.print(f"UNCERTAIN   {s['uncertain']:>12,}")
        console.print(f"TOTAL       {s['total']:>12,}\n")

        console.print("Metadata Missing Rates")
        console.print("-" * 25)
        console.print(f"Missing batch        {m.get('missing_batch_id', 0.0):>10.1%}")
        console.print(f"Missing sample id    {m.get('missing_physical_sample_id', 0.0):>10.1%}")
        console.print(f"Missing sequence     {m.get('missing_capture_sequence_id', 0.0):>10.1%}\n")

        console.print("Track Readiness")
        console.print("-" * 25)
        for track, status in tr.items():
            color = "green" if status == "READY" else ("yellow" if status == "PARTIAL" else "dim")
            console.print(f"{track:<20} [{color}]{status}[/{color}]")

        out_path = output_dir or os.path.join("runs", "dataset_audit", task)
        console.print(f"\n[bold green]✓ Audit reports saved to:[/bold green] {out_path}/\n")
    except Exception as e:
        console.print(f"[bold red]Audit failed:[/bold red] {e}")
        raise typer.Exit(code=1)


def main():
    app()


if __name__ == "__main__":
    main()
