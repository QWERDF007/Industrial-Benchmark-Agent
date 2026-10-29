import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from importlib.metadata import version
from typing import Callable

from iad_core.consistency import annotations, geometry, comparison_domain, policy
from iad_core.consistency.annotations import AnnotationMatcher, AnnotationSet
from iad_core.consistency.comparison_domain import ComparisonDomain
from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.models import ConsistencyScopesSnapshot
from iad_core.consistency.evidence_models import (ConsistencyCompare, ConsistencyResult, EvidenceBundle,
    EvidenceSources, EvidenceSourceStates, FrozenEvidence)
from iad_core.consistency.repository import ConsistencyRepository
from iad_core.duplicate import pixels, verify, verification_models
from iad_core.duplicate.index import PixelIndex
from iad_core.duplicate.verify import PairVerifier
from iad_core.duplicate.verification_models import VerificationResult
from iad_core.evidence.consistency_sources import EvidenceSourcesCapture
from iad_core.evidence.current_sources import CurrentSource
from iad_core.evidence.retained import RetainedImages
from iad_core.evidence.consistency_media import ConsistencyMedia
from iad_core.evidence.consistency_export import ConsistencyExport
from iad_core.evidence import images, masks, consistency_media,consistency_sources,retained
from iad_core.consistency import evidence_models
from iad_core.storage.database import Database
from iad_core.storage.repositories import SampleRepository
from iad_core.storage.review_repository import ReviewRepository

ALGORITHM_FINGERPRINT=hashlib.sha256(Path(__file__).read_bytes()+b''.join(module.__name__.encode()+Path(module.__file__).read_bytes()
    for module in (annotations,geometry,comparison_domain,policy,pixels,verify,verification_models,images,masks,consistency_media,consistency_sources,retained,evidence_models))
    +json.dumps({package:version(package) for package in ('pillow','numpy','scipy','pydantic')},sort_keys=True).encode()).hexdigest()


class ConsistencyEvidence:
    def __init__(self, db: Database):
        self.db=db
        self.repository=ConsistencyRepository(db)
        self.images=RetainedImages(db)
        self.sources=EvidenceSourcesCapture(self.images)

    def compare(self, request: ConsistencyCompare, *, checkpoint: Callable[[],None] | None = None,
                frozen_scopes: ConsistencyScopesSnapshot | None = None) -> ConsistencyResult:
        request=ConsistencyCompare.model_validate(request)
        captured=[]
        with self.db.connection() as connection:
            connection.execute('BEGIN')
            expected=None
            if frozen_scopes is not None:
                from iad_core.consistency.scopes import ConsistencyScopes
                scopes=(frozen_scopes.subjects,frozen_scopes.corpus)
                for scope in scopes:ConsistencyScopes(self.db).assert_scans(scope,connection)
                expected={sample.sample_id:sample for scope in scopes for sample in scope.samples}
                identities={request.sample_a,request.sample_b}
                if not identities.issubset(expected):raise ConsistencyError('INVALID_SCOPE','Comparison is outside the frozen check and corpus scope')
                ConsistencyScopes(self.db).assert_samples([expected[identity] for identity in identities],connection)
            for identity in (request.sample_a,request.sample_b):
                sample=SampleRepository(self.db).get(identity,connection=connection)
                if sample is None:raise ConsistencyError('REFERENCE_NOT_FOUND','Comparison sample does not exist')
                if sample.is_excluded:raise ConsistencyError('INVALID_SCOPE','Excluded samples cannot be compared')
                captured.append((sample,AnnotationSet.capture(self.db,identity,connection),
                    ReviewRepository(self.db).get_decision(identity,connection=connection),PixelIndex(self.db).get(identity,connection=connection)))
        frozen=[]
        for source in captured:
            if checkpoint:checkpoint()
            frozen.append(self.sources.freeze(*source))
        (left,a),(right,b)=frozen
        bound=[self.sources.annotations(source) for source in (left,right)]
        raw=PairVerifier(request.near).verify_pixels(a,b)
        comparison=VerificationResult.model_validate({**raw.model_dump(),'local':ComparisonDomain.pixel_statistics(bound,a,b)})
        annotation=AnnotationMatcher(request.matching).compare(*bound,relation=comparison.relation)
        sources=EvidenceSources(left=left,right=right)
        facts={'sources':sources.model_dump(mode='json'),'comparison':comparison.model_dump(mode='json'),
            'annotation':annotation.model_dump(mode='json'),'parameters':request.model_dump(mode='json'),'algorithm':ALGORITHM_FINGERPRINT}
        digest=hashlib.sha256(json.dumps(facts,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
        result=ConsistencyResult(result_id='result_'+digest,evidence_id='evidence_'+digest,verification=comparison,annotation=annotation)
        media=ConsistencyMedia.describe(sources,annotation)
        if checkpoint:checkpoint()
        saved=self.repository.save(FrozenEvidence(result=result,sources=sources,parameters=request,
            algorithm_fingerprint=ALGORITHM_FINGERPRINT,checked_at=datetime.now(timezone.utc),media=media))
        return saved.result

    def get(self, evidence_id: str) -> EvidenceBundle:
        saved=self.repository.get(evidence_id)
        states={}
        for side in ('left','right'):
            frozen=getattr(saved.sources,side)
            self.images.path(frozen.image)
            for blob in frozen.masks.values():self.images.path(blob)
            with self.db.connection() as connection:
                connection.execute('BEGIN')
                current=CurrentSource.capture(self.db,frozen.sample.sample_id,connection)
            states[side]=current.state(frozen)
        return EvidenceBundle(**saved.model_dump(),source_states=EvidenceSourceStates(**states))

    def media(self, evidence_id: str, media_id: str, *, max_side: int | None = None) -> dict:
        bundle=self.repository.get(evidence_id)
        descriptor=next((value for value in bundle.media if value.media_id==media_id),None)
        if descriptor is None:raise ConsistencyError('REFERENCE_NOT_FOUND','Evidence media does not exist')
        return ConsistencyMedia(self.db).render(bundle,descriptor,max_side=max_side)

    def export(self, evidence_id: str):
        return ConsistencyExport(self.db).create(self.get(evidence_id))
