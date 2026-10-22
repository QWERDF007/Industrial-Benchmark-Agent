import React, {useEffect, useState} from 'react';
import type {PropsRuntime} from '@deepseek-ai/dsh-client-ui-slots';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client';
import {navigation, type PageId} from '../../shared/navigation.js';

export function IndustrialSidebar({wide, panels, renderPanel, renderWorkspaces, usePanelInfo}: PropsRuntime<'sidebar.content'>) {
  const active = usePanelInfo(info => info.activePanelId);
  const [sessionsOpen, setSessionsOpen] = useState(!active);
  useEffect(() => setSessionsOpen(!active), [active]);
  const business = panels.filter(panel => panel.id in navigation && navigation[panel.id as PageId].chapter !== '工具');
  const auxiliary = panels.filter(panel => !business.includes(panel));
  return <div className={`iad-sidebar-content ${wide ? 'iad-sidebar-wide' : 'iad-sidebar-rail'}`}>
    <style>{`
      .iad-sidebar-content{display:flex;flex-direction:column;flex:1;min-height:0;overflow:auto;gap:16px;color:var(--dsw-alias-label-primary);font-size:14px}
      .iad-sidebar-content nav{display:flex;flex-direction:column;gap:20px}.iad-sidebar-content section{display:flex;flex-direction:column;gap:4px}
      .iad-sidebar-content h2{margin:0 10px 4px;font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content section>button{min-height:40px}.iad-sidebar-content [aria-current=page]{color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover)}
      .iad-sidebar-content details{min-height:0}.iad-sidebar-content summary{padding:8px 10px;cursor:pointer;list-style-position:inside;color:var(--dsw-alias-label-secondary)}
      .iad-sidebar-content summary:focus-visible{outline:2px solid var(--dsw-focus-ring-color);outline-offset:-2px}
      .iad-sidebar-content details[open]{flex:1;display:flex;flex-direction:column}.iad-native-workspace-content{min-height:0;overflow:auto;flex:1}
      .iad-sidebar-tools{margin-top:auto}.iad-sidebar-rail{gap:12px}.iad-sidebar-rail nav{gap:12px}
    `}</style>
    <nav aria-label="工业工作台导航">{(['数据准备', '知识构建', '质量审核'] as const).map(chapter => <section key={chapter} aria-label={chapter}>
      {wide && <h2>{chapter}</h2>}{business.filter(panel => navigation[panel.id as PageId].chapter === chapter).map(panel => <React.Fragment key={panel.id}>{renderPanel(panel)}</React.Fragment>)}
    </section>)}</nav>
    {wide ? <details data-native-workspaces open={sessionsOpen} onToggle={event => setSessionsOpen(event.currentTarget.open)}>
      <summary>会话与工作区</summary><div className="iad-native-workspace-content">{renderWorkspaces()}</div>
    </details> : renderWorkspaces()}
    <section className="iad-sidebar-tools" aria-label="工具">{auxiliary.map(panel => <React.Fragment key={panel.id}>{renderPanel(panel)}</React.Fragment>)}</section>
  </div>;
}
