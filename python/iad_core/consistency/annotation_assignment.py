from collections.abc import Mapping
from dataclasses import dataclass

import numpy as np
from scipy.optimize import linear_sum_assignment


@dataclass(frozen=True)
class AnnotationAssignment:
    pairs: tuple[tuple[int, int], ...]
    groups: tuple[tuple[tuple[int, ...], tuple[int, ...]], ...]
    left_only: tuple[int, ...]
    right_only: tuple[int, ...]

    @classmethod
    def solve(cls, left: Mapping[int, str], right: Mapping[int, str],
              scores: Mapping[tuple[int, int], float], exact: set[tuple[int, int]]) -> 'AnnotationAssignment':
        rows, cols = sorted(left, key=left.__getitem__), sorted(right, key=right.__getitem__)
        pairs = list(cls._pair(rows, cols, {pair: 1. for pair in exact})) if exact else []
        used_left, used_right = {i for i, _ in pairs}, {j for _, j in pairs}
        groups = []
        edges = {pair for pair, score in scores.items() if score > 0 and pair[0] not in used_left and pair[1] not in used_right}
        for lc, rc in cls._components(edges):
            indices_left, indices_right = sorted(lc, key=left.__getitem__), sorted(rc, key=right.__getitem__)
            if (len(lc) > 1 and len(rc) == 1) or (len(rc) > 1 and len(lc) == 1):
                groups.append((tuple(indices_left), tuple(indices_right)))
                used_left.update(lc)
                used_right.update(rc)
            else:
                selected = cls._pair(indices_left, indices_right, scores)
                pairs.extend(selected)
                used_left.update(i for i, _ in selected)
                used_right.update(j for _, j in selected)
        return cls(tuple(pairs), tuple(groups), tuple(i for i in rows if i not in used_left),
            tuple(j for j in cols if j not in used_right))

    @staticmethod
    def _pair(rows: list[int], cols: list[int], scores: Mapping[tuple[int, int], float]) -> list[tuple[int, int]]:
        if not rows or not cols:
            return []
        matrix = np.zeros((len(rows), len(cols) + len(rows)))
        for i, row in enumerate(rows):
            for j, col in enumerate(cols):
                matrix[i, j] = scores.get((row, col), 0.)
        chosen_rows, chosen_cols = linear_sum_assignment(matrix, maximize=True)
        return [(rows[int(i)], cols[int(j)]) for i, j in zip(chosen_rows, chosen_cols)
            if j < len(cols) and matrix[i, j] > 0]

    @staticmethod
    def _components(edges: set[tuple[int, int]]):
        adjacency = {}
        for i, j in edges:
            adjacency.setdefault(('left', i), set()).add(('right', j))
            adjacency.setdefault(('right', j), set()).add(('left', i))
        while adjacency:
            pending = [min(adjacency)]
            left, right = set(), set()
            while pending:
                side, index = pending.pop()
                neighbors = adjacency.pop((side, index), None)
                if neighbors is None:
                    continue
                (left if side == 'left' else right).add(index)
                pending.extend(neighbors)
            yield left, right
