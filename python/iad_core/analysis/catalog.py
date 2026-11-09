import json
import re

from iad_core.analysis.models import AnalysisCatalog, AnalysisDirection, AnalysisKnowledgeCheck
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.knowledge.support import KnowledgeSupport


class AnalysisCatalogs:
    """Apply module-specific edits and preserve explicit merge provenance."""

    def apply(self, snapshot, catalog, submission, media, observed):
        exploration = snapshot.module == 'exploration'
        field, identity = ('directions', 'direction_id') if exploration else ('checks', 'check_id')
        support = 'evidence_ids' if exploration else 'support_evidence_ids'
        predecessor = 'predecessor_direction_ids' if exploration else 'predecessor_check_ids'
        entries = {getattr(item, identity): item.model_dump() for item in getattr(catalog, field)}
        edits = getattr(submission, field)
        if len({getattr(item, identity) for item in edits}) != len(edits):
            raise ValueError('同次提交的目录条目ID不能重复')
        scope = set(snapshot.manifest.dataset_ids)
        refs = {direction.ref for direction in snapshot.selected_directions}
        owners = {image.image.evidence_id: (source, image) for source in media.values() for image in source.images}
        for item in edits:
            if not set(item.dataset_ids).issubset(scope):
                raise ValueError('目录适用范围超出本场登记清单')
            if not exploration and not set(item.direction_refs).issubset(refs):
                raise ValueError('知识关联了本场未选择的方向')
            if set(getattr(item, support) + item.counter_evidence_ids) - observed:
                raise ValueError('目录引用尚未提交观察的本场证据')
            if not getattr(item, support) and not item.counter_evidence_ids:
                raise ValueError('目录条目需要本场已提交的观察证据')
            entry_id = getattr(item, identity)
            previous = entries.get(entry_id, {})
            updated = {**previous, **item.model_dump()}
            updated[support] = list(dict.fromkeys(updated[support]))
            counter_sources = {owners[eid][0].sample_id for eid in updated['counter_evidence_ids']}
            retained_counters = [eid for eid in previous.get('counter_evidence_ids', [])
                if owners[eid][0].sample_id not in counter_sources]
            updated['counter_evidence_ids'] = list(dict.fromkeys([*retained_counters, *updated['counter_evidence_ids']]))
            entries[entry_id] = updated
        for merge in submission.merges:
            if merge.target_id not in entries or merge.target_id in merge.source_ids or set(merge.source_ids) - entries.keys():
                raise ValueError('合并须引用本场存在且互不相同的目录条目')
            target = entries[merge.target_id]
            for source_id in dict.fromkeys(merge.source_ids):
                source = entries.pop(source_id)
                fields = [support, 'counter_evidence_ids', 'dataset_ids', 'limitations', predecessor]
                if not exploration:
                    fields.append('direction_refs')
                for name in fields:
                    target[name] = list(dict.fromkeys([*target.get(name, []), *source.get(name, [])]))
                target[predecessor] = list(dict.fromkeys([*target.get(predecessor, []), source_id]))
        invalid_citations: list[dict[str, str]] = []
        for item in entries.values():
            citations = {support:item[support], 'counter_evidence_ids':item['counter_evidence_ids'],
                '正文':re.findall(r'\bimg_[a-f0-9]{64}\b', json.dumps(
                    {name:value for name,value in item.items() if name not in {support,'counter_evidence_ids'}}, ensure_ascii=False))}
            for name, evidence_ids in citations.items():
                for evidence_id in dict.fromkeys(evidence_ids):
                    if evidence_id not in observed:
                        raise ValueError('目录引用尚未提交观察的本场证据')
                    source, media_item = owners[evidence_id]
                    if not media_item.image.is_whole_image:
                        whole = next(image.image.evidence_id for image in source.images if image.image.is_whole_image)
                        invalid_citations.append(dict(entry_id=item[identity], field=name,
                            evidence_id=evidence_id, whole_image_id=whole))
        if invalid_citations:
            raise ValueError('目录引用了非完整原图。请按映射一次纠正全部支持、反例和正文引用，重新输出完整条目；'
                'observations可保留局部观察。'+json.dumps(dict(invalid_citations=invalid_citations),ensure_ascii=False,separators=(',',':')))
        result = AnalysisCatalog(summary=submission.summary, limitations=submission.limitations,
            unresolved_questions=submission.unresolved_questions)
        if exploration:
            result.directions = [AnalysisDirection.model_validate(item) for item in entries.values()]
        else:
            records = {record.sample.sample_id: record for record in snapshot.manifest.records}
            groups = {source.sample_id: source.pixel_sha256 for source in media.values() if source.pixel_sha256 and not source.error
                and not records[source.sample_id].sample.is_excluded and records[source.sample_id].sample.data_origin != 'AUGMENTED'}
            for item in entries.values():
                supports = {groups[source.sample_id] for eid in item['support_evidence_ids']
                    for source, image in [owners[eid]] if image.image.representation == 'raw'
                    and source.sample_id in groups}
                result.checks.append(AnalysisKnowledgeCheck(**{**item, 'independent_source_count': len(supports)}))
            KnowledgeSupport.assess(result.checks, [KnowledgeEvidence(sample_id=source.sample_id, image=image.image)
                for source, image in owners.values()], groups, snapshot.support_policy)
        return result
