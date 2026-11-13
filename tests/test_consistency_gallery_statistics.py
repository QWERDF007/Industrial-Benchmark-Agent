from iad_core.consistency.gallery_statistics import GalleryStatisticFact, GalleryStatistics


def test_gallery_statistics_count_groups_once_and_keep_unjudged_out_of_agreement():
    first = GalleryStatisticFact(group_id='first', facts_state='CURRENT', conflict_categories=['类别不一致', '位置差异'],
        model_categories=['类别不一致'], model_state='MATERIAL', model_conclusion='类别不一致', annotation_conclusion='类别不一致')
    second = GalleryStatisticFact(group_id='second', facts_state='CURRENT', conflict_categories=['多类别'],
        model_categories=[], model_state='EQUIVALENT', model_conclusion='一致', annotation_conclusion='多类别')
    unknown = GalleryStatisticFact(group_id='third', facts_state='CURRENT', conflict_categories=['少类别'],
        model_categories=[], model_state='NOT_ANALYZED', model_conclusion=None, annotation_conclusion='少类别')
    statistics = GalleryStatistics.capture([first, second, unknown, first])
    assert statistics.total == 3
    assert statistics.original_categories == {'类别不一致': 1, '位置差异': 1, '多类别': 1, '少类别': 1}
    assert statistics.model_categories == {'类别不一致': 1, 'EQUIVALENT': 1}
    assert statistics.agreement == {'same': 1, 'different': 1}
    assert statistics.unjudged == 1
