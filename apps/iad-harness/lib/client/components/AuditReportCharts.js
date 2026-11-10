import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useMemo } from 'react';
import { init, use } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, AriaComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { auditReportCharts } from '../audit-report-charts.js';
use([BarChart, PieChart, TooltipComponent, LegendComponent, GridComponent, AriaComponent, SVGRenderer]);
function Chart({ chart }) {
    const root = useRef(null);
    useEffect(() => {
        const element = root.current, view = init(element, undefined, { renderer: 'svg', locale: 'ZH' });
        view.setOption({ ...chart.option, aria: { enabled: true, label: { description: chart.summary } } });
        const resize = new ResizeObserver(() => view.resize());
        resize.observe(element);
        return () => { resize.disconnect(); view.dispose(); };
    }, [chart]);
    return _jsxs("figure", { className: "iad-audit-chart", "data-chart": chart.key, children: [_jsx("figcaption", { children: chart.title }), _jsx("div", { ref: root, className: "iad-audit-chart-canvas", role: "img", "aria-label": chart.summary })] });
}
export function AuditReportCharts({ report, keys }) {
    const charts = useMemo(() => auditReportCharts(report), [report]);
    return _jsx("div", { className: "iad-audit-charts", children: charts.filter(chart => keys.includes(chart.key)).map(chart => _jsx(Chart, { chart: chart }, chart.key)) });
}
