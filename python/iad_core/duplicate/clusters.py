from collections import Counter, defaultdict

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

from iad_core.duplicate.models import DuplicateGroup, Pair
from iad_core.storage.models import Sample

def cluster_pairs(pairs: list[Pair], samples_map: dict[str,Sample], id_prefix: str,
                  is_verified: bool) -> tuple[list[DuplicateGroup],set[str],int,dict[str,int]]:
    identities=sorted({identity for left,right,_,_ in pairs for identity in (left,right)})
    if not identities:return [],set(),0,{}
    positions={identity:index for index,identity in enumerate(identities)}
    edges={(min(left,right),max(left,right)):(score,extra) for left,right,score,extra in pairs}
    rows,columns=zip(*((positions[left],positions[right]) for left,right in edges))
    graph=coo_matrix((np.ones(len(edges),dtype=np.uint8),(rows,columns)),shape=(len(identities),len(identities)))
    _,labels=connected_components(graph,directed=False)
    members=defaultdict(list)
    for identity,label in zip(identities,labels):members[int(label)].append(identity)
    component_edges=defaultdict(list)
    for (left,right),(score,extra) in sorted(edges.items()):
        component_edges[int(labels[positions[left]])].append((left,right,score,extra))
    groups=[]
    cross_pairs=Counter()
    for component in sorted(members,key=lambda key:(-len(members[key]),members[key])):
        group_members=members[component]
        origins={identity:samples_map[identity].data_origin.value if identity in samples_map else 'UNKNOWN' for identity in group_members}
        counts=Counter(origins.values())
        values=component_edges[component]
        scores=[score for _,_,score,_ in values]
        representatives=[]
        for left,right,score,extra in values:
            if origins[left]!=origins[right]:cross_pairs[' <-> '.join(sorted((origins[left],origins[right])))]+=1
            if len(representatives)<5:
                representatives.append({'sample_a':left,'sample_b':right,'similarity':round(score,4),**(extra or {})})
        groups.append(DuplicateGroup(group_id=f'{id_prefix}_{len(groups)+1:04d}',size=len(group_members),sample_ids=group_members,
            origin_counts=dict(counts),is_cross_origin=len(counts)>1,is_verified=is_verified,
            max_similarity=round(max(scores),4),min_similarity=round(min(scores),4),
            avg_similarity=round(sum(scores)/len(scores),4),representative_pairs=representatives))
    return groups,set(identities),sum(group.is_cross_origin for group in groups),dict(cross_pairs)
