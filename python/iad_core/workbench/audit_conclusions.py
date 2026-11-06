from dataclasses import dataclass
import hashlib
import json
from typing import Any, Callable

from iad_core.advisory.analysis import AuditConclusion
from iad_core.evidence.images import PreparedImage
from iad_core.workbench.joint import OUTPUT_RESERVE_TOKENS
from iad_core.workbench.vision import ModelCapacityError, VlmClient
from iad_core.workbench.audit_contract import AuditConclusionContract
from iad_core.workbench.jobs import JobContext


@dataclass(frozen=True)
class AuditConclusionInput:
    instruction: str
    facts: dict[str, Any]
    images: list[PreparedImage]
    check_ids: frozenset[str]
    model_name: str


@dataclass(frozen=True)
class ConclusionNode:
    result: AuditConclusion
    comparison_ids: tuple[str, ...]
    representative: PreparedImage


class AuditConclusions:
    """Capacity-bound visual comparison followed by model synthesis of saved conclusions."""

    def __init__(self, client: VlmClient):
        self.client = client

    def conclude(self, source: AuditConclusionInput, context: JobContext,
                 progress: Callable[[int, int], None]) -> AuditConclusion:
        cancel = context.cancel
        owners = source.facts['image_owners']
        record = source.facts['consistency']['record']
        reference_groups = {}
        for reference in record['references']:
            reference_groups.setdefault(reference['sample_id'], []).append(reference)
        pending = [list(reference_groups)]
        base_owners = {record['sample_id']}
        for check in source.facts['knowledge']['checks']:
            base_owners.update(owners[eid] for eid in [*check['support_evidence_ids'], *check['counter_evidence_ids']])
        nodes = []
        completed, total = 0, 1
        while pending:
            if cancel.is_set():
                raise InterruptedError('Audit cancelled')
            selected = pending.pop(0)
            references = [ref for sid in selected for ref in reference_groups[sid]]
            ids = {ref['result_id'] for ref in references}
            images = [image for image in source.images if owners[image.evidence.evidence_id] in base_owners | set(selected)]
            facts = self._facts(source, references, images, ids)
            progress(completed, total)
            try:
                plan = self._plan(source, facts, images, context,
                    [image.evidence.evidence_id for image in images if image.evidence.representation == 'raw'], ids)
            except ModelCapacityError:
                if len(selected) < 2:
                    raise
                middle = len(selected) // 2
                pending[:0] = [selected[:middle], selected[middle:]]
                total += 1
                continue
            if cancel.is_set():
                raise InterruptedError('Audit cancelled')
            result = self.client.generate(plan)
            representative = next((image for image in images if image.evidence.representation == 'raw'
                and owners[image.evidence.evidence_id] in selected), images[0])
            nodes.append(ConclusionNode(result, tuple(ref['result_id'] for ref in references), representative))
            completed += 1
            progress(completed, total)
        base_images = [image for image in source.images if owners[image.evidence.evidence_id] in base_owners]
        while len(nodes) > 1:
            pending_nodes = [nodes[start:start+8] for start in range(0, len(nodes), 8)]
            total += sum(len(items) > 1 for items in pending_nodes)
            reduced = []
            while pending_nodes:
                if cancel.is_set():
                    raise InterruptedError('Audit cancelled')
                selected = pending_nodes.pop(0)
                if len(selected) == 1:
                    reduced.extend(selected)
                    continue
                images = list({image.evidence.evidence_id: image for image in
                    [*base_images, *[node.representative for node in selected]]}.values())
                ids = {identity for node in selected for identity in node.comparison_ids}
                references = [ref for ref in record['references'] if ref['result_id'] in ids]
                facts = self._facts(source, references, images, ids)
                facts['consistency']['results'] = []
                facts['partial_conclusions'] = [dict(input_result_ids=list(node.comparison_ids),
                    conclusion=node.result.model_dump(mode='json')) for node in selected]
                raw = {image.evidence.evidence_id for image in images if image.evidence.representation == 'raw'}
                result_ids = set()
                for node in selected:
                    raw.update(node.result.evidence_ids)
                    raw.update(eid for basis in node.result.basis for eid in basis.evidence_ids)
                    raw.update(eid for item in node.result.proposed_slice for eid in item.evidence_ids)
                    result_ids.update(rid for basis in node.result.basis for rid in basis.consistency_result_ids)
                facts['image_owners'].update({eid:source.facts['image_owners'][eid] for eid in raw})
                progress(completed, total)
                try:
                    plan = self._plan(source, facts, images, context, raw, result_ids)
                except ModelCapacityError:
                    if len(selected) < 3:
                        raise
                    middle = len(selected) // 2
                    pending_nodes[:0] = [selected[:middle], selected[middle:]]
                    total += int(middle > 1) + int(len(selected)-middle > 1) - 1
                    continue
                if cancel.is_set():
                    raise InterruptedError('Audit cancelled')
                result = self.client.generate(plan)
                reduced.append(ConclusionNode(result, tuple(dict.fromkeys(identity for node in selected
                    for identity in node.comparison_ids)), selected[0].representative))
                completed += 1
                progress(completed, total)
            if len(reduced) >= len(nodes):
                raise ModelCapacityError('模型容量不足以汇总两个完整审计批次，未发布不完整结论')
            nodes = reduced
        if cancel.is_set():
            raise InterruptedError('Audit cancelled')
        return nodes[0].result

    @staticmethod
    def _facts(source, references, images, ids):
        target = source.facts['audit_target']['sample_id']
        samples = {source.facts['image_owners'][image.evidence.evidence_id] for image in images}
        return {**source.facts,
            'input_scope':dict(reference_sample_ids=sorted(samples-{target}), visual_source_count=len(samples)),
            'consistency': dict(source.facts['consistency'], record={**source.facts['consistency']['record'], 'references':references},
                results=[item for item in source.facts['consistency']['results'] if item['result_id'] in ids]),
            'image_owners':{image.evidence.evidence_id:source.facts['image_owners'][image.evidence.evidence_id] for image in images},
            'comparison_coverage':dict(total_results=len(source.facts['consistency']['results']), input_result_ids=sorted(ids))}

    def _plan(self, source, facts, images, context, raw_ids, result_ids):
        contract = AuditConclusionContract(facts, images, tuple(sorted(raw_ids)), tuple(sorted(result_ids)), tuple(sorted(source.check_ids)))
        fingerprint = hashlib.sha256(json.dumps(dict(facts=facts, references=contract.vocabulary.references),
            sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        prompt = source.instruction+'\n冻结综合审计：'+json.dumps(dict(contract.vocabulary.encode(facts),
            reference_binding=fingerprint), ensure_ascii=False)
        plan = self.client.plan(contract.response_type, prompt, contract.vocabulary.images, source.model_name, OUTPUT_RESERVE_TOKENS)
        contract.vocabulary.record(context, fingerprint)
        return plan
