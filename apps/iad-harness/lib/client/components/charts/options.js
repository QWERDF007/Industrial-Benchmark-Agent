export function chartNumber(value, format = 'count') {
    return value.toLocaleString('zh-CN', format === 'percent' ? { style: 'percent', maximumSignificantDigits: 4 }
        : format === 'count' ? { maximumFractionDigits: 0 } : { maximumSignificantDigits: 5 });
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
export function chartReadings(spec) {
    switch (spec.type) {
        case 'bar': return spec.rows.map(row => [row.label, ...spec.series.map((series, index) => `${series.label}（${series.unit}）：${chartNumber(row.values[index])}`)].join('\n'));
        case 'donut': return spec.rows.map(row => `${row.label}\n数量（${spec.unit}）：${chartNumber(row.value)}`);
        case 'distribution': {
            const curves = distributionSeries(spec);
            return curves.length ? curves.flatMap(curve => curve.points.map(point => point.description)) : ['暂无统计数据'];
        }
        case 'heatmap': return spec.data.cells.map(([x, y, value]) => `${spec.xLabel} ${chartNumber(spec.data.x_edges[x], spec.format || 'decimal')}–${chartNumber(spec.data.x_edges[x + 1], spec.format || 'decimal')}\n${spec.yLabel} ${chartNumber(spec.data.y_edges[y], spec.format || 'decimal')}–${chartNumber(spec.data.y_edges[y + 1], spec.format || 'decimal')}\n数量：${chartNumber(value)}`);
        case 'boxplot': return spec.rows.map(row => [row.label,
            ...[row.statistics.lower_whisker, row.statistics.q25, row.statistics.median, row.statistics.q75, row.statistics.upper_whisker]
                .map((value, index) => `${['下箱须', '下四分位数', '中位数', '上四分位数', '上箱须'][index]}：${chartNumber(value, spec.format || 'decimal')}`),
            `离群数量：${chartNumber(row.statistics.outliers.reduce((sum, [, count]) => sum + count, 0))}`, `样本数：${chartNumber(row.statistics.count)}`].join('\n'));
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
    if ((spec.type === 'bar' || spec.type === 'boxplot') && !spec.rows.length)
        return { ...common, legend: { show: false },
            graphic: { type: 'text', left: 'center', top: 'middle', style: { text: '暂无统计数据', fill: theme.muted, fontSize: 14, fontFamily: theme.font } }, series: [] };
    switch (spec.type) {
        case 'bar': return { ...common,
            xAxis: { ...axis, type: 'category', data: spec.rows.map(row => row.label), splitLine: { show: false },
                axisLabel: { ...axis.axisLabel, width: 110, overflow: 'truncate' } },
            yAxis: { ...axis, type: 'value', min: 0, max: spec.maximum, minInterval: 1 },
            series: spec.series.map((series, index) => ({ type: 'bar', name: `${series.label}（${series.unit}）`, barMaxWidth: 32,
                itemStyle: { color: series.tone ? theme.tones[series.tone] : theme.palette[index % theme.palette.length], borderRadius: [3, 3, 0, 0] },
                label: { show: true, position: 'top', color: theme.ink, formatter: params => chartNumber(Number(params.value)) },
                data: spec.rows.map(row => ({ id: row.id, value: row.values[index] })) })) };
        case 'donut': return { ...common, legend: { ...common.legend, bottom: 0, top: undefined },
            tooltip: { ...common.tooltip, formatter: `{b}\n{c} ${spec.unit}（{d}%）` },
            series: [{ type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'], avoidLabelOverlap: true, stillShowZeroSum: false,
                    emptyCircleStyle: { color: theme.grid },
                    label: { color: theme.ink, formatter: `{b}\n{c} ${spec.unit}` },
                    labelLine: { lineStyle: { color: theme.grid } }, itemStyle: { borderColor: theme.surface, borderWidth: 2 },
                    data: spec.rows.map(row => ({ id: row.id, name: row.label, value: row.value,
                        label: { show: row.value > 0 }, itemStyle: row.tone ? { color: theme.tones[row.tone] } : undefined })) }] };
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
            const peak = Math.max(0, ...cells.map(cell => cell[2]));
            const counts = new Map(cells.map(([i, j, value]) => [`${i},${j}`, value]));
            return { ...common, animation: false, legend: { show: false },
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
            const readings = chartReadings(spec);
            return { ...common, legend: { show: false }, xAxis: { ...axis, type: 'category', data: spec.rows.map(row => row.label) },
                yAxis: { ...axis, type: 'value', axisLabel: { ...axis.axisLabel, formatter: (value) => chartNumber(value, spec.format || 'decimal') } },
                tooltip: { ...common.tooltip, formatter: params => {
                        const item = Array.isArray(params) ? params[0] : params;
                        if (item.seriesIndex === 1)
                            return item.name;
                        return readings[item.dataIndex];
                    } },
                series: [{ type: 'boxplot', data: spec.rows.map(row => ({ id: row.id, value: [row.statistics.lower_whisker, row.statistics.q25,
                                row.statistics.median, row.statistics.q75, row.statistics.upper_whisker] })),
                        itemStyle: { color: theme.surface, borderColor: theme.tones.primary, borderWidth: 2 } },
                    { type: 'scatter', symbolSize: 7, data: spec.rows.flatMap((row, index) => row.statistics.outliers.map(([value, count]) => ({
                            value: [index, value], name: `${row.label}\n${chartNumber(value, spec.format || 'decimal')}，${count} 个`
                        }))), itemStyle: { color: theme.tones.warning } }] };
        }
    }
}
