import { jsx as _jsx } from "react/jsx-runtime";
import { useResource } from '../useResource.js';
import { Chart } from './charts/Chart.js';
import { imageDimensionsChart } from './charts/image-dimensions.js';
import { StatisticsDrawer } from './StatisticsDrawer.js';
export function DatasetStatisticsDrawer({ target, onClose }) {
    const { data, loading, error } = useResource(`/datasets/${target.kind === 'group' ? 'groups/' : ''}${encodeURIComponent(target.id)}/image-dimensions`);
    return _jsx(StatisticsDrawer, { title: `${target.name} 统计`, loading: loading, error: error, onClose: onClose, className: "iad-dataset-statistics-drawer", children: !!data?.cells.length && _jsx(Chart, { id: "image-dimensions", title: "\u56FE\u50CF\u5BBD\u9AD8\u5206\u5E03", spec: imageDimensionsChart(data) }) });
}
