import pytest

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.service import ConsistencyService


def test_gallery_groups_complete_snapshot_instead_of_current_result_page(dataset):
    from iad_core.consistency.gallery import GalleryQueries, GalleryQuery, GalleryMemberQuery
    db, _, config = dataset
    sample = lambda name: config.dataset.id + ':' + name + '.png'
    service = ConsistencyService(db)
    for candidate in ['scratch', 'normal', 'normal2']:
        service.compare(ConsistencyCompare(sample_a=sample('dent'), sample_b=sample(candidate)))
    service.compare(ConsistencyCompare(sample_a=sample('normal'), sample_b=sample('normal2')))
    snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}, page_size=1))
    assert len(snapshot.items) == 1 and snapshot.total == 4
    gallery = GalleryQueries(db)
    query = GalleryQuery(query_id=snapshot.query_id, kind='conflicts', page_size=1, order='members')
    first = gallery.query(query)
    assert first.total == 2 and len(first.items) == 1
    anchor = first.items[0]
    assert anchor.anchor.sample_id == sample('dent') and anchor.candidate_count == 3
    following = gallery.query(query.model_copy(update={'page': 2}))
    assert following.items[0].anchor.sample_id == sample('normal')
    members = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='conflicts', group_id=anchor.group_id, page_size=2))
    assert members.total == 3 and len(members.items) == 2
    last = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='conflicts', group_id=anchor.group_id, page_size=2, page=2))
    assert {item.image.sample_id for item in [*members.items, *last.items]} == {sample('scratch'), sample('normal'), sample('normal2')}
    assert all(item.comparison is not None for item in members.items)
    searched = gallery.query(query.model_copy(update={'search': 'dent'}))
    assert searched.total == 1
    filtered = gallery.query(query.model_copy(update={'difference_filter': 'annotation'}))
    assert filtered.total == 1 and filtered.items[0].anchor.sample_id == sample('dent')
    assert filtered.items[0].candidate_count == 3, '筛选命中锚点后仍显示其完整候选集合'
    assert {item.value: item.count for item in filtered.filters}['all'] == 2
    assert gallery.query(query.model_copy(update={'search': 'missing'})).total == 0
    with pytest.raises(ConsistencyError, match='outside'):
        gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='conflicts', group_id='missing'))


def test_strict_gallery_keeps_one_anchor_and_does_not_borrow_a_different_pairs_evidence(dataset, tmp_path):
    from shutil import copyfile
    from iad_core.consistency.gallery import GalleryQueries, GalleryQuery, GalleryMemberQuery
    db, registry, config = dataset
    copyfile(tmp_path / 'images/dent.png', tmp_path / 'images/third.png')
    registry.rescan(config.dataset.id)
    sample = lambda name: config.dataset.id + ':' + name + '.png'
    service = ConsistencyService(db)
    service.compare(ConsistencyCompare(sample_a=sample('dent'), sample_b=sample('scratch')))
    newest = service.compare(ConsistencyCompare(sample_a=sample('third'), sample_b=sample('scratch')))
    snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
    gallery = GalleryQueries(db)
    groups = gallery.query(GalleryQuery(query_id=snapshot.query_id, kind='groups'))
    assert groups.total == 1 and groups.items[0].member_count == 3
    group = groups.items[0]
    assert group.anchor.sample_id == sample('third')
    members = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='groups', group_id=group.group_id))
    assert members.anchor == group.anchor and members.total == 2
    by_name = {item.image.sample.relative_path: item for item in members.items}
    assert by_name['scratch.png'].comparison.evidence_id == newest.evidence_id
    assert by_name['dent.png'].comparison is None
    assert service.evidence(by_name['dent.png'].image.evidence_id).sources.left.sample.sample_id == sample('dent')
