from iad_core.advisory.analysis import AnalysisModel, NonBlankText


class AnalysisRolePrompts(AnalysisModel):
    system_prompt: NonBlankText | None
    user_prompt: NonBlankText


class FrozenAnalysisTasks(AnalysisModel):
    initial: NonBlankText
    observe: NonBlankText
    review: NonBlankText
    finalize: NonBlankText
    versions: dict[str, str]
