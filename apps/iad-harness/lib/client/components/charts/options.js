export function chartNumber(value, format = 'count') {
    if (value === null)
        return '证据不足';
    return value.toLocaleString('zh-CN', format === 'percent' ? { style: 'percent', maximumSignificantDigits: 4 }
        : format === 'score' ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : format === 'count' ? { maximumFractionDigits: 0 } : { maximumSignificantDigits: 5 });
}
const seriesLabel = ({ label, unit }) => unit ? `${label}（${unit}）` : label;
function boxValues({ statistics: s }) {
    return [s.lower_whisker, s.q25, s.median, s.q75, s.upper_whisker];
}
function boxReading(row, label, format) {
    return [row.label, ...(label ? [label] : []), ...boxValues(row)
            .map((value, index) => `${['下箱须', '下四分位数', '中位数', '上四分位数', '上箱须'][index]}：${chartNumber(value, format)}`),
        `离群数量：${chartNumber(row.statistics.outliers.reduce((sum, [, count]) => sum + count, 0))}`,
        `样本数：${chartNumber(row.statistics.count)}`].join('\n');
}
function distributionSeries(spec) {
    return spec.series.flatMap(series => {
        const total = series.data.counts.reduce((sum, count) => sum + count, 0);
        if (!total)
            return [];
        return [{ id: series.id, label: series.label, points: series.data.counts.map((count, index) => {
                    const lower = series.data.edges[index], upper = series.data.edges[index + 1], share = count / total;
                    return { value: [(lower + upper) / 2, share], description: [series.label,
                            `${spec.xLabel} ${chartNumber(lower, spec.format || 'decimal')}–${chartNumber(upper, spec.format || 'decimal')}`,
                            `数量（${spec.unit}）：${chartNumber(count)}`, `占比：${chartNumber(share, 'percent')}`].join('\n') };
                }) }];
    });
}
function heatmapReading(spec, x, y, count, total) {
    return [`${spec.xLabel} ${chartNumber(spec.data.x_edges[x], spec.format || 'decimal')}–${chartNumber(spec.data.x_edges[x + 1], spec.format || 'decimal')}`,
        `${spec.yLabel} ${chartNumber(spec.data.y_edges[y], spec.format || 'decimal')}–${chartNumber(spec.data.y_edges[y + 1], spec.format || 'decimal')}`,
        `数量：${chartNumber(count)}${spec.showPercent ? '/' + chartNumber(total) : ''}`,
        ...(spec.showPercent ? [`占比：${chartNumber(total ? count / total : 0, 'percent')}`] : [])].join('\n');
}
export function chartReadings(spec) {
    switch (spec.type) {
        case 'bar': return spec.rows.map(row => row.tooltip ?? [row.label, ...spec.series.map((series, index) => `${seriesLabel(series)}：${chartNumber(row.values[index], spec.format)}`), row.details].filter(Boolean).join('\n'));
        case 'donut': return [...(spec.center ? [`${spec.center.label} ${chartNumber(spec.center.value, spec.format)} ${spec.unit}`] : []),
            ...spec.rows.map(row => [row.label, `${spec.format === 'score' ? '得分' : '数量'}（${spec.unit}）：${chartNumber(row.value, spec.format)}`, row.details].filter(Boolean).join('\n'))];
        case 'distribution': {
            const curves = distributionSeries(spec);
            return curves.length ? curves.flatMap(curve => curve.points.map(point => point.description)) : ['暂无统计数据'];
        }
        case 'heatmap': {
            const total = spec.data.cells.reduce((sum, cell) => sum + cell[2], 0);
            return spec.data.cells.map(([x, y, value]) => heatmapReading(spec, x, y, value, total));
        }
        case 'boxplot': return spec.series.flatMap(series => series.rows.map(row => boxReading(row, spec.series.length > 1 ? series.label : '', spec.format || 'decimal')));
    }
}
export function chartOptions(spec, theme) {
    const axis = { axisLine: { lineStyle: { color: theme.grid } }, axisTick: { show: false },
        axisLabel: { color: theme.muted, fontSize: 12, hideOverlap: true }, nameTextStyle: { color: theme.muted },
        splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } } };
    const common = { color: theme.palette, textStyle: { fontFamily: theme.font, color: theme.ink },
        animation: !theme.reducedMotion, animationDuration: 240, animationDurationUpdate: 160,
        aria: { enabled: true, label: { description: chartReadings(spec).join('；').replaceAll('\n', '，') } },
        grid: { left: 12, right: 22, top: 40, bottom: 34, outerBoundsMode: 'same', outerBoundsContain: 'all' },
        tooltip: { renderMode: 'richText', confine: true, backgroundColor: theme.surface, borderColor: theme.grid,
            textStyle: { color: theme.ink, fontFamily: theme.font } },
        legend: { textStyle: { color: theme.muted }, top: 0, type: 'scroll' } };
    if ((spec.type === 'bar' && !spec.rows.length) || (spec.type === 'boxplot' && !spec.series.some(series => series.rows.length)))
        return { ...common, legend: { show: false },
            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '暂无统计数据', fill: theme.muted, fontSize: 14, fontFamily: theme.font } }, series: [] };
    switch (spec.type) {
        case 'bar': return { ...common,
            legend: { ...common.legend, selectedMode: spec.legendSelectable },
            xAxis: { ...axis, type: 'category', data: spec.rows.map(row => row.label), splitLine: { show: false },
                axisLabel: spec.labelRotation === undefined ? { ...axis.axisLabel, width: 110, overflow: 'truncate' }
                    : { ...axis.axisLabel, interval: 0, rotate: spec.labelRotation, hideOverlap: false } },
            yAxis: { ...axis, type: 'value', min: 0, max: spec.maximum, minInterval: spec.format === 'score' ? .1 : 1 },
            tooltip: { ...common.tooltip, trigger: 'axis', formatter: params => chartReadings(spec)[(Array.isArray(params) ? params[0] : params).dataIndex] },
            series: spec.series.map((series, index) => ({ type: 'bar', name: seriesLabel(series), barMaxWidth: 32,
                itemStyle: { color: series.tone ? theme.tones[series.tone] : theme.palette[index % theme.palette.length], borderRadius: [3, 3, 0, 0] },
                label: { show: true, position: 'top', color: theme.ink, formatter: params => chartNumber(params.value === null ? null : Number(params.value), spec.format) },
                data: spec.rows.map(row => ({ id: row.id, value: row.values[index] })) })) };
        case 'donut': return { ...common, legend: { ...common.legend, bottom: 0, top: undefined, selectedMode: spec.center ? false : undefined },
            graphic: spec.center ? { type: 'group', left: 'center', top: '45%', bounding: 'raw', silent: true, children: [
                    { type: 'text', style: { text: chartNumber(spec.center.value, spec.format), x: 0, y: -12, align: 'center', verticalAlign: 'middle',
                            fill: theme.ink, fontFamily: theme.font, fontSize: spec.center.value === null ? 22 : 36, fontWeight: 650 } },
                    { type: 'text', style: { text: spec.center.label, x: 0, y: 24, align: 'center', verticalAlign: 'middle',
                            fill: theme.muted, fontFamily: theme.font, fontSize: 14 } },
                ] } : undefined,
            tooltip: { ...common.tooltip, formatter: params => {
                    const item = Array.isArray(params) ? params[0] : params;
                    return chartReadings(spec)[item.dataIndex + (spec.center ? 1 : 0)]
                        + (item.percent === undefined ? '' : `\n占比：${chartNumber(item.percent / 100, 'percent')}`);
                } },
            series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: true, stillShowZeroSum: false,
                    emptyCircleStyle: { color: theme.grid },
                    label: { show: false }, labelLine: { show: false }, itemStyle: { borderColor: theme.surface, borderWidth: 2 },
                    data: spec.rows.map(row => ({ id: row.id, name: row.label, value: row.value,
                        itemStyle: row.tone ? { color: theme.tones[row.tone] } : undefined })) }] };
        case 'distribution': {
            const curves = distributionSeries(spec);
            if (!curves.length)
                return { ...common, legend: { show: false }, series: [],
                    graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '暂无统计数据', fill: theme.muted, fontSize: 14, fontFamily: theme.font } } };
            return { ...common, legend: { ...common.legend, show: curves.length > 1 },
                xAxis: { ...axis, type: 'value', name: spec.xLabel, nameLocation: 'middle', nameGap: 26, min: 'dataMin', max: 'dataMax',
                    axisLabel: { ...axis.axisLabel, formatter: (value) => chartNumber(value, spec.format || 'decimal') } },
                yAxis: { ...axis, type: 'value', name: '样本占比', nameLocation: 'middle', nameGap: 48, min: 0, max: extent => Math.min(1, extent.max * 1.1),
                    axisLabel: { ...axis.axisLabel, formatter: (value) => chartNumber(value, 'percent') } },
                tooltip: { ...common.tooltip, trigger: 'axis', formatter: params => (Array.isArray(params) ? params : [params])
                        .map(item => curves[item.seriesIndex].points[item.dataIndex].description).join('\n\n') },
                series: curves.map(curve => ({ id: curve.id, name: curve.label, type: 'line', smooth: true, smoothMonotone: 'x',
                    symbol: 'circle', symbolSize: 4, areaStyle: { opacity: .1 }, data: curve.points.map(point => ({ value: point.value })) })) };
        }
        case 'heatmap': {
            const { x_edges: x, y_edges: y, cells } = spec.data;
            const peak = Math.max(0, ...cells.map(cell => cell[2])), total = cells.reduce((sum, cell) => sum + cell[2], 0);
            const counts = new Map(cells.map(([i, j, value]) => [`${i},${j}`, value]));
            return { ...common, animation: false, legend: { show: false },
                tooltip: { ...common.tooltip, formatter: params => {
                        const item = Array.isArray(params) ? params[0] : params;
                        const [i, j, count] = item.value;
                        return heatmapReading(spec, i, j, count, total);
                    } },
                grid: { left: 12, right: 84, top: 18, bottom: 36, outerBoundsMode: 'same', outerBoundsContain: 'all' },
                xAxis: { ...axis, type: 'category', name: spec.xLabel, nameLocation: 'middle', nameGap: 26,
                    data: x.slice(0, -1).map((value, index) => chartNumber((value + x[index + 1]) / 2, spec.format || 'decimal')), splitLine: { show: false } },
                yAxis: { ...axis, type: 'category', name: spec.yLabel, nameLocation: 'middle', nameGap: 50, inverse: spec.reverseY,
                    data: y.slice(0, -1).map((value, index) => chartNumber((value + y[index + 1]) / 2, spec.format || 'decimal')), splitLine: { show: false } },
                visualMap: { min: 0, max: Math.max(1, peak), calculable: peak > 0, realtime: false, orient: 'vertical',
                    right: 8, top: 'middle', itemWidth: 14, itemHeight: 120, inRange: { color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'] },
                    text: ['数量', ''], textStyle: { color: theme.muted } },
                series: [{ type: 'heatmap', progressive: 1000, encode: { tooltip: [2] },
                        data: x.slice(0, -1).flatMap((_, i) => y.slice(0, -1).map((_, j) => ({ value: [i, j, counts.get(`${i},${j}`) || 0],
                            name: `${spec.xLabel} ${chartNumber(x[i], spec.format || 'decimal')}–${chartNumber(x[i + 1], spec.format || 'decimal')}\n${spec.yLabel} ${chartNumber(y[j], spec.format || 'decimal')}–${chartNumber(y[j + 1], spec.format || 'decimal')}` }))),
                        emphasis: { itemStyle: { borderColor: theme.ink, borderWidth: 1 } } }] };
        }
        case 'boxplot': {
            const format = spec.format || 'decimal', multiple = spec.series.length > 1;
            const labels = new Map(spec.series.flatMap(series => series.rows.map(row => [row.id, row.label])));
            const categories = [...labels.keys()].sort((a, b) => labels.get(a).localeCompare(labels.get(b), 'zh-CN', { numeric: true }));
            const positions = new Map(categories.map((id, index) => [id, index]));
            const color = (index) => theme.palette[index % theme.palette.length];
            return { ...common, legend: { show: false }, xAxis: { ...axis, type: 'category', data: categories,
                    axisLabel: { ...axis.axisLabel, formatter: (id) => labels.get(id) ?? id } },
                yAxis: { ...axis, type: 'value', axisLabel: { ...axis.axisLabel, formatter: (value) => chartNumber(value, format) } },
                tooltip: { ...common.tooltip, formatter: params => {
                        const item = Array.isArray(params) ? params[0] : params;
                        const series = spec.series[item.seriesIndex];
                        return series ? boxReading(series.rows[item.dataIndex], multiple ? series.label : '', format) : item.name;
                    } },
                series: [...spec.series.map((series, index) => ({ type: 'boxplot', id: series.id, encode: { x: 0, y: [1, 2, 3, 4, 5] },
                        data: series.rows.map(row => ({ id: row.id, value: [positions.get(row.id), ...boxValues(row)] })),
                        itemStyle: { color: theme.surface, borderColor: color(index), borderWidth: 2 } })),
                    { type: 'scatter', symbolSize: 7, data: spec.series.flatMap((series, index) => series.rows.flatMap(row => row.statistics.outliers.map(([value, count]) => ({
                            value: [positions.get(row.id), value], name: [row.label, ...(multiple ? [series.label] : []), `${chartNumber(value, format)}，${chartNumber(count)} 个`].join('\n'),
                            itemStyle: { color: multiple ? color(index) : theme.tones.warning }
                        })))) }] };
        }
    }
}
