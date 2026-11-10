from iad_core.workbench.job_models import JobPhaseTiming


class JobPhaseClock:
    """Persist phase intervals alongside the job's progress transaction."""

    @staticmethod
    def enter(payload: dict, phase: str, at: str, *, resume: bool = False) -> None:
        timings = payload.setdefault('phase_timings', [])
        if not resume:
            if timings and timings[-1]['phase'] == phase and timings[-1]['finished_at'] is None:
                return
            JobPhaseClock.close(payload, at)
        timings.append(JobPhaseTiming(phase=phase, started_at=at).model_dump())
        payload.update(phase=phase, phase_started_at=at)

    @staticmethod
    def close(payload: dict, at: str) -> bool:
        timings = payload.get('phase_timings', [])
        if timings and timings[-1]['finished_at'] is None:
            timings[-1]['finished_at'] = at
            return True
        return False
