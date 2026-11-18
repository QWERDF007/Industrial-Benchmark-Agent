from collections.abc import Sequence

import numpy as np

from iad_core.advisory.analysis import AnalysisModel


class DistributionHeatmap(AnalysisModel):
    x_edges: list[float]
    y_edges: list[float]
    cells: list[tuple[int, int, int]]

    @classmethod
    def build(cls, x: Sequence[float], y: Sequence[float], *, bins=32,
              weights: Sequence[int] | None = None) -> 'DistributionHeatmap':
        counts, x_edges, y_edges = np.histogram2d(x, y, bins=bins, weights=weights)
        return cls(x_edges=x_edges.tolist(), y_edges=y_edges.tolist(),
            cells=[(int(i), int(j), int(counts[i, j])) for i, j in zip(*np.nonzero(counts))])
