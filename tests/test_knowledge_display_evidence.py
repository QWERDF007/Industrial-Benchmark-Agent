import json

from iad_core.entry import knowledge_details, knowledge_get


def test_knowledge_cards_and_pagination_show_cited_frozen_whole_images_while_preserving_local_observations(native_knowledge_versions):
    db, _, publications = native_knowledge_versions
    version_id = publications[0].version_id
    original = knowledge_get(dict(version_id=version_id),db.db_path)
    check = original['catalog']['checks'][0]
    listing = knowledge_details(dict(version_id=version_id),db.db_path)
    assert (listing['items'][0]['support_count'],listing['items'][0]['counter_count']) == (3,1)
    images = {item['evidence_id']:item['image'] for item in original['evidence']}
    assert all(images[eid]['role']=='overview' for eid in [*check['support_evidence_ids'],*check['counter_evidence_ids']])
    assert any(image['role']=='roi' for image in images.values())
    assert any(image['representation']=='annotation_mask' for image in images.values())
    for role,total in [('support',3),('counter',1)]:
        page = knowledge_details(dict(version_id=version_id,check_id='C1',evidence_role=role,page_size=1),db.db_path)
        assert page['total'] == total and len(page['items']) == 1
        evidence = page['items'][0]['image']
        assert evidence['role']=='overview' and evidence['representation']=='raw'
        assert evidence['crop_bbox']==[0,0,320,240] and evidence['sent_size']==[320,240]
        assert page[role+'_evidence_ids']==check[role+'_evidence_ids']
    gallery = knowledge_details(dict(version_id=version_id,section='evidence',
        evidence_ids=json.dumps([*check['support_evidence_ids'],*check['counter_evidence_ids']]),page_size=1),db.db_path)
    assert gallery['total']==4 and len(gallery['items'])==1
    assert gallery['items'][0]['image']['role']=='overview'
    assert knowledge_get(dict(version_id=version_id),db.db_path)==original
