import os
import sys
import typer
from typing import Optional
from rich.console import Console
from rich.table import Table

from app.services.dataset_service import scan_dataset
from app.services.audit_service import audit_dataset
from app.features.builder import build_features, get_feature_stats
from app.features.index import build_faiss_index
from app.features.search import search_by_sample
from app.features.duplicate import mine_near_duplicates

app = typer.Typer(
    name="iad-benchmark",
    help="Industrial AD Benchmark Agent CLI",
    add_completion=False,
)
features_app = typer.Typer(help="Manage image feature extraction and caching")
index_app = typer.Typer(help="Manage FAISS vector indexing")
duplicates_app = typer.Typer(help="Manage near-duplicate mining and reports")

app.add_typer(features_app, name="features")
app.add_typer(index_app, name="index")
app.add_typer(duplicates_app, name="duplicates")

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
    config: str = typer.Option(
        None, "--config", "-c", help="Path to dataset YAML config (optional)"
    ),
):
    """Audit scanned dataset in SQLite and output JSON/Markdown quality report."""
    try:
        console.print(f"[bold cyan]Auditing task:[/bold cyan] {task}")
        cfg = None
        if config:
            from app.schemas.config import load_config
            cfg = load_config(config)

        audit = audit_dataset(task_id=task, db_path=db, output_dir=output_dir, config=cfg)

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


# ----------------------------------------------------
# Step 2: Feature Commands
# ----------------------------------------------------


@features_app.command("build")
def features_build_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to build features for"),
    model: str = typer.Option("dinov2_vitb14_reg", "--model", "-m", help="Vision backbone model ID"),
    preprocess: str = typer.Option("dinov2_224_norm", "--preprocess", help="Preprocessing transform key"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    batch_size: int = typer.Option(64, "--batch-size", "-b", help="Inference batch size"),
    device: str = typer.Option("cuda:0", "--device", help="Torch device (e.g. cuda:0 or cpu)"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
    force: bool = typer.Option(False, "--force", help="Force recomputation of existing features"),
):
    """Batch build image embeddings into SQLite feature cache."""
    try:
        console.print(f"[bold cyan]Building features for task:[/bold cyan] {task} (model: {model}, device: {device})")
        res = build_features(
            task_id=task,
            model_id=model,
            preprocess_key=preprocess,
            db_path=db,
            batch_size=batch_size,
            device=device,
            output_dir=output_dir,
            force_recompute=force,
        )

        console.print("\n[bold green]✓ Feature Build Complete[/bold green]\n")
        console.print(f"Total Samples:    {res.total_samples:>10,}")
        console.print(f"Cache Hits:       {res.cached_count:>10,}")
        console.print(f"Newly Computed:   {res.computed_count:>10,}")
        console.print(f"Failed Samples:   {res.failed_count:>10,}")
        console.print(f"Coverage:         {res.coverage:>10.2%}")
        console.print(f"Elapsed Time:     {res.elapsed_seconds:>10.2f} s")
        console.print(f"Throughput:       {res.throughput:>10.1f} samples/s")
        console.print(f"\nReport saved to: {res.report_md_path}\n")
    except Exception as e:
        console.print(f"[bold red]Feature build failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@features_app.command("stats")
def features_stats_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to inspect"),
    model: str = typer.Option("dinov2_vitb14_reg", "--model", "-m", help="Vision model ID"),
    preprocess: str = typer.Option("dinov2_224_norm", "--preprocess", help="Preprocessing key"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Display feature cache coverage and storage statistics."""
    try:
        stats = get_feature_stats(task_id=task, model_id=model, preprocess_key=preprocess, db_path=db)
        console.print(f"\n[bold cyan]Feature Stats for Task:[/bold cyan] {task}\n")
        console.print(f"Model:            {stats['model_id']}")
        console.print(f"Preprocess:       {stats['preprocess_key']}")
        console.print(f"Total Samples:    {stats['total_samples']:>10,}")
        console.print(f"Cached Features:  {stats['cached_features']:>10,}")
        console.print(f"Coverage:         {stats['coverage']:>10.2%}")
        console.print(f"Dimension:        {stats['dim']}")
        console.print(f"Dtype:            {stats['dtype']}")
        console.print(f"Storage:          {stats['storage_bytes'] / (1024 * 1024):>10.2f} MB\n")
    except Exception as e:
        console.print(f"[bold red]Failed to get feature stats:[/bold red] {e}")
        raise typer.Exit(code=1)


# ----------------------------------------------------
# Step 2: Index Commands
# ----------------------------------------------------


@index_app.command("build")
def index_build_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID"),
    model: str = typer.Option("dinov2_vitb14_reg", "--model", "-m", help="Vision model ID"),
    preprocess: str = typer.Option("dinov2_224_norm", "--preprocess", help="Preprocessing key"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
):
    """Build FAISS IndexFlatIP (cosine similarity) from SQLite feature cache."""
    try:
        console.print(f"[bold cyan]Building FAISS index for task:[/bold cyan] {task}")
        res = build_faiss_index(
            task_id=task,
            model_id=model,
            preprocess_key=preprocess,
            db_path=db,
            output_dir=output_dir,
        )

        console.print("\n[bold green]✓ FAISS Index Build Complete[/bold green]\n")
        console.print(f"Vectors Indexed:  {res.num_vectors:>10,}")
        console.print(f"Vector Dim:       {res.dim:>10}")
        console.print(f"Elapsed Time:     {res.elapsed_seconds:>10.2f} s")
        console.print(f"Index File:       {res.index_path}")
        console.print(f"Sample IDs:       {res.sample_ids_path}\n")
    except Exception as e:
        console.print(f"[bold red]Index build failed:[/bold red] {e}")
        raise typer.Exit(code=1)


# ----------------------------------------------------
# Step 2: Search Command
# ----------------------------------------------------


@app.command("search")
def search_cmd(
    sample_id: str = typer.Option(..., "--sample-id", "-s", help="Query sample ID"),
    task: str = typer.Option(..., "--task", "-t", help="Task ID"),
    top_k: int = typer.Option(20, "--top-k", "-k", help="Number of nearest neighbors to return"),
    exclude_self: bool = typer.Option(True, "--exclude-self/--include-self", help="Exclude query sample from results"),
    index_dir: Optional[str] = typer.Option(None, "--index-dir", help="Custom FAISS index directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    data_origin: Optional[str] = typer.Option(None, "--data-origin", help="Filter by data origin"),
    quality: Optional[str] = typer.Option(None, "--quality", help="Filter by quality status"),
):
    """Search visual nearest neighbors for a sample using FAISS."""
    try:
        results = search_by_sample(
            sample_id=sample_id,
            task_id=task,
            top_k=top_k,
            exclude_self=exclude_self,
            index_dir=index_dir,
            db_path=db,
            filter_data_origin=data_origin,
            filter_quality_status=quality,
        )

        console.print(f"\n[bold cyan]Search Results for Sample:[/bold cyan] {sample_id} (Top {len(results)})\n")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Rank", justify="right", width=5)
        table.add_column("Score", justify="right", width=8)
        table.add_column("Sample ID", width=40)
        table.add_column("Quality", width=10)
        table.add_column("Origin", width=15)
        table.add_column("Batch ID", width=15)

        for r in results:
            q_color = "green" if r.quality_status == "PASS" else ("red" if r.quality_status == "FAIL" else "dim")
            table.add_row(
                str(r.rank),
                f"{r.score:.4f}",
                r.sample_id,
                f"[{q_color}]{r.quality_status}[/{q_color}]",
                r.data_origin,
                r.batch_id or "-",
            )

        console.print(table)
        console.print("")
    except Exception as e:
        console.print(f"[bold red]Search failed:[/bold red] {e}")
        raise typer.Exit(code=1)


# ----------------------------------------------------
# Step 2: Duplicates Commands
# ----------------------------------------------------


@duplicates_app.command("mine")
def duplicates_mine_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to mine duplicates for"),
    threshold: float = typer.Option(0.98, "--threshold", help="Cosine similarity candidate threshold"),
    top_k: int = typer.Option(50, "--top-k", help="Top-K neighbors to query per sample"),
    index_dir: Optional[str] = typer.Option(None, "--index-dir", help="Custom FAISS index directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
):
    """Mine near-duplicate candidate groups from FAISS index."""
    try:
        console.print(f"[bold cyan]Mining near-duplicates for task:[/bold cyan] {task} (threshold: {threshold})")
        res = mine_near_duplicates(
            task_id=task,
            similarity_threshold=threshold,
            top_k_neighbors=top_k,
            index_dir=index_dir,
            db_path=db,
            output_dir=output_dir,
        )

        console.print("\n[bold green]✓ Near-Duplicate Mining Complete[/bold green]\n")
        console.print(f"Total Samples:        {res.total_samples:>10,}")
        console.print(f"Duplicate Groups:     {res.group_count:>10,}")
        console.print(f"Duplicate Samples:    {res.duplicate_sample_count:>10,}")
        console.print(f"Cross-Origin Groups:  {res.cross_origin_group_count:>10,}")
        console.print(f"Elapsed Time:         {res.elapsed_seconds:>10.2f} s")
        console.print(f"\nGroups JSON:  {res.groups_json_path}")
        console.print(f"Audit Report: {res.report_md_path}\n")
    except Exception as e:
        console.print(f"[bold red]Duplicate mining failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@duplicates_app.command("report")
def duplicates_report_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID"),
    report_dir: Optional[str] = typer.Option(None, "--report-dir", "-d", help="Directory containing duplicate report"),
):
    """Display duplicate report file location."""
    r_dir = report_dir or os.path.join("runs", "near_duplicate", task)
    md_file = os.path.join(r_dir, "duplicate_report.md")
    json_file = os.path.join(r_dir, "groups.json")

    if not os.path.exists(md_file):
        console.print(f"[bold red]Duplicate report not found at:[/bold red] {md_file}")
        raise typer.Exit(code=1)

    console.print(f"\n[bold green]✓ Duplicate Report for {task}:[/bold green]")
    console.print(f"Markdown: {md_file}")
    console.print(f"JSON:     {json_file}\n")


def main():
    app()


if __name__ == "__main__":
    main()
