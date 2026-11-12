import json
import re

from iad_core.analysis.models import AnalysisCatalog, AnalysisDirection, AnalysisKnowledgeCheck
from iad_core.knowledge.models import KnowledgeEvidence
from iad_core.knowledge.support import KnowledgeSupport
from iad_core.analysis.arguments import AnalysisArguments
from iad_core.analysis.catalog_review import AnalysisCatalogReview


class AnalysisCatalogs:
    """Apply edits and explicit citation corrections, preserving merge provenance."""

    def apply(self, snapshot, catalog, submission, media, observed, *, connection, run_id, revision):
        exploration = snapshot.module == 'exploration'
        field, identity = ('directions', 'direction_id') if exploration else ('checks', 'check_id')
        support = 'evidence_ids' if exploration else 'support_evidence_ids'
        predecessor = 'predecessor_direction_ids' if exploration else 'predecessor_check_ids'
        entries = {getattr(item, identity): item.model_dump() for item in getattr(catalog, field)}
        edits = getattr(submission, field)
        on_demand = snapshot.context_policy == 'evidence-on-demand-v1'
        issues = AnalysisCatalogReview.prose(submission, allow_image_references=not on_demand)
        for item in edits:
            issues.extend(AnalysisCatalogReview.prose(item, allow_image_references=not on_demand))
        if issues:
            raise ValueError('目录草稿未保存：' + '；'.join(dict.fromkeys(issues)))
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
            evidence_ids = getattr(item, support, []) + getattr(item, 'counter_evidence_ids', [])
            if set(evidence_ids) - observed:
                raise ValueError('目录引用尚未提交观察的本场证据')
            if not on_demand and not evidence_ids:
                raise ValueError('目录条目需要本场已提交的观察证据')
            entry_id = getattr(item, identity)
            previous = entries.get(entry_id, {})
            updated = {support: [], 'counter_evidence_ids': [], **previous, **item.model_dump()}
            if 'key_evidence' not in item.model_fields_set:
                updated['key_evidence'] = previous.get('key_evidence')
            updated['change_reason'] = item.change_reason
            if not exploration:
                updated['suggested_status'] = item.status
            for name in [support, 'counter_evidence_ids']:
                updated[name] = list(dict.fromkeys([*previous.get(name, []), *updated[name]]))
            entries[entry_id] = updated
        merged_entries = {}
        for merge in submission.merges:
            if merge.target_id not in entries or merge.target_id in merge.source_ids or set(merge.source_ids) - entries.keys():
                raise ValueError('合并须引用本场存在且互不相同的目录条目')
            target = entries[merge.target_id]
            target['change_reason'] = merge.reason
            for source_id in dict.fromkeys(merge.source_ids):
                source = entries.pop(source_id)
                merged_entries[source_id] = source
                fields = [support, 'counter_evidence_ids', 'dataset_ids', 'limitations', predecessor]
                if not exploration:
                    fields.extend(['direction_refs', 'allowed_variations'])
                for name in fields:
                    target[name] = list(dict.fromkeys([*target.get(name, []), *source.get(name, [])]))
                target[predecessor] = list(dict.fromkeys([*target.get(predecessor, []), source_id]))
        corrections = submission.citation_corrections
        if on_demand:
            if len({item.entry_id for item in submission.selections}) != len(submission.selections):
                raise ValueError('同次提交的精选条目不能重复')
            for selection in submission.selections:
                if selection.entry_id not in entries:
                    raise ValueError('精选条目不属于当前目录')
                entries[selection.entry_id]['key_evidence'] = [item.model_dump() for item in selection.key_evidence]
        if len({(item.entry_id, item.evidence_id) for item in corrections}) != len(corrections):
            raise ValueError('同次提交的引用纠正不能重复')
        for correction in corrections:
            if correction.entry_id not in entries:
                raise ValueError('引用纠正的目录条目不存在')
            if correction.evidence_id not in owners or correction.whole_image_id not in observed:
                raise ValueError('引用纠正需要本场已观察的图像证据')
            source, _ = owners[correction.evidence_id]
            whole_source, whole = owners[correction.whole_image_id]
            if source.sample_id != whole_source.sample_id or not whole.image.is_whole_image:
                raise ValueError('引用纠正必须使用同一登记的完整原图')
            entry = json.dumps(entries[correction.entry_id], ensure_ascii=False)
            updated, count = re.subn(r'\b'+re.escape(correction.evidence_id)+r'\b', correction.whole_image_id, entry)
            if not count:
                raise ValueError('引用纠正的旧证据不在该条目中')
            corrected = json.loads(updated)
            for name in [support, 'counter_evidence_ids']:
                corrected[name] = list(dict.fromkeys(corrected[name]))
            entries[correction.entry_id] = corrected
        invalid_citations: list[dict[str, str]] = []
        for item in entries.values():
            citations = {support:item[support], 'counter_evidence_ids':item['counter_evidence_ids'],
                '正文':re.findall(r'\bimg_[a-f0-9]{64}\b', json.dumps(
                    {name:value for name,value in item.items() if name not in {support,'counter_evidence_ids','key_evidence'}}, ensure_ascii=False))}
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
            raise ValueError('目录引用了非完整原图。请用citation_corrections按entry_id、evidence_id、whole_image_id显式纠正，未修改的directions/checks传[]；新条目仍需完整提交，已保存条目无需重写；'
                'observations可保留局部观察。'+json.dumps(dict(invalid_citations=invalid_citations),ensure_ascii=False,separators=(',',':')))
        AnalysisArguments().apply(connection, run_id, revision, {**merged_entries, **entries}, submission, snapshot, media)
        if on_demand and any(not item[support] and not item['counter_evidence_ids'] for item in entries.values()):
            raise ValueError('目录条目需要本场有效的支持或反例论据')
        result = AnalysisCatalog(summary=submission.summary, limitations=submission.limitations,
            unresolved_questions=submission.unresolved_questions)
        if exploration:
            result.directions = [AnalysisDirection.model_validate(item) for item in entries.values()]
        else:
            records = {record.sample.sample_id: record for record in snapshot.manifest.records}
            groups = {source.sample_id: source.pixel_sha256 for source in media.values() if source.pixel_sha256 and not source.error
                and not records[source.sample_id].sample.is_excluded and records[source.sample_id].sample.data_origin != 'AUGMENTED'}
            evidence = [KnowledgeEvidence(sample_id=source.sample_id,image=image.image) for source,image in owners.values()]
            for item in entries.values():
                assessment = KnowledgeSupport.assess(item['support_evidence_ids'],item['counter_evidence_ids'],
                    item.get('suggested_status') or item['status'],evidence,groups,snapshot.support_policy)
                result.checks.append(AnalysisKnowledgeCheck(**{**item,**assessment.model_dump()}))
        return result
