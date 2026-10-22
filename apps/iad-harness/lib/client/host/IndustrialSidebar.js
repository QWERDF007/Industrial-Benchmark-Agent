import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { navigation } from '../../shared/navigation.js';
export function IndustrialSidebar({ wide, panels, renderPanel, renderWorkspaces, usePanelInfo }) {
    const active = usePanelInfo(info => info.activePanelId);
    const [sessionsOpen, setSessionsOpen] = useState(!active);
    useEffect(() => setSessionsOpen(!active), [active]);
    const business = panels.filter(panel => panel.id in navigation && navigation[panel.id].chapter !== '工具');
    const auxiliary = panels.filter(panel => !business.includes(panel));
    return _jsxs("div", { className: `iad-sidebar-content ${wide ? 'iad-sidebar-wide' : 'iad-sidebar-rail'}`, children: [_jsx("style", { children: `
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;gap:16px;color:var(--dsw-alias-label-primary);font-size:14px}
      .iad-sidebar-content nav{display:flex;flex-direction:column;gap:20px}.iad-sidebar-content section{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content section>button{min-height:40px}.iad-sidebar-content [aria-current=page]{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
      .iad-sidebar-content details{min-height:0}.iad-sidebar-content summary{padding:8px 10px;cursor:pointer;list-style-position:inside;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-sidebar-content details[open]{flex:1;display:flex;flex-direction:column}.iad-native-workspace-content{min-height:0;overflow:auto;flex:1}
      .iad-sidebar-tools{margin-top:auto}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail nav{gap:12px}
    ` }), _jsx("nav", { "aria-label": "\u5DE5\u4E1A\u5DE5\u4F5C\u53F0\u5BFC\u822A", children: ['数据准备', '知识构建', '质量审核'].map(chapter => _jsxs("section", { "aria-label": chapter, children: [wide && _jsx("h2", { children: chapter }), business.filter(panel => navigation[panel.id].chapter === chapter).map(panel => _jsx(React.Fragment, { children: renderPanel(panel) }, panel.id))] }, chapter)) }), wide ? _jsxs("details", { "data-native-workspaces": true, open: sessionsOpen, onToggle: event => setSessionsOpen(event.currentTarget.open), children: [_jsx("summary", { children: "\u4F1A\u8BDD\u4E0E\u5DE5\u4F5C\u533A" }), _jsx("div", { className: "iad-native-workspace-content", children: renderWorkspaces() })] }) : renderWorkspaces(), _jsx("section", { className: "iad-sidebar-tools", "aria-label": "\u5DE5\u5177", children: auxiliary.map(panel => _jsx(React.Fragment, { children: renderPanel(panel) }, panel.id)) })] });
}
