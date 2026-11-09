from pathlib import Path
from uuid import uuid4

import pytest

from iad_core.analysis.commits import AnalysisCommits
from iad_core.analysis.coverage import AnalysisCoverageReader
from iad_core.analysis.evidence import AnalysisEvidence
from iad_core.analysis.publications import AnalysisPublications
from iad_core.analysis.queries import AnalysisQueries
from iad_core.analysis.models import AnalysisObservationQuery
from iad_core.workbench.calls import ModelCalls, NativeModelCallEnd, NativeModelCallStart


@pytest.fixture
def observed_round(agent_jobs):
    jobs, dataset_id, role = agent_jobs
    started = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt={'text': '逐轮观察并重读已有证据。'}), agent=role)
    run_id = started['run_id']
    evidence = AnalysisEvidence(jobs)

    def observe(*, crop=False):
        context = jobs.context(run_id)
        media = evidence.read(run_id, {'sample_id': context.round.targets[0].sample_id})
        images = list(media.images)
        if crop:
            images.extend(evidence.crop(run_id, {'sample_id': media.sample_id, 'bbox': [1, 2, 7, 9]}).images)
        ids = [item.image.evidence_id for item in images]
        call = NativeModelCallStart(call_id='call_' + uuid4().hex, started_at='2026-11-09T12:00:00Z', request={'fixture': 'prepared media'})
        ModelCalls(jobs.db).start_native(run_id, call, sample_id=None, session_id=context.session_id, attempt=1)
        evidence.delivered(run_id, call.call_id, ids)
        ModelCalls(jobs.db).finish_native(run_id, None, NativeModelCallEnd(call_id=call.call_id,
            finished_at='2026-11-09T12:00:01Z', elapsed_ms=1000, finish_reason='tool-calls'))
        AnalysisCommits(jobs).accept(run_id, dict(commit_key='complete', base_revision=context.revision,
            round_id=context.round.round_id, observations=[dict(dataset_id=dataset_id, sample_id=media.sample_id,
                description=f'第{context.round.round_id}轮原图及局部观察。', evidence_ids=ids)],
            directions=[], summary='整个作业的已保存观察。', limitations=[], unresolved_questions=[]))
        return images

    return jobs, run_id, observe


def test_previous_round_pixels_reopen_by_evidence_id_without_changing_coverage(observed_round, agent_jobs):
    jobs, run_id, observe = observed_round
    first = observe(crop=True)
    assert jobs.context(run_id).round.round_id == 2
    before = AnalysisCoverageReader(jobs.db).read(run_id)
    evidence = AnalysisEvidence(jobs)
    saved_pixels = {item.image.evidence_id: Path(item.path).read_bytes() for item in first}
    source = next(record.sample.image_path for record in jobs.snapshot(run_id).manifest.records
        if record.sample.sample_id == first[0].sample_id)
    Path(source).unlink()
    for image in (first[0], first[-1]):
        page = evidence.reference(run_id, {'evidence_id': image.image.evidence_id})
        assert page.total == 1
        assert page.images == [image]
        assert Path(page.images[0].path).read_bytes() == saved_pixels[image.image.evidence_id]
    assert first[-1].image.sent_size == [6, 7]
    assert AnalysisCoverageReader(jobs.db).read(run_id) == before
    dataset_id, role = agent_jobs[1:]
    jobs.cancel(run_id)
    other = jobs.start(dict(submission_id=str(uuid4()), analysis_kind='exploration', dataset_ids=[dataset_id],
        normal_images=[dataset_id + ':normal.png'], prompt={'text': '独立新作业。'}), agent=role)['run_id']
    with pytest.raises(LookupError, match='本场'):
        evidence.reference(other, {'evidence_id': first[0].image.evidence_id})
    with pytest.raises(LookupError, match='本场'):
        evidence.reference(run_id, {'evidence_id': 'missing'})


def test_observation_history_is_paged_and_fixed_publications_keep_their_revision(observed_round):
    jobs, run_id, observe = observed_round
    first = observe(crop=True)
    queries = AnalysisQueries(jobs.db)
    history = queries.observation_history(run_id, {'page_size': 1})
    assert (history.job_id, history.revision, history.total) == (run_id, 1, 1)
    assert history.items[0].round_id == 1
    assert history.items[0].evidence_ids == [item.image.evidence_id for item in first]
    jobs.cancel(run_id)
    publication = AnalysisPublications(jobs.db).publish(run_id)
    jobs.resume(run_id)
    second = observe()
    history = queries.observation_history(run_id, {'page': 2, 'page_size': 1})
    assert (history.revision, history.total, len(history.items)) == (2, 2, 1)
    assert history.items[0].sample_id == second[0].sample_id
    assert history.items[0].round_id == 2
    assert queries.observation_history(run_id, {'round_id': 1}).items[0].sample_id == first[0].sample_id
    assert queries.observation_history(run_id, {'sample_id': first[0].sample_id}).total == 1
    assert queries.observation_history(run_id, {'direction_ref': 'D1'}).total == 0
    assert queries.observation_history(run_id, {'page': 3, 'page_size': 1}).items == []
    frozen = queries.observations(publication.version_id, AnalysisObservationQuery(page_size=1))
    assert (frozen.total, frozen.items[0].revision) == (1, 1)
    assert queries.observations(publication.version_id, AnalysisObservationQuery(round_id=2)).total == 0
    with pytest.raises(LookupError, match='作业不存在'):
        queries.observation_history('missing', {})
