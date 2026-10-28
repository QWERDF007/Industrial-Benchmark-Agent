from dataclasses import dataclass
from typing import Callable

from iad_core.consistency.annotations import AnnotationMatcher, AnnotationSet
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.decoding import DecodeGroup, DecodeSource, ImageDecoding, UnavailableImage
from iad_core.feature.profiles import ImageResources
from iad_core.consistency.models import CoverageCount, FrozenScope, PixelComparison
from iad_core.consistency.retrieval_models import RetrievalGroup, RetrievalMember, RetrievalOrigin
from iad_core.consistency.retrieval_sources import SourceImage
from iad_core.consistency.scopes import ConsistencyScopes
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.database import Database
from iad_core.duplicate.index import PixelIndexEntry
from iad_core.duplicate.pixels import PixelContent
from iad_core.duplicate.verify import PairVerifier
from iad_core.duplicate.verification_models import NearVerification
from iad_core.consistency.comparison_domain import ComparisonDomain


@dataclass
class VerifiedCandidates:
    groups: dict[str, RetrievalGroup]
    verification: CoverageCount
    annotation: CoverageCount


class RetrievalVerifier:
    def __init__(self, db: Database):
        self.db = db

    def verify(self, scope: FrozenScope, pixels: PixelContent, query_id: str | None,
               candidates: dict[str, list[PixelIndexEntry]], origins: dict[str, list[RetrievalOrigin]],
               *, checkpoint: Callable[[],None] | None = None, resources: ImageResources | None = None) -> VerifiedCandidates:
        samples, annotations = {}, {}
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            if ConsistencyScopes(self.db).resolve(scope.selector, connection).scope_id != scope.scope_id:
                raise ConsistencyError('SOURCE_UNAVAILABLE', 'Corpus changed during retrieval')
            query_annotation = AnnotationSet.capture(self.db, query_id, connection) if query_id else None
            for entries in candidates.values():
                for entry in entries:
                    samples[entry.sample_id] = SampleRepository(self.db).get(entry.sample_id, connection=connection)
                    annotations[entry.sample_id] = AnnotationSet.capture(self.db, entry.sample_id, connection)
        groups = {}
        matcher = AnnotationMatcher()
        verifier=PairVerifier()
        resources = resources or ImageResources()
        requests = [DecodeGroup(identity,tuple(DecodeSource(samples[entry.sample_id].image_path,entry) for entry in entries))
            for identity,entries in candidates.items()]
        with ImageDecoding(resources.decode_workers,resources.decode_memory_mb*1024**2) as decoder:
            for batch in decoder.partition(requests,max(1,len(requests))):
                decoded = decoder.load(batch,checkpoint)
                for content in decoded:
                    identity = content.group_id
                    entries = candidates[identity]
                    comparison = None
                    other_pixels=None
                    members = []
                    for entry in entries:
                        if checkpoint:checkpoint()
                        sample = samples[entry.sample_id]
                        annotation = None
                        near=local=registration=None
                        error_code = reason = None
                        try:
                            if isinstance(content,UnavailableImage):
                                raise content.error
                            other = content.image if entry.sample_id==content.source.published.sample_id else SourceImage.read(sample.image_path, entry)
                            if checkpoint:checkpoint()
                            if comparison is None:
                                other_pixels=content.pixels
                                comparison=verifier.verify_pixels(pixels,other_pixels)
                            checked=comparison.pixel
                            relation=comparison.relation
                            if relation!='EXACT':
                                near=NearVerification.model_validate(comparison.model_dump(include=set(NearVerification.model_fields)))
                                registration=comparison.registration
                            if query_annotation is not None:
                                local=ComparisonDomain.pixel_statistics([query_annotation,annotations[entry.sample_id]],pixels,other_pixels)
                            if checked.exact_equal is None:
                                reason=checked.reason
                                error_code=('RESOURCE_LIMIT' if (reason or '').startswith('RESOURCE_LIMIT:')
                                    else 'UNSUPPORTED_IMAGE' if checked.status=='UNSUPPORTED' else 'SOURCE_UNAVAILABLE')
                            if relation == 'EXACT' and query_annotation is not None:
                                annotation = matcher.compare(query_annotation, annotations[entry.sample_id], relation=relation)
                        except ConsistencyError as error:
                            error_code, reason = error.code, str(error)
                            checked = PixelComparison(status='UNSUPPORTED' if error.code in ('RESOURCE_LIMIT','UNSUPPORTED_IMAGE') else 'UNAVAILABLE', reason=reason)
                            relation = 'UNCHECKED'
                        members.append(RetrievalMember(sample_id=sample.sample_id, dataset_id=sample.dataset_id,
                            quality_status=sample.quality_status, relation=relation, pixel=checked,
                            near=near,local=local,registration=registration,
                            annotation=annotation, error_code=error_code, reason=reason))
                    groups[identity] = RetrievalGroup(content_group_id=identity, origins=origins[identity], member_count=len(members),
                        conflict_count=sum(bool(member.annotation and member.annotation.confirmed_conflict) for member in members), members=members)
                decoded.clear()
                if batch:
                    del content
        members = [member for group in groups.values() for member in group.members]
        verification = CoverageCount(total=len(members), completed=sum(member.pixel.exact_equal is not None for member in members),
            failed=sum(member.pixel.status == 'UNAVAILABLE' for member in members),
            unsupported=sum(member.pixel.status == 'UNSUPPORTED' for member in members),
            pending=sum(member.pixel.exact_equal is None and member.pixel.status not in ('UNAVAILABLE', 'UNSUPPORTED') for member in members))
        completed = sum(member.annotation is not None and member.annotation.status == 'COMPLETE' for member in members)
        failed = sum(member.annotation is not None and member.annotation.status != 'COMPLETE' for member in members)
        annotation = CoverageCount(total=len(members), completed=completed, failed=failed, pending=len(members) - completed - failed)
        return VerifiedCandidates(groups, verification, annotation)
