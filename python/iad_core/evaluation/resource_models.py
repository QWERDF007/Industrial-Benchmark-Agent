from typing import Literal

from pydantic import JsonValue, StrictBool, model_validator

from iad_core.advisory.analysis import AnalysisModel
from iad_core.consistency.models import Identifier


class AcceptanceChecks(AnalysisModel):
    @property
    def passed(self) -> bool:
        return all(getattr(self, name) for name in type(self).model_fields)


class ResourceChecks(AcceptanceChecks):
    real_encoder: StrictBool
    five_thousand_2048: StrictBool
    fp32_768: StrictBool
    one_hundred_distinct_vector_queries: StrictBool
    vector_p95: StrictBool
    twenty_originals_p95: StrictBool
    additional_rss: StrictBool
    stress_4096: StrictBool
    two_default_decode_workers: StrictBool
    repeat_encoding_zero: StrictBool


class IncrementalChecks(AcceptanceChecks):
    one_hundred_new_contents: StrictBool
    old_vectors_not_reencoded: StrictBool
    annotation_only_zero_encoding: StrictBool
    same_model_reused_across_resource_changes: StrictBool
    real_cancel_observed: StrictBool


class ResourceAcceptance(AnalysisModel):
    profile_id: Identifier
    preparation: dict[str, JsonValue]
    throughput: dict[str, JsonValue]
    preparation_resources: dict[str, JsonValue]
    verification_resources: dict[str, JsonValue]
    measured_gates: ResourceChecks
    incremental_status: Literal['MEASURED', 'UNVERIFIED']
    incremental_gates: IncrementalChecks | None
    resource_acceptance_passed: StrictBool
    publication_ready: Literal[False]

    @model_validator(mode='after')
    def truthful_acceptance(self):
        if (self.incremental_gates is not None) != (self.incremental_status == 'MEASURED'):
            raise ValueError('Incremental status must agree with its measured checks')
        passed = self.measured_gates.passed and self.incremental_gates is not None and self.incremental_gates.passed
        if passed != self.resource_acceptance_passed:
            raise ValueError('Resource acceptance must agree with every measured and incremental check')
        return self
