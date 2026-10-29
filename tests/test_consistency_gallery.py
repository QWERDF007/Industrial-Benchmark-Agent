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
    assert first.total == 1 and len(first.items) == 1
    anchor = first.items[0]
    assert anchor.anchor.sample_id == sample('dent') and anchor.candidate_count == 1
    following = gallery.query(query.model_copy(update={'page': 2}))
    assert following.items == []
    members = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='conflicts', group_id=anchor.group_id, page_size=2))
    assert members.total == 1 and len(members.items) == 1
    last = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='conflicts', group_id=anchor.group_id, page_size=2, page=2))
    assert {item.image.sample_id for item in [*members.items, *last.items]} == {sample('scratch')}
    assert all(item.comparison is not None for item in members.items)
    searched = gallery.query(query.model_copy(update={'search': 'dent'}))
    assert searched.total == 1
    filtered = gallery.query(query.model_copy(update={'difference_filter': 'category'}))
    assert filtered.total == 1 and filtered.items[0].anchor.sample_id == sample('dent')
    assert filtered.items[0].candidate_count == 1, '候选仅包含像素完全相同且标注实际不同的记录'
    assert {item.value: item.count for item in filtered.filters}['all'] == 1
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


def test_conflict_gallery_excludes_equal_annotations_and_partitions_every_card_once(dataset, tmp_path):
    import json
    from shutil import copyfile
    from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
    db, registry, config = dataset
    images, labels = tmp_path / 'images', tmp_path / 'labels'
    for name, label, points in [('equal', 'dent', [[10, 10], [30, 30]]),
                               ('shifted', 'dent', [[11, 10], [31, 30]]),
                               ('multiple', 'other', [[11, 10], [31, 30]])]:
        copyfile(images / 'dent.png', images / (name + '.png'))
        (labels / (name + '.json')).write_text(json.dumps({'imageWidth': 320, 'imageHeight': 240,
            'shapes': [{'label': label, 'shape_type': 'rectangle', 'points': points}]}))
    registry.rescan(config.dataset.id)
    service = ConsistencyService(db)
    sid = lambda name: config.dataset.id + ':' + name + '.png'
    for left, right in [('dent', 'equal'), ('dent', 'scratch'), ('shifted', 'equal'),
                        ('multiple', 'equal'), ('normal', 'normal2')]:
        service.compare(ConsistencyCompare(sample_a=sid(left), sample_b=sid(right)))
    snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind': 'scope', 'subjects': {'kind': 'all_registered'}}))
    gallery = GalleryQueries(db)
    page = gallery.query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts'))
    assert page.total == 3, '排除标注相同、仅规范未知和像素不同的比较'
    pages = [gallery.query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts', page=n, page_size=1)) for n in (1,2,3)]
    assert len({p.items[0].group_id for p in pages}) == 3
    assert all(p.total == 3 for p in pages)
    assert {item.anchor.sample_id for item in page.items} == {sid('dent'), sid('shifted'), sid('multiple')}
    assert all(item.candidate_count == 1 for item in page.items)
    assert {item.value for item in page.filters} == {'all', 'category', 'geometry', 'presence', 'instances', 'quality', 'multiple'}
    assert sum(item.count for item in page.filters if item.value != 'all') == page.total
    memberships = []
    for category in page.filters:
        if category.value == 'all':
            continue
        selected = gallery.query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts', difference_filter=category.value))
        assert selected.total == category.count
        memberships += [item.group_id for item in selected.items]
    assert len(memberships) == len(set(memberships)) == page.total
