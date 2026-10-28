import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { Pagination } from './Pagination.js';
import { ConsistencyEmpty } from './ConsistencyEmpty.js';
import { ConsistencyEvidencePreview } from './ConsistencyEvidencePreview.js';
export function ConsistencyGroups({ queryId, datasets }) {
    const { workspace, state } = useWorkspace();
    const [groups, setGroups] = useState(null), [members, setMembers] = useState(null);
    const page = state.consistency.groupPage || 1, memberPage = state.consistency.memberPage || 1, selected = state.consistency.groupId || '';
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        setGroups(null);
        setError('');
        request('/consistency/groups', { query_id: queryId, page, page_size: 20 }, undefined, controller.signal)
            .then(data => { if (!controller.signal.aborted)
            setGroups(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [queryId, page]);
    const group = groups?.items.find(item => item.group_id === selected) || groups?.items[0];
    useEffect(() => {
        const controller = new AbortController();
        setMembers(null);
        if (!group)
            return;
        request('/consistency/groups/members', { query_id: queryId, group_id: group.group_id, facts_state: group.facts_state, page: memberPage, page_size: 20 }, undefined, controller.signal)
            .then(data => { if (!controller.signal.aborted)
            setMembers(data); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [queryId, group?.group_id, group?.facts_state, memberPage]);
    const member = members?.items.find(item => item.sample_id === state.consistency.memberId) || members?.items[0];
    return _jsxs("section", { "aria-label": "\u8303\u56F4\u91CD\u590D\u56FE\u7EC4", children: [error && _jsx("p", { className: "iad-error", role: "alert", children: error }), groups && !groups.total ? _jsx(ConsistencyEmpty, { title: "\u5F53\u524D\u8303\u56F4\u6CA1\u6709\u5DF2\u4FDD\u5B58\u7684\u91CD\u590D\u56FE\u7EC4", description: "\u53EF\u8C03\u6574\u4E8B\u5B9E\u6765\u6E90\u548C\u5904\u7F6E\u7B5B\u9009\uFF0C\u6216\u542F\u52A8\u5F53\u524D\u8303\u56F4\u7684\u4E25\u683C\u540C\u56FE\u68C0\u67E5\u3002" }) : _jsxs("div", { className: "iad-consistency-master-detail", children: [_jsxs("aside", { className: "iad-consistency-list", "aria-label": "\u4E25\u683C\u540C\u56FE\u7EC4", children: [_jsxs("header", { className: "iad-consistency-panel-header", children: [_jsx("strong", { children: "\u91CD\u590D\u56FE\u7EC4" }), _jsxs("span", { children: [groups?.total || 0, " \u7EC4"] })] }), _jsx("div", { className: "iad-consistency-list-scroll", children: groups?.items.map(item => _jsxs("button", { "aria-pressed": group?.group_id === item.group_id, onClick: () => workspace.updateConsistency({ groupId: item.group_id, memberPage: 1, memberId: undefined }, true), children: [_jsxs("strong", { children: [item.member_count, " \u6210\u5458 \u00B7 ", item.dataset_count, " \u4E2A\u6570\u636E\u96C6"] }), _jsxs("span", { children: [item.pair_count, " \u5BF9\u6BD4\u8F83 \u00B7 ", item.facts_state === 'CURRENT' ? '当前' : item.facts_state === 'HISTORICAL' ? '历史' : '待核实'] })] }, item.group_id + item.facts_state)) })] }), _jsxs("section", { children: [member && _jsx(ConsistencyEvidencePreview, { evidenceId: member.evidence_id }, member.evidence_id), group && _jsxs(_Fragment, { children: [_jsxs("h2", { children: ["\u4E25\u683C\u540C\u56FE\u6210\u5458 \u00B7 ", group.member_count] }), _jsx("div", { className: "iad-table-scroll", children: _jsxs("table", { className: "iad-resource-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u56FE\u50CF" }), _jsx("th", { children: "\u6570\u636E\u96C6" }), _jsx("th", { children: "\u8BC1\u636E" })] }) }), _jsx("tbody", { children: members?.items.map(item => _jsxs("tr", { children: [_jsx("td", { children: _jsx("button", { className: "iad-consistency-text-button", "aria-pressed": item === member, onClick: () => workspace.updateConsistency({ memberId: item.sample_id }, true), children: item.relative_path }) }), _jsx("td", { title: item.dataset_id, children: datasets.find(dataset => dataset.dataset_id === item.dataset_id)?.name || item.dataset_id }), _jsx("td", { children: _jsx("button", { onClick: () => workspace.updateConsistency({ evidenceId: item.evidence_id, batchId: undefined, tab: 'groups' }, true), children: "\u6253\u5F00\u6BD4\u8F83\u8BC1\u636E" }) })] }, item.sample_id)) })] }) }), _jsx(Pagination, { total: members?.total || 0, page: memberPage, size: 20, unit: "\u4E2A\u6210\u5458", onPage: value => workspace.updateConsistency({ memberPage: value }, true) })] })] })] }), _jsx(Pagination, { total: groups?.total || 0, page: page, size: 20, unit: "\u4E2A\u56FE\u7EC4", onPage: value => workspace.updateConsistency({ groupPage: value, groupId: undefined, memberPage: 1 }, true) })] });
}
