import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId, useState } from 'react';
import { themeStyles } from '../theme.js';
import { navigation } from '../../shared/navigation.js';
export function IndustrialSidebar({ wide, panels, renderPanel, renderWorkspaces }) {
    const [sessionsOpen, setSessionsOpen] = useState(true);
    const workspacesId = useId();
    const business = panels.filter(panel => panel.id in navigation && navigation[panel.id].chapter !== '工具');
    const auxiliary = panels.filter(panel => !business.includes(panel));
    return _jsxs("div", { className: `iad-sidebar-content ${wide ? 'iad-sidebar-wide' : 'iad-sidebar-rail'}`, children: [_jsx("style", { children: themeStyles + `
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;gap:16px;background:var(--iad-navigation);color:var(--iad-text);font-size:14px}
      .iad-sidebar-content>nav{display:flex;flex-direction:column;gap:20px;min-height:0;overflow:auto;flex:0 1 auto}.iad-sidebar-content>nav>section,.iad-sidebar-tools{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content>nav>section>button,.iad-sidebar-tools>button{min-height:44px}.iad-sidebar-content [aria-current=page]{color:var(--iad-primary);background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}
      .iad-sidebar-sessions{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}.iad-sidebar-sessions[data-open=false]{flex:none}
      .iad-sidebar-disclosure{display:flex;align-items:center;gap:6px;flex:none;min-height:36px;padding:8px 10px;cursor:pointer;background:transparent;border:0;text-align:left;font:inherit;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-disclosure:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-native-workspace-content{min-height:0;overflow:hidden;flex:1}.iad-native-workspace-content:not([hidden]){display:flex;flex-direction:column}
      .iad-sidebar-wide>nav{flex:1 1 0;overscroll-behavior:contain}.iad-sidebar-wide>nav>section{flex:none}.iad-sidebar-wide>.iad-sidebar-sessions[data-open=true]{flex:1 1 0}
      .iad-sidebar-tools{margin-top:auto;flex:none}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail>nav{gap:12px}
    ` }), _jsx("nav", { "aria-label": "\u5DE5\u4E1A\u5DE5\u4F5C\u53F0\u5BFC\u822A", children: ['数据准备', '知识构建', '质量审核'].map(chapter => _jsxs("section", { "aria-label": chapter, children: [wide && _jsx("h2", { children: chapter }), business.filter(panel => navigation[panel.id].chapter === chapter).map(panel => _jsx(React.Fragment, { children: renderPanel(panel) }, panel.id))] }, chapter)) }), wide ? _jsxs("section", { className: "iad-sidebar-sessions", "data-native-workspaces": true, "data-open": sessionsOpen, children: [_jsxs("button", { type: "button", className: "iad-sidebar-disclosure", "aria-expanded": sessionsOpen, "aria-controls": workspacesId, onClick: () => setSessionsOpen(value => !value), children: [_jsx("span", { "aria-hidden": "true", children: sessionsOpen ? '▾' : '▸' }), "\u4F1A\u8BDD\u4E0E\u5DE5\u4F5C\u533A"] }), _jsx("div", { id: workspacesId, className: "iad-native-workspace-content", hidden: !sessionsOpen, children: renderWorkspaces() })] }) : renderWorkspaces(), _jsx("section", { className: "iad-sidebar-tools", "aria-label": "\u5DE5\u5177", children: auxiliary.map(panel => _jsx(React.Fragment, { children: renderPanel(panel) }, panel.id)) })] });
}
