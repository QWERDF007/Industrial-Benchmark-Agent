from iad_core.advisory.analysis import AnalysisModel, NonBlankText


class ImageSessionLocation(AnalysisModel):
    job_id: NonBlankText
    submitted_at: str
    image_name: str
    image_id: str
