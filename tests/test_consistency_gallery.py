import pytest

from iad_core.consistency.errors import ConsistencyError
from iad_core.consistency.evidence_models import ConsistencyCompare
from iad_core.consistency.result_models import ConsistencyQuery
from iad_core.consistency.result_queries import ResultQueries
from iad_core.consistency.service import ConsistencyService


def test_legacy_similar_pair_is_classified_from_frozen_annotation_inventory(dataset,tmp_path):
    import json,hashlib
    from PIL import Image
    from iad_core.consistency.gallery import GalleryQueries,GalleryQuery
    db,registry,config=dataset
    from tests.feature_fixtures import configure_test_encoder
    configure_test_encoder(db,tmp_path)
    for name,width,shapes in [('main',320,[]),('candidate',321,[{'label':'12','shape_type':'rectangle','points':[[240,10],[250,20]]}])]:
        Image.new('RGB',(width,240),'#197fe5').save(tmp_path/'images'/f'{name}.png')
        (tmp_path/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':width,'imageHeight':240,'shapes':shapes}))
    registry.rescan(config.dataset.id)
    service=ConsistencyService(db)
    result=service.compare(ConsistencyCompare(sample_a=config.dataset.id+':main.png',sample_b=config.dataset.id+':candidate.png'))
    assert result.verification.relation=='VISUAL_REFERENCE'
    with db.connection() as conn:
        snapshot=json.loads(conn.execute('SELECT snapshot_json FROM consistency_results WHERE evidence_id=?',(result.evidence_id,)).fetchone()[0])
        snapshot['result']['annotation']['differences']=[item for item in snapshot['result']['annotation']['differences'] if item['type'] not in ('ANNOTATION_COUNT','ONE_SIDED_REGION')]
        snapshot['result']['annotation'].pop('coordinate_frame')
        payload=json.dumps(snapshot)
        conn.execute('UPDATE consistency_results SET snapshot_json=?,snapshot_sha256=? WHERE evidence_id=?',(payload,hashlib.sha256(payload.encode()).hexdigest(),result.evidence_id))
    old=service.evidence(result.evidence_id)
    assert old.result.annotation.conflict_categories==[]
    assert old.annotation_observations['left'].categories==['少类别']
    assert old.annotation_observations['right'].categories==['多类别']
    assert old.annotation_observations['left'].summary=='主图 0 个标注，候选图 1 个标注；已匹配 0 对标注的位置及范围（按图像尺寸归一化）'
    report=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'},'mode':'combined'}))
    gallery=GalleryQueries(db).query(GalleryQuery(query_id=report.query_id,kind='conflicts'))
    assert len(gallery.items)==1 and gallery.items[0].conflict_categories==['少类别']
    with db.connection() as conn:
        assert conn.execute('SELECT snapshot_json FROM consistency_results WHERE evidence_id=?',(result.evidence_id,)).fetchone()[0]==payload


@pytest.mark.parametrize('left_boxes,right_boxes,expected', [
    ([('15',[10,10,30,30])],[('18',[10,10,30,30])],['类别不一致']),
    ([('15',[10,10,30,30])],[('15',[11,10,31,30])],['位置差异']),
    ([('15',[10,10,30,30]),('18',[70,70,90,90])],[('15',[10,10,30,30])],['多类别']),
    ([('15',[10,10,30,30])],[('15',[10,10,30,30]),('18',[70,70,90,90])],['少类别']),
    ([('15',[10,10,20,30]),('15',[20,10,30,30])],[('15',[10,10,30,30])],['拆分']),
    ([('15',[10,10,30,30])],[('15',[10,10,20,30]),('15',[20,10,30,30])],['合并']),
    ([('15',[10,10,30,30])],[('18',[11,10,31,30])],['类别不一致','位置差异']),
])
def test_conflict_categories_follow_frozen_anchor_direction(dataset,tmp_path,left_boxes,right_boxes,expected):
    import json
    from PIL import Image
    from iad_core.consistency.gallery import GalleryQueries,GalleryQuery
    db,registry,config=dataset
    for name,boxes in [('anchor',left_boxes),('candidate',right_boxes)]:
        Image.new('RGB',(320,240),'#378aa7').save(tmp_path/'images'/f'{name}.png')
        (tmp_path/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':320,'imageHeight':240,
            'shapes':[{'label':label,'shape_type':'rectangle','points':[box[:2],box[2:]]} for label,box in boxes]}))
    registry.rescan(config.dataset.id)
    service=ConsistencyService(db)
    service.compare(ConsistencyCompare(sample_a=config.dataset.id+':anchor.png',sample_b=config.dataset.id+':candidate.png'))
    snapshot=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
    gallery = GalleryQueries(db)
    page = gallery.query(GalleryQuery(query_id=snapshot.query_id,kind='conflicts',page_size=1))
    item=page.items[0]
    assert item.anchor.sample.relative_path=='anchor.png'
    assert item.conflict_categories==expected
    assert page.statistics.original_categories == dict.fromkeys(expected, 1)
    assert page.statistics.model_categories == {}
    assert page.statistics.agreement == {'same': 0, 'different': 0}
    assert page.statistics.unjudged == 1
    assert gallery.query(GalleryQuery(query_id=snapshot.query_id,kind='conflicts',page=2,page_size=1)).statistics == page.statistics


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


def test_strict_gallery_keeps_one_anchor_and_does_not_borrow_a_different_pairs_evidence(dataset, tmp_path,monkeypatch):
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
    from contextlib import contextmanager
    queries=[]
    connect=db.connection
    @contextmanager
    def traced_connection(**options):
        with connect(**options) as connection:
            connection.set_trace_callback(queries.append)
            try:
                yield connection
            finally:
                connection.set_trace_callback(None)
    with monkeypatch.context() as patch:
        patch.setattr(db,'connection',traced_connection)
        members = gallery.members(GalleryMemberQuery(query_id=snapshot.query_id, kind='groups', group_id=group.group_id))
    assert len([query for query in queries if query.lstrip().upper().startswith(('WITH','SELECT'))])<=3, '分页候选读取不能逐候选重扫完整比较快照'
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
    assert {item.value for item in page.filters} == {'all', 'category', 'geometry', 'presence', 'instances', 'multiple'}
    assert sum(item.count for item in page.filters if item.value != 'all') == page.total
    memberships = []
    for category in page.filters:
        if category.value == 'all':
            continue
        selected = gallery.query(GalleryQuery(query_id=snapshot.query_id, kind='conflicts', difference_filter=category.value))
        assert selected.total == category.count
        memberships += [item.group_id for item in selected.items]
    assert len(memberships) == len(set(memberships)) == page.total


def test_image_quality_labels_share_category_filter_with_region_labels(dataset, tmp_path):
    from shutil import copyfile
    from iad_core.consistency.gallery import GalleryQueries, GalleryQuery
    from iad_core.storage.repositories import SampleRepository
    db, registry, config = dataset
    copyfile(tmp_path/'images/normal.png',tmp_path/'images/normal2.png')
    registry.rescan(config.dataset.id)
    samples = SampleRepository(db)
    first = samples.get(config.dataset.id + ':normal.png')
    second = samples.get(config.dataset.id + ':normal2.png')
    second.quality_status = 'FAIL'
    samples.upsert(second)
    ConsistencyService(db).compare(ConsistencyCompare(sample_a=first.sample_id,sample_b=second.sample_id))
    snapshot = ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
    gallery = GalleryQueries(db)
    page = gallery.query(GalleryQuery(query_id=snapshot.query_id,kind='conflicts',difference_filter='category'))
    assert page.total == 1
    assert page.items[0].difference_types == ['QUALITY_LABEL']
    assert page.items[0].conflict_categories == ['类别不一致']
    assert {row.value:row.count for row in page.filters} == {
        'all':1,'category':1,'geometry':0,'presence':0,'instances':0,'multiple':0}


def test_gallery_projects_all_pair_reviews_without_reopening_image_contexts(dataset,tmp_path):
    import json
    from shutil import copyfile
    from uuid import uuid4
    from iad_core.consistency.gallery import GalleryQueries,GalleryQuery
    from iad_core.consistency.review import ConsistencyReview
    from iad_core.consistency.review_models import ConsistencyReviewSubmission
    db,registry,config=dataset
    copyfile(tmp_path/'images/dent.png',tmp_path/'images/third.png')
    content=json.loads((tmp_path/'labels/dent.json').read_text());content['shapes'][0]['label']='third-category'
    (tmp_path/'labels/third.json').write_text(json.dumps(content));registry.rescan(config.dataset.id)
    service=ConsistencyService(db)
    anchor=config.dataset.id+':dent.png'
    pairs=[service.compare(ConsistencyCompare(sample_a=anchor,sample_b=config.dataset.id+':'+name+'.png')) for name in ['scratch','third']]
    snapshot=ResultQueries(db).query(ConsistencyQuery(selection={'kind':'scope','subjects':{'kind':'all_registered'}}))
    gallery=GalleryQueries(db);query=GalleryQuery(query_id=snapshot.query_id,kind='conflicts')
    assert gallery.query(query).items[0].review_state=='pending'
    reviews=ConsistencyReview(db)
    def decide(pair,kind):
        reviews.submit(ConsistencyReviewSubmission(client_request_id=uuid4(),evidence_id=pair.evidence_id,
            result_id=pair.result_id,difference_ids=[d.difference_id for d in pair.annotation.differences],
            reviewer='真实复核员',comment='核对该组原图及原始标注',action={'kind':kind}))
    decide(pairs[0],'CONFIRM_DIFFERENCE')
    assert gallery.query(query).items[0].review_state=='pending','不能以一对已确认替代整个图组的复核'
    decide(pairs[1],'CONFIRM_DIFFERENCE')
    assert gallery.query(query).items[0].review_state=='confirmed'
    decide(pairs[1],'REJECT_DIFFERENCE')
    assert gallery.query(query).items[0].review_state=='pending'
    decide(pairs[0],'EXPECTED_POLICY_DIFFERENCE')
    assert gallery.query(query).items[0].review_state=='rejected'
    from iad_core.storage.repositories import SampleRepository
    assert SampleRepository(db).get(anchor).quality_status=='UNCERTAIN','比较复核不能擅改来源的质量真值'
