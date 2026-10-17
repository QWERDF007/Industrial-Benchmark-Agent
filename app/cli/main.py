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
from app.candidates.miner import mine_candidates
from app.candidates.schemas import CandidateScoringWeights
from app.review.web import create_review_server
from app.review.report import export_review_decisions, generate_review_report
from app.gold.builder import build_gold
from app.split.group import build_split_groups
from app.split.builder import build_group_split
from app.split.leakage import check_leakage, save_leakage_reports
from app.benchmark.builder import run_benchmark_pipeline, load_verified_duplicates, generate_build_id
from app.benchmark.readiness import evaluate_track_readiness
from app.benchmark.exporter import export_benchmark
from app.benchmark.report import generate_benchmark_report

app = typer.Typer(
    name="iad-benchmark",
    help="Industrial AD Benchmark Agent CLI",
    add_completion=False,
)
features_app = typer.Typer(help="Manage image feature extraction and caching")
index_app = typer.Typer(help="Manage FAISS vector indexing")
duplicates_app = typer.Typer(help="Manage near-duplicate mining and reports")
candidates_app = typer.Typer(help="Manage hard normal candidate mining and reports")
review_app = typer.Typer(help="Manage human review queue, web UI, and reports")
gold_app = typer.Typer(help="Manage Gold benchmark labels")
split_app = typer.Typer(help="Manage Group-safe Train/Val/Test Split")
leakage_app = typer.Typer(help="Manage leakage verification")
benchmark_app = typer.Typer(help="Manage benchmark builds and reports")

app.add_typer(features_app, name="features")
app.add_typer(index_app, name="index")
app.add_typer(duplicates_app, name="duplicates")
app.add_typer(candidates_app, name="candidates")
app.add_typer(review_app, name="review")
app.add_typer(gold_app, name="gold")
app.add_typer(split_app, name="split")
app.add_typer(leakage_app, name="leakage")
app.add_typer(benchmark_app, name="benchmark")

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


# ----------------------------------------------------
# Step 3: Hard Normal Candidate Mining Commands
# ----------------------------------------------------


@candidates_app.command("mine")
def candidates_mine_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to mine candidates for"),
    top_k: int = typer.Option(500, "--top-k", help="Top-K candidates to select"),
    policy: Optional[str] = typer.Option(None, "--policy", help="Scoring policy name override"),
    diversity_threshold: Optional[float] = typer.Option(None, "--diversity-threshold", help="Greedy diversity suppression threshold (defaults to config)"),
    pool: str = typer.Option("UNCERTAIN", "--pool", help="Candidate pool filter ('UNCERTAIN', 'ALL', 'PASS')"),
    include_hard_normal: Optional[bool] = typer.Option(None, "--include-hard-normal/--no-include-hard-normal", help="Include reviewed HARD_NORMAL in reference normal set"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Path to YAML dataset config"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
):
    """Mine hard normal candidates from cached features using composite scoring and diversity suppression."""
    try:
        console.print(f"[bold cyan]Mining hard normal candidates for task:[/bold cyan] {task} (pool: {pool}, top-k: {top_k})")
        res = mine_candidates(
            task_id=task,
            top_k=top_k,
            policy_name=policy,
            diversity_threshold=diversity_threshold,
            target_pool=pool,
            include_hard_normal=include_hard_normal,
            config_path=config,
            db_path=db,
            output_dir=output_dir,
        )

        console.print("\n[bold green]✓ Candidate Mining Complete[/bold green]\n")
        console.print(f"Policy Name:           {res.policy_name}")
        console.print(f"Candidate Pool Size:   {res.pool_size:>10,}")
        console.print(f"Top-K Requested:       {res.top_k:>10,}")
        console.print(f"Selected Diverse:      {res.selected_count:>10,}")
        console.print(f"Normal Reference Set:  {res.reference_count:>10,}")
        if res.reference_breakdown:
            console.print(f"  - Raw PASS:          {res.reference_breakdown.get('raw_pass', 0):>10,}")
            console.print(f"  - Review PASS:       {res.reference_breakdown.get('review_pass', 0):>10,}")
            console.print(f"  - Review Hard Normal:{res.reference_breakdown.get('hard_normal', 0):>10,}")
        if res.low_reference_warning:
            console.print("  [bold yellow]⚠ Warning: Low normal reference coverage[/bold yellow]")
        console.print(f"Elapsed Time:          {res.elapsed_seconds:>10.2f} s")
        console.print(f"\nCandidates JSON: {res.candidates_json_path}")
        console.print(f"Mining Report:   {res.report_md_path}\n")
    except Exception as e:
        console.print(f"[bold red]Candidate mining failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@candidates_app.command("report")
def candidates_report_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID"),
    report_dir: Optional[str] = typer.Option(None, "--report-dir", "-d", help="Directory containing candidate mining report"),
):
    """Display candidate mining report location."""
    r_dir = report_dir or os.path.join("runs", "candidate_mining", task)
    md_file = os.path.join(r_dir, "mining_report.md")
    json_file = os.path.join(r_dir, "candidates.json")

    if not os.path.exists(md_file):
        console.print(f"[bold red]Candidate mining report not found at:[/bold red] {md_file}")
        raise typer.Exit(code=1)

    console.print(f"\n[bold green]✓ Candidate Mining Report for {task}:[/bold green]")
    console.print(f"Markdown: {md_file}")
    console.print(f"JSON:     {json_file}\n")


# ----------------------------------------------------
# Step 3: Human Review Queue Commands
# ----------------------------------------------------


@review_app.command("serve")
def review_serve_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to review"),
    host: str = typer.Option("127.0.0.1", "--host", help="Server bind host"),
    port: int = typer.Option(8000, "--port", "-p", help="Server bind port"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
    candidates_json: Optional[str] = typer.Option(None, "--candidates", help="Path to candidates.json"),
):
    """Start lightweight local web review UI server."""
    try:
        console.print(f"[bold cyan]Starting Review Web UI server for task:[/bold cyan] {task}")
        server = create_review_server(
            task_id=task,
            host=host,
            port=port,
            db_path=db,
            candidates_json_path=candidates_json,
        )
        console.print(f"\n[bold green]✓ Review Server running at:[/bold green] http://{host}:{port}/")
        console.print("[dim]Press Ctrl+C to stop server[/dim]\n")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            console.print("\n[yellow]Shutting down review server...[/yellow]")
            server.shutdown()
            server.server_close()
    except Exception as e:
        console.print(f"[bold red]Failed to start review server:[/bold red] {e}")
        raise typer.Exit(code=1)


@review_app.command("export")
def review_export_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to export decisions for"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom export directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Export all review decisions to review_export.json."""
    try:
        console.print(f"[bold cyan]Exporting review decisions for task:[/bold cyan] {task}")
        export_path = export_review_decisions(
            task_id=task,
            db_path=db,
            output_dir=output_dir,
        )
        console.print(f"\n[bold green]✓ Review decisions exported to:[/bold green] {export_path}\n")
    except Exception as e:
        console.print(f"[bold red]Export failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@review_app.command("report")
def review_report_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to generate report for"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom report directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Generate markdown audit report from human review decisions."""
    try:
        console.print(f"[bold cyan]Generating review report for task:[/bold cyan] {task}")
        report_path = generate_review_report(
            task_id=task,
            db_path=db,
            output_dir=output_dir,
        )
        console.print(f"\n[bold green]✓ Review report generated at:[/bold green] {report_path}\n")
    except Exception as e:
        console.print(f"[bold red]Report generation failed:[/bold red] {e}")
        raise typer.Exit(code=1)



# ----------------------------------------------------
# Step 4: Gold, Split, Leakage Gate & Benchmark CLI
# ----------------------------------------------------

@gold_app.command("build")
def gold_build_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to build gold ground truth for"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Path to dataset YAML config"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Build Gold benchmark labels and persist to gold_records table."""
    try:
        console.print(f"[bold cyan]Building Gold ground truth for task:[/bold cyan] {task}")
        result = build_gold(
            task_id=task,
            config_path=config,
            output_dir=output_dir,
            db_path=db,
        )

        table = Table(title=f"Gold Build Summary: {task}")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", style="green", justify="right")

        table.add_row("Total Raw Samples", str(result.total_samples))
        table.add_row("Confirmed Gold", str(result.gold_confirmed_count))
        table.add_row("  ├── PASS (Normal)", str(result.normal_count))
        table.add_row("  ├── HARD_NORMAL", str(result.hard_normal_count))
        table.add_row("  └── FAIL (Anomaly)", str(result.fail_count))
        table.add_row("Conflicts (conflicts.json)", str(result.conflict_count))
        table.add_row("Excluded (Uncertain)", str(result.excluded_count))

        console.print(table)
        console.print(f"\n[bold green]✓ Gold export completed in {result.elapsed_seconds:.2f}s[/bold green]")
        console.print(f"  Gold file:      {result.gold_jsonl_path}")
        console.print(f"  Conflicts file: {result.conflicts_json_path}\n")
    except Exception as e:
        console.print(f"[bold red]Gold build failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@split_app.command("build")
def split_build_cmd(
    task: Optional[str] = typer.Option(None, "--task", "-t", help="Task ID to split"),
    build_id: Optional[str] = typer.Option(None, "--build-id", "-b", help="Build ID"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Path to dataset YAML config"),
    seed: Optional[int] = typer.Option(None, "--seed", "-s", help="Random seed for deterministic split"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Build deterministic group-safe train/val/test split and check leakage gate."""
    try:
        if not task and not build_id:
            console.print("[bold red]Either --task or --build-id must be specified[/bold red]")
            raise typer.Exit(code=1)

        if not task and build_id:
            import sqlite3
            conn = sqlite3.connect(db)
            cursor = conn.cursor()
            cursor.execute("SELECT task_id FROM benchmark_builds WHERE build_id = ?", (build_id,))
            row = cursor.fetchone()
            conn.close()
            if row:
                task = row[0]
            else:
                task = build_id.rsplit("_", 2)[0] if "_" in build_id else build_id

        console.print(f"[bold cyan]Running Group-safe Split for task:[/bold cyan] {task}")
        result = run_benchmark_pipeline(
            task_id=task,
            build_id=build_id,
            config_path=config,
            output_dir=output_dir,
            db_path=db,
            seed=seed,
        )

        table = Table(title=f"Split Result: {result.build_id}")
        table.add_column("Split", style="cyan")
        table.add_column("Samples", style="green", justify="right")

        table.add_row("Train", str(result.train_count))
        table.add_row("Val", str(result.val_count))
        table.add_row("Test", str(result.test_count))
        table.add_row("Total Gold", str(result.gold_count))

        console.print(table)
        leakage_badge = "[bold green]PASSED (0 leakage)[/bold green]" if result.leakage_passed else "[bold red]FAILED[/bold red]"
        console.print(f"Leakage Gate: {leakage_badge}")
        console.print(f"Status:       [bold]{result.status}[/bold]")
        console.print(f"Export dir:   {result.output_dir}\n")
    except Exception as e:
        console.print(f"[bold red]Split build failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@leakage_app.command("check")
def leakage_check_cmd(
    build_id: str = typer.Option(..., "--build-id", "-b", help="Build ID to check leakage for"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Check leakage gate across train/val/test splits for a benchmark build."""
    try:
        import sqlite3
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        cursor.execute("SELECT task_id, output_dir FROM benchmark_builds WHERE build_id = ?", (build_id,))
        row = cursor.fetchone()
        if not row:
            console.print(f"[bold red]Build {build_id} not found in database[/bold red]")
            raise typer.Exit(code=1)
        task_id, output_dir = row[0], row[1]

        # Load samples and assignments
        cursor.execute("SELECT sample_id, split_name FROM split_assignments WHERE build_id = ?", (build_id,))
        assignments = {r[0]: r[1] for r in cursor.fetchall()}

        if not assignments:
            console.print(f"[bold yellow]No split assignments found for build {build_id}[/bold yellow]")
            return

        cursor.execute("""
            SELECT sample_id, task_id, dataset_id, image_path, relative_path,
                   quality_status, data_origin, physical_sample_id,
                   capture_sequence_id, width, height
            FROM samples
            WHERE sample_id IN ({})
        """.format(",".join("?" for _ in assignments)), list(assignments.keys()))
        s_rows = cursor.fetchall()
        conn.close()

        from app.schemas.sample import Sample, QualityStatus, DataOrigin
        samples = [
            Sample(
                sample_id=r[0], task_id=r[1], dataset_id=r[2], image_path=r[3],
                relative_path=r[4], quality_status=QualityStatus(r[5]),
                data_origin=DataOrigin(r[6]) if r[6] else DataOrigin.UNKNOWN,
                physical_sample_id=r[7], capture_sequence_id=r[8],
                width=r[9], height=r[10],
            )
            for r in s_rows
        ]

        verified_pairs, verified_groups = load_verified_duplicates(task_id)
        report = check_leakage(
            samples=samples,
            assignments=assignments,
            verified_pairs=verified_pairs,
            verified_components=verified_groups,
        )

        table = Table(title=f"Leakage Gate Verification: {build_id}")
        table.add_column("Check", style="cyan")
        table.add_column("Violations", justify="right")
        table.add_column("Status", justify="center")

        def status_str(count):
            return "[bold green]PASS[/bold green]" if count == 0 else "[bold red]FAIL[/bold red]"

        table.add_row("Physical Sample Leakage", str(len(report.physical_leakages)), status_str(len(report.physical_leakages)))
        table.add_row("Capture Sequence Leakage", str(len(report.capture_leakages)), status_str(len(report.capture_leakages)))
        table.add_row("Direct Duplicate Leakage", str(len(report.duplicate_leakages)), status_str(len(report.duplicate_leakages)))
        table.add_row("Component Leakage", str(len(report.component_leakages)), status_str(len(report.component_leakages)))
        table.add_row("Augmented Origin Policy", str(len(report.augmented_leakages)), status_str(len(report.augmented_leakages)))

        console.print(table)
        status_text = "[bold green]✓ ALL GATES PASSED[/bold green]" if report.is_passed else "[bold red]❌ LEAKAGE DETECTED[/bold red]"
        console.print(f"\nResult: {status_text}\n")
    except Exception as e:
        console.print(f"[bold red]Leakage check failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@benchmark_app.command("build")
def benchmark_build_cmd(
    task: str = typer.Option(..., "--task", "-t", help="Task ID to build benchmark for"),
    build_id: Optional[str] = typer.Option(None, "--build-id", "-b", help="Build ID (optional)"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Path to dataset YAML config"),
    seed: Optional[int] = typer.Option(None, "--seed", "-s", help="Random seed for deterministic split"),
    output_dir: Optional[str] = typer.Option(None, "--output-dir", "-o", help="Custom output directory"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """Run end-to-end benchmark build: Gold, Group-safe Split, Leakage Gate, and Export."""
    try:
        console.print(f"[bold cyan]Running complete Benchmark build for task:[/bold cyan] {task}")
        result = run_benchmark_pipeline(
            task_id=task,
            build_id=build_id,
            config_path=config,
            output_dir=output_dir,
            db_path=db,
            seed=seed,
        )

        table = Table(title=f"Benchmark Build Summary: {result.build_id}")
        table.add_column("Item", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Build ID", result.build_id)
        table.add_row("Task ID", result.task_id)
        table.add_row("Status", result.status)
        table.add_row("Confirmed Gold Samples", str(result.gold_count))
        table.add_row("Train / Val / Test", f"{result.train_count} / {result.val_count} / {result.test_count}")
        table.add_row("Leakage Gate Passed", str(result.leakage_passed))
        table.add_row("Output Directory", result.output_dir)

        console.print(table)
        console.print(f"\n[bold green]✓ Benchmark bundle exported to:[/bold green] {result.output_dir}\n")
    except Exception as e:
        console.print(f"[bold red]Benchmark build failed:[/bold red] {e}")
        raise typer.Exit(code=1)


@benchmark_app.command("report")
def benchmark_report_cmd(
    build_id: str = typer.Option(..., "--build-id", "-b", help="Build ID to view report for"),
    db: str = typer.Option("data/benchmark.db", "--db", help="Path to SQLite benchmark database"),
):
    """View benchmark build report and track readiness assessment."""
    try:
        import sqlite3
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        cursor.execute("SELECT output_dir, status FROM benchmark_builds WHERE build_id = ?", (build_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            console.print(f"[bold red]Build {build_id} not found in database[/bold red]")
            raise typer.Exit(code=1)

        output_dir, status = row[0], row[1]
        report_file = os.path.join(output_dir, "benchmark_report.md")
        if not os.path.exists(report_file):
            console.print(f"[bold red]Report file not found: {report_file}[/bold red]")
            raise typer.Exit(code=1)

        with open(report_file, "r", encoding="utf-8") as f:
            content = f.read()

        console.print(f"\n[bold cyan]Benchmark Report: {build_id} (Status: {status})[/bold cyan]\n")
        console.print(content)
    except Exception as e:
        console.print(f"[bold red]Failed to view report:[/bold red] {e}")
        raise typer.Exit(code=1)


def main():
    app()


if __name__ == "__main__":
    main()
