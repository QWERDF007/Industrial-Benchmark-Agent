import React, {useEffect, useId, useState} from 'react';
import type {PropsRuntime} from '@deepseek-ai/dsh-client-ui-slots';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client';
import {themeStyles} from '../theme.js';
import {navigation, type PageId} from '../../shared/navigation.js';

export function IndustrialSidebar({wide, panels, renderPanel, renderWorkspaces, usePanelInfo}: PropsRuntime<'sidebar.content'>) {
  const active = usePanelInfo(info => info.activePanelId);
  const [sessionsOpen, setSessionsOpen] = useState(!active);
  const workspacesId = useId();
  useEffect(() => setSessionsOpen(!active), [active]);
  const business = panels.filter(panel => panel.id in navigation && navigation[panel.id as PageId].chapter !== '工具');
  const auxiliary = panels.filter(panel => !business.includes(panel));
  return <div className={`iad-sidebar-content ${wide ? 'iad-sidebar-wide' : 'iad-sidebar-rail'}`}>
    <style>{themeStyles+`
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;gap:16px;background:var(--iad-navigation);color:var(--iad-text);font-size:14px}
      .iad-sidebar-content>nav{display:flex;flex-direction:column;gap:20px;min-height:0;overflow:auto;flex:0 1 auto}.iad-sidebar-content>nav>section,.iad-sidebar-tools{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content>nav>section>button,.iad-sidebar-tools>button{min-height:44px}.iad-sidebar-content [aria-current=page]{color:var(--iad-primary);background:var(--iad-hover);box-shadow:inset 3px 0 var(--iad-primary)}
      .iad-sidebar-sessions{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden}.iad-sidebar-sessions[data-open=false]{flex:none}
      .iad-sidebar-disclosure{display:flex;align-items:center;gap:6px;flex:none;min-height:36px;padding:8px 10px;cursor:pointer;background:transparent;border:0;text-align:left;font:inherit;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-disclosure:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-native-workspace-content{min-height:0;overflow:hidden;flex:1}.iad-native-workspace-content:not([hidden]){display:flex;flex-direction:column}
      .iad-sidebar-tools{margin-top:auto;flex:none}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail>nav{gap:12px}
    `}</style>
    <nav aria-label="工业工作台导航">{(['数据准备', '知识构建', '质量审核'] as const).map(chapter => <section key={chapter} aria-label={chapter}>
      {wide && <h2>{chapter}</h2>}{business.filter(panel => navigation[panel.id as PageId].chapter === chapter).map(panel => <React.Fragment key={panel.id}>{renderPanel(panel)}</React.Fragment>)}
    </section>)}</nav>
    {wide ? <section className="iad-sidebar-sessions" data-native-workspaces data-open={sessionsOpen}>
      <button type="button" className="iad-sidebar-disclosure" aria-expanded={sessionsOpen} aria-controls={workspacesId} onClick={() => setSessionsOpen(value => !value)}><span aria-hidden="true">{sessionsOpen ? '▾' : '▸'}</span>会话与工作区</button>
      <div id={workspacesId} className="iad-native-workspace-content" hidden={!sessionsOpen}>{renderWorkspaces()}</div>
    </section> : renderWorkspaces()}
    <section className="iad-sidebar-tools" aria-label="工具">{auxiliary.map(panel => <React.Fragment key={panel.id}>{renderPanel(panel)}</React.Fragment>)}</section>
  </div>;
}
