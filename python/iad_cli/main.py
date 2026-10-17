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
    session_id: Optional[str] = typer.Option(None, "--session-id", "-s", help="Optional Harness session ID to adopt"),
):
    """
    Run autonomous agent goal via DeepSeek Harness Runtime (Tickets A001~A004, Specs S1).
    """
    console.print(f"[bold cyan]Harness Agent received goal:[/bold cyan] {prompt}")
    from iad_agent import run as harness_run

    res = harness_run(goal=prompt, session_id=session_id)
    console.print(f"[dim]Harness Session ID: {res.session_id}[/dim]")
    console.print(f"[bold {'green' if res.status == 'SUCCESS' else 'yellow' if res.status in ('REVIEW_REQUIRED', 'AUTH_REQUIRED') else 'red'}]Status: {res.status}[/]")

    if res.final_text:
        console.print(f"[white]{res.final_text}[/white]")
    if res.error_message:
        console.print(f"[red]Notice / Error: {res.error_message}[/red]")


@agent_app.command("resume")
def agent_resume(
    session_id: str = typer.Argument(..., help="Harness session ID to resume"),
    prompt: Optional[str] = typer.Option(None, "--prompt", "-p", help="Optional instruction for the resumed turn"),
):
    """
    Resume an existing DeepSeek Harness session (Tickets A001, A005, Spec S1.3).
    Strictly reuses the same session_id across turns.
    """
    console.print(f"[bold cyan]Resuming Harness Session:[/bold cyan] {session_id}")
    from iad_agent import resume as harness_resume

    res = harness_resume(session_id=session_id, prompt=prompt)
    console.print(f"[dim]Harness Session ID: {res.session_id}[/dim]")
    console.print(f"[bold {'green' if res.status == 'SUCCESS' else 'yellow' if res.status in ('REVIEW_REQUIRED', 'AUTH_REQUIRED') else 'red'}]Status: {res.status}[/]")

    if res.final_text:
        console.print(f"[white]{res.final_text}[/white]")
    if res.error_message:
        console.print(f"[red]Notice / Error: {res.error_message}[/red]")


@app.command("web")
def web_supervisor(
    port: int = typer.Option(8000, "--port", "-p", help="Domain server port"),
    dsh_port: int = typer.Option(8080, "--dsh-port", help="DeepSeek Harness Web port"),
    no_open: bool = typer.Option(False, "--no-open", help="Do not automatically open browser"),
):
    """
    Supervise Industrial Domain Server sidecar and DeepSeek Harness Web UI (Ticket I001, Spec S13.1).
    """
    console.print(f"[bold green]Starting Industrial Domain Server on http://127.0.0.1:{port}...[/bold green]")
    import subprocess
    import sys

    domain_proc = subprocess.Popen(
        [sys.executable, "-m", "iad_domain_server.main", "--port", str(port)],
        cwd=os.getcwd(),
    )

    dsh_bin = os.path.join(os.getcwd(), "node_modules", ".bin", "dsh")
    dsh_cmd = [dsh_bin, "web", "--port", str(dsh_port)]
    if no_open:
        dsh_cmd.append("--no-open")

    console.print(f"[bold cyan]Starting DeepSeek Harness Web UI on http://127.0.0.1:{dsh_port}...[/bold cyan]")
    try:
        subprocess.run(dsh_cmd, cwd=os.getcwd())
    finally:
        domain_proc.terminate()
        domain_proc.wait()


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
