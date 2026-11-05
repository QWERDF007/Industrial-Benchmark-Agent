from iad_core.knowledge.instructions import FrozenMiningPrompt, MiningPhase
from typing import List, Literal

from pydantic import Field, create_model, model_validator, ValidationError
from pydantic_core import InitErrorDetails

from iad_core.advisory.analysis import AnalysisModel
from iad_core.advisory.output_validation import repairable_output_error
from iad_core.knowledge.models import DiscoveryArea, DiscoveryStatus, KnowledgeDraft, KnowledgeLearning
from iad_core.workbench.jobs import JobContext
from iad_core.workbench.vision import VlmClient



class DiscoveryLinks(AnalysisModel):
    status: DiscoveryStatus = Field(description=DiscoveryArea.model_fields['status'].description)
    subjects: List[str]
    check_titles: List[str]


class KnowledgeDiscoveryLinker:
    def __init__(self, client: VlmClient, context: JobContext):
        self.client, self.context = client, context

    def link(self, learning: KnowledgeLearning, model_name: str) -> KnowledgeDraft:
        result = learning.model_dump(mode='json')
        discovery = learning.discovery
        if discovery and discovery.areas:
            parts = tuple(part.name for part in discovery.parts)
            checks = tuple(check.title for check in learning.checks)
            links = create_model('DiscoveryLinks', __base__=DiscoveryLinks,
                subjects=(List[Literal[parts]] if parts else List[str], Field(**({} if parts else {'max_length': 0}))),
                check_titles=(List[Literal[checks]] if checks else List[str], Field(**({} if checks else {'max_length': 0}))))
            def validate_associations(value):
                problems: list[InitErrorDetails] = []
                for index, area in enumerate(discovery.areas):
                    try:
                        DiscoveryArea.model_validate(dict(area.model_dump(), **getattr(value,f'area_{index}').model_dump()))
                    except ValidationError as error:
                        for issue in error.errors(include_input=False):
                            problems.append(InitErrorDetails(type=repairable_output_error('invalid_discovery_links',issue['msg']),
                                loc=(f'area_{index}',*issue['loc']), input=getattr(value,f'area_{index}').model_dump()))
                if problems:
                    raise ValidationError.from_exception_data('KnowledgeDiscoveryLinks',problems)
                return value

            response = create_model('KnowledgeDiscoveryLinks', __base__=AnalysisModel,
                __validators__={'valid_associations':model_validator(mode='after')(validate_associations)},
                **{f'area_{index}': (links, ...) for index in range(len(discovery.areas))})
            self.context.checkpoint()
            self.context.update(phase='LINKING_KNOWLEDGE_DISCOVERY')
            prompt = FrozenMiningPrompt.model_validate(self.context.payload['mining_prompt']).render_context('冻结视觉提取',result,phase=MiningPhase.LINK)
            plan = self.client.plan(response, prompt, [], model_name)
            self.context.checkpoint()
            linked = self.client.generate(plan).model_dump(mode='json')
            self.context.checkpoint()
            for index, area in enumerate(result['discovery']['areas']):
                area.update(linked[f'area_{index}'])
        return KnowledgeDraft.model_validate(result)
