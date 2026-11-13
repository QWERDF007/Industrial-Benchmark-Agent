def annotation_response(facts, explanation, *, limitations=()):
    return {'reviews': {identity: {'verdict': 'EQUIVALENT', 'explanation': explanation,
        'issues': [], 'limitations': list(limitations), 'disputed_regions': []}
        for identity in facts['candidates']}}
