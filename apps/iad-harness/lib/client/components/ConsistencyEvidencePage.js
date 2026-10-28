import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { message, request } from '../api.js';
import { useWorkspace } from '../workspace.js';
import { workbenchStyles } from '../styles.js';
import { WorkbenchHeader } from './layout/WorkbenchHeader.js';
import { FrozenConsistencyComparison } from './FrozenConsistencyComparison.js';
import { ConsistencyReviewPanel } from './ConsistencyReviewPanel.js';
const sourceStates = { CURRENT: '来源与当次检查一致', CHANGED: '来源已变化', MISSING: '来源已移除', UNKNOWN: '来源状态未知' };
export function ConsistencyEvidencePage({ evidenceId }) {
    const { workspace, state } = useWorkspace();
    const [bundle, setBundle] = useState(null), [error, setError] = useState('');
    const [asking, setAsking] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        setBundle(null);
        setError('');
        request(`/consistency/evidence/${encodeURIComponent(evidenceId)}`, undefined, undefined, controller.signal)
            .then(value => { if (!controller.signal.aborted)
            setBundle(value); }).catch(failure => { if (!controller.signal.aborted)
            setError(message(failure)); });
        return () => controller.abort();
    }, [evidenceId]);
    return _jsxs("div", { className: "iad-workbench iad-consistency", "data-page": "industrial-consistency", "data-evidence-id": evidenceId, children: [_jsx("style", { children: workbenchStyles }), _jsxs(WorkbenchHeader, { pageId: "industrial-consistency", title: "\u6BD4\u8F83\u8BC1\u636E", children: [_jsx("button", { disabled: !!state.consistency.returnPage && !bundle, onClick: () => {
                            const pageId = state.consistency.returnPage, queryId = state.consistency.query?.sample_id;
                            const source = queryId && bundle ? [bundle.sources.left.sample, bundle.sources.right.sample].find(sample => sample.sample_id === queryId) : bundle?.sources.left.sample;
                            if (pageId && source?.dataset_id)
                                workspace.openLocation({ pageId, datasetId: source.dataset_id, selected: source.sample_id });
                            else
                                workspace.updateConsistency({ evidenceId: undefined, resultId: state.consistency.tab === 'conflicts' ? state.consistency.resultId : undefined, tab: state.consistency.batchId ? 'jobs' : state.consistency.tab || 'search' }, true);
                        }, children: state.consistency.returnPage === 'industrial-audit' ? '返回审计' : state.consistency.returnPage === 'industrial-review' ? '返回复核' : state.consistency.returnPage === 'industrial-images' ? '返回图像' : state.consistency.batchId ? '返回批次' : state.consistency.tab === 'conflicts' || state.consistency.tab === 'groups' ? '返回结果' : '返回检索' }), _jsx("button", { disabled: !bundle || asking, onClick: async () => { if (!bundle)
                            return; setAsking(true); setError(''); try {
                            await workspace.explainConsistency(bundle.result);
                        }
                        catch (failure) {
                            setError(message(failure));
                        }
                        finally {
                            setAsking(false);
                        } }, children: asking ? '正在打开会话…' : '在 DSH 中解释' }), _jsx("button", { disabled: !bundle, onClick: () => window.location.assign(`/api/iad/consistency/evidence/${encodeURIComponent(evidenceId)}/export`), children: "\u4E0B\u8F7D\u8BC1\u636E" })] }), error && _jsx("p", { role: "alert", className: "iad-error", children: error }), !bundle && !error && _jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u51BB\u7ED3\u8BC1\u636E\u2026" }), bundle && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-row", children: [_jsx("strong", { children: "\u5F53\u6B21\u68C0\u67E5\u7684\u51BB\u7ED3\u5185\u5BB9" }), _jsx("time", { dateTime: bundle.checked_at, children: new Date(bundle.checked_at).toLocaleString() })] }), _jsxs("p", { className: "iad-muted", children: ["\u67E5\u8BE2\uFF1A", sourceStates[bundle.source_states.left], " \u00B7 \u5019\u9009\uFF1A", sourceStates[bundle.source_states.right]] }), _jsx(FrozenConsistencyComparison, { bundle: bundle }), _jsx(ConsistencyReviewPanel, { bundle: bundle }, bundle.result.evidence_id)] })] });
}
