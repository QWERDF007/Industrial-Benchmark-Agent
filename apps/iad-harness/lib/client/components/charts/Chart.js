import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { init, use } from 'echarts/core';
import { BarChart, BoxplotChart, HeatmapChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import { AriaComponent, GraphicComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { chartOptions, chartReadings } from './options.js';
use([BarChart, BoxplotChart, HeatmapChart, LineChart, PieChart, ScatterChart, AriaComponent,
    GraphicComponent, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, SVGRenderer]);
export function Chart({ id, title, spec, onSelect, description, controls }) {
    const host = useRef(null);
    const chartType = useRef(spec?.type);
    if (spec)
        chartType.current = spec.type;
    const current = useRef({ spec, onSelect });
    current.current = { spec, onSelect };
    const draw = useRef(() => { });
    const hasData = spec !== null;
    const summary = [title, ...(spec ? chartReadings(spec) : [])].join('；').replaceAll('\n', '，');
    useEffect(() => {
        if (!hasData)
            return;
        const element = host.current;
        const chart = init(element, undefined, { renderer: 'svg' });
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const render = () => {
            const style = getComputedStyle(element);
            const color = (name) => style.getPropertyValue(`--iad-chart-${name}`).trim();
            const tones = Object.fromEntries(['primary', 'success', 'warning', 'danger', 'muted'].map(name => [name, color(name)]));
            const theme = { ink: color('ink'), muted: color('muted'), grid: color('grid'), surface: color('surface'),
                font: style.fontFamily, tones, palette: [tones.primary, tones.success, tones.warning, tones.danger, color('secondary'), tones.muted], reducedMotion: motion.matches };
            if (current.current.spec)
                chart.setOption(chartOptions(current.current.spec, theme), { notMerge: true });
        };
        draw.current = render;
        render();
        chart.on('click', (event) => {
            if (event && typeof event === 'object' && 'data' in event && event.data && typeof event.data === 'object' && 'id' in event.data && typeof event.data.id === 'string')
                current.current.onSelect?.(event.data.id);
        });
        const resize = new ResizeObserver(() => chart.resize());
        resize.observe(element);
        const themeChanges = new MutationObserver(render);
        for (let parent = element.parentElement; parent; parent = parent.parentElement)
            themeChanges.observe(parent, { attributes: true, attributeFilter: ['class', 'style', 'data-ds-dark-theme'] });
        motion.addEventListener('change', render);
        return () => {
            resize.disconnect();
            themeChanges.disconnect();
            motion.removeEventListener('change', render);
            draw.current = () => { };
            chart.dispose();
        };
    }, [hasData]);
    useEffect(() => draw.current(), [spec]);
    return _jsxs("figure", { className: "iad-chart", "data-chart": id || chartType.current, "data-chart-type": chartType.current, children: [_jsxs("figcaption", { children: [title, controls && _jsx("div", { className: "iad-chart-controls", children: controls })] }), description && _jsx("p", { className: "iad-chart-description", children: description }), spec ? _jsx("div", { className: "iad-chart-plot", ref: host, role: "img", "aria-label": summary }) : _jsx("p", { className: "iad-chart-empty", role: "status", children: "\u8BF7\u9009\u62E9\u5B50\u6570\u636E\u96C6" })] });
}
