import os
import sys
import time
import json
import logging
from typing import Optional, List
import typer
from rich.console import Console
from rich.table import Table

import iad_domain_server.tools as domain_tools
from iad_domain_server.contracts import ToolStatus

app = typer.Typer(
    name="iad",
    help="Industrial Benchmark Agent - Unified CLI (R105)",
    add_completion=False,
)
agent_app = typer.Typer(help="Agent runtime workflows and session control")
core_app = typer.Typer(help="Direct Domain Core authority commands")
benchmark_app = typer.Typer(help="Benchmark build and status commands")

app.add_typer(agent_app, name="agent")
app.add_typer(core_app, name="core")
core_app.add_typer(benchmark_app, name="benchmark")

console = Console()


# -----------------------------------------------------------------------------
# 1. iad web
# -----------------------------------------------------------------------------

@app.command("web")
def run_web(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host address to bind"),
    port: int = typer.Option(8000, "--port", "-p", help="Port to bind"),
    reload: bool = typer.Option(False, "--reload", help="Enable uvicorn auto-reload"),
):
    """Start the Industrial Benchmark Domain Server and Web UI."""
    from iad_domain_server.main import main as start_server
    console.print(f"[bold green]Starting Industrial Benchmark Server at http://{host}:{port}[/bold green]")
    start_server(host=host, port=port, reload=reload)


# -----------------------------------------------------------------------------
# 2. iad agent
# -----------------------------------------------------------------------------

@agent_app.command("run")
def agent_run(
    prompt: str = typer.Argument(..., help="Natural language instruction for the agent"),
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t", help="Inspection task ID"),
    config_path: Optional[str] = typer.Option(None, "--config", "-c", help="Task config path"),
):
    """
    Run headless autonomous agent workflow for benchmark construction or evaluation (R411, R701).
    Dispatches tools based on prompt intent and respects REVIEW_REQUIRED pause gate.
    """
    console.print(f"[bold cyan]Agent received goal:[/bold cyan] {prompt}")
    console.print(f"[dim]Task: {task_id}[/dim]")

    lower = prompt.lower()

    if "eval" in lower or "compare" in lower or "baseline" in lower or "dinomaly" in lower or "patchcore" in lower:
        console.print("[yellow]Executing Benchmark Evaluation Workflow...[/yellow]")
        # 1. task_inspect
        t_res = domain_tools.task_inspect(task_id=task_id)
        latest_build = t_res.metrics.get("latest_build_id")
        if not latest_build:
            console.print("[bold red]Error: No benchmark build found. Please run benchmark build first.[/bold red]")
            raise typer.Exit(1)

        # 2. baseline_run for dinomaly2
        console.print(f"[dim]Evaluating baseline dinomaly2 on build {latest_build}...[/dim]")
        r1 = domain_tools.baseline_run(task_id=task_id, build_id=latest_build, model_id="dinomaly2")
        console.print(f"[green]✓ dinomaly2 evaluated:[/green] {r1.summary}")

        # 3. baseline_run for patchcore
        console.print(f"[dim]Evaluating baseline patchcore on build {latest_build}...[/dim]")
        r2 = domain_tools.baseline_run(task_id=task_id, build_id=latest_build, model_id="patchcore")
        console.print(f"[green]✓ patchcore evaluated:[/green] {r2.summary}")

        # 4. evaluation_compare
        console.print("[dim]Comparing evaluated baselines...[/dim]")
        cmp_res = domain_tools.evaluation_compare(task_id=task_id, build_id=latest_build)
        console.print(f"[bold green]✓ Multi-model comparison completed:[/bold green] {cmp_res.summary}")
        return

    # Default: Benchmark Build Workflow (R701)
    console.print("[yellow]Step 1/6: Inspecting Task...[/yellow]")
    t_res = domain_tools.task_inspect(task_id=task_id)
    console.print(f"[green]✓ Task inspected:[/green] {t_res.summary}")

    console.print("[yellow]Step 2/6: Auditing Dataset...[/yellow]")
    a_res = domain_tools.dataset_audit(task_id=task_id, config_path=config_path)
    console.print(f"[green]✓ Dataset audited:[/green] {a_res.summary}")

    console.print("[yellow]Step 3/6: Preparing Features...[/yellow]")
    f_res = domain_tools.feature_prepare(task_id=task_id)
    console.print(f"[green]✓ Features ready:[/green] {f_res.summary}")

    console.print("[yellow]Step 4/6: Auditing Near-Duplicates...[/yellow]")
    d_res = domain_tools.duplicate_audit(task_id=task_id)
    console.print(f"[green]✓ Duplicates clustered:[/green] {d_res.summary}")

    console.print("[yellow]Step 5/6: Checking Review Status...[/yellow]")
    r_res = domain_tools.review_status(task_id=task_id)
    console.print(f"[green]✓ Review status:[/green] {r_res.summary}")

    if r_res.metrics.get("total_decisions", 0) == 0:
        console.print("[yellow]Mining hard normal candidates...[/yellow]")
        c_res = domain_tools.candidate_mine(task_id=task_id, config_path=config_path)
        console.print(f"[bold red]HALTED (REVIEW_REQUIRED):[/bold red] {c_res.summary}")
        console.print("[bold yellow]Human operator must review candidates in Web UI before building benchmark.[/bold yellow]")
        raise typer.Exit(0)

    console.print("[yellow]Step 6/6: Formally Building Benchmark...[/yellow]")
    b_res = domain_tools.benchmark_build(task_id=task_id, config_path=config_path)
    if b_res.status == ToolStatus.OK:
        console.print(f"[bold green]✓ Benchmark build SUCCESS:[/bold green] {b_res.summary}")
    else:
        console.print(f"[bold red]Benchmark build {b_res.status.value}:[/bold red] {b_res.summary}")


@agent_app.command("resume")
def agent_resume(
    session_id: str = typer.Argument(..., help="Harness session ID to resume"),
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t", help="Task ID"),
    config_path: Optional[str] = typer.Option(None, "--config", "-c", help="Config path"),
):
    """Resume execution of a paused session after human review decisions are submitted (R408)."""
    console.print(f"[bold cyan]Resuming Session:[/bold cyan] {session_id}")
    r_res = domain_tools.review_status(task_id=task_id)
    console.print(f"[dim]Current Review Status: {r_res.summary}[/dim]")

    # Proceed to build benchmark
    b_res = domain_tools.benchmark_build(task_id=task_id, config_path=config_path)
    console.print(f"[bold green]✓ Post-Review Benchmark Build Result:[/bold green] {b_res.summary}")


# -----------------------------------------------------------------------------
# 3. iad core
# -----------------------------------------------------------------------------

@core_app.command("audit")
def core_audit(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    config_path: Optional[str] = typer.Option(None, "--config", "-c"),
):
    """Run dataset audit and 5-track readiness assessment."""
    res = domain_tools.dataset_audit(task_id=task_id, config_path=config_path)
    console.print(f"[{'green' if res.status == ToolStatus.OK else 'yellow'}]{res.summary}[/]")


@core_app.command("feature")
def core_feature(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    batch_size: int = typer.Option(64, "--batch-size", "-b"),
):
    """Extract and cache DINOv2 features and build FAISS index."""
    res = domain_tools.feature_prepare(task_id=task_id, batch_size=batch_size)
    console.print(f"[green]{res.summary}[/green]")


@core_app.command("duplicate")
def core_duplicate(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    threshold: float = typer.Option(0.98, "--threshold"),
):
    """Audit near-duplicate image pairs with Pixel PairVerifier V2."""
    res = domain_tools.duplicate_audit(task_id=task_id, similarity_threshold=threshold)
    console.print(f"[green]{res.summary}[/green]")


@core_app.command("candidate")
def core_candidate(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    top_k: int = typer.Option(500, "--top-k", "-k"),
):
    """Mine hard normal candidates from uncertain pool."""
    res = domain_tools.candidate_mine(task_id=task_id, top_k=top_k)
    console.print(f"[{'green' if res.status == ToolStatus.OK else 'yellow'}]{res.summary}[/]")


@benchmark_app.command("build")
def core_benchmark_build(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    build_id: Optional[str] = typer.Option(None, "--build-id"),
    config_path: Optional[str] = typer.Option(None, "--config", "-c"),
    seed: Optional[int] = typer.Option(None, "--seed"),
):
    """Formally build benchmark assets, enforce leakage gate, and persist to SQLite."""
    res = domain_tools.benchmark_build(
        task_id=task_id,
        build_id=build_id,
        config_path=config_path,
        seed=seed,
    )
    console.print(f"[{'green' if res.status == ToolStatus.OK else 'red'}]{res.summary}[/]")


@benchmark_app.command("status")
def core_benchmark_status(
    build_id: str = typer.Argument(..., help="Benchmark build ID"),
):
    """Inspect benchmark build status and split distribution."""
    res = domain_tools.benchmark_status(build_id=build_id)
    console.print(f"[green]{res.summary}[/green]")


@benchmark_app.command("leakage")
def core_leakage_check(
    build_id: str = typer.Argument(..., help="Benchmark build ID"),
):
    """Check 5-point blocking leakage gate."""
    res = domain_tools.leakage_check(build_id=build_id)
    console.print(f"[{'green' if res.status == ToolStatus.OK else 'red'}]{res.summary}[/]")


@core_app.command("evaluate")
def core_evaluate(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    build_id: str = typer.Option(..., "--build-id", "-b"),
    model_id: str = typer.Option("dinomaly2", "--model", "-m"),
    strategy: str = typer.Option("f1_max", "--strategy", "-s"),
):
    """Execute baseline evaluation on a benchmark build with Val-only threshold fitting."""
    res = domain_tools.baseline_run(
        task_id=task_id,
        build_id=build_id,
        model_id=model_id,
        threshold_strategy=strategy,
    )
    console.print(f"[{'green' if res.status == ToolStatus.OK else 'red'}]{res.summary}[/]")


@core_app.command("compare")
def core_compare(
    task_id: str = typer.Option("kuangjiao_inspection_01", "--task", "-t"),
    build_id: str = typer.Option(..., "--build-id", "-b"),
):
    """Compare evaluated baseline models on a benchmark build."""
    res = domain_tools.evaluation_compare(task_id=task_id, build_id=build_id)
    console.print(f"[green]{res.summary}[/green]")


def main():
    app()


if __name__ == "__main__":
    main()
