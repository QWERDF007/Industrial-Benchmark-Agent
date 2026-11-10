import path from 'node:path';
import type {Context} from '@deepseek-ai/cordis';
import {ModelCatalogRouting} from './models/index.js';
import {ModelConfigurationError, NativeProviders} from './models/providers.js';
import type {ModelRouting, PythonBridge} from './python-bridge/index.js';
import {ConsistencyAnchorReviewer} from './consistency/anchor-reviewer.js';
import {ConsistencyCheckScheduler} from './consistency/scheduler.js';
import {JobSessionHost} from './sessions/host.js';
import {imageSessionPath} from './sessions/image-path.js';
import {AnalysisWorkflowScheduler} from './analysis/scheduler.js';
import {analysisSessionPath} from './analysis/agent.js';
import type {AnalysisSessionLocation} from '../shared/domain.generated.js';
import type {ImageSessionLocation} from '../shared/domain.generated.js';
import {AuditWorkflowScheduler} from './audit/scheduler.js';
import {auditSessionPath} from './audit/session-path.js';

export const name = 'iad-workbench-runtime';

export async function apply(ctx: Context, {bridge}: {bridge: PythonBridge}) {
  const database = path.resolve(bridge.cwd, bridge.dbPath || process.env.IAD_DB_PATH || 'data/benchmark.db');
  const root = path.join(path.dirname(database), 'consistency-sessions');
  const host = await JobSessionHost.open(root, async session_id => imageSessionPath(root,
    await bridge.execute<ImageSessionLocation>('consistency_agent_session_location', {session_id})));
  const dataRoot = path.dirname(database);
  const exploration = await JobSessionHost.open(path.join(dataRoot, 'exploration-sessions'), async session_id =>
    analysisSessionPath(dataRoot, await bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location', {session_id})));
  const knowledge = await JobSessionHost.open(path.join(dataRoot, 'knowledge-sessions'), async session_id =>
    analysisSessionPath(dataRoot, await bridge.execute<AnalysisSessionLocation>('analysis_agent_session_location', {session_id})));
  const auditHost = await JobSessionHost.open(path.join(dataRoot,'audit-sessions'), async session_id=>
    auditSessionPath(dataRoot,await bridge.execute<ImageSessionLocation>('audit_agent_session_location',{session_id})));
  await bridge.execute('workbench_initialize');
  let modelContext: Context | undefined;
  const providers = new NativeProviders(() => {
    if (!modelContext) throw new ModelConfigurationError('原生模型服务尚未加载');
    return modelContext;
  });
  const reviewer = new ConsistencyAnchorReviewer(bridge, host, providers);
  const scheduler = new ConsistencyCheckScheduler(bridge, host, providers, task => reviewer.review(task),
    error => ctx.logger.warn(error));
  const analysis = new AnalysisWorkflowScheduler(bridge, providers, {exploration, knowledge}, dataRoot, error => ctx.logger.warn(error));
  const audit = new AuditWorkflowScheduler(bridge,providers,auditHost,dataRoot,error=>ctx.logger.warn(error));
  let models: ModelRouting | undefined;
  ctx.inject(['llm', 'settings', 'credentials'], scope => {
    modelContext = scope;
    const routing = new ModelCatalogRouting(scope);
    scope.effect(() => {
      models = routing;
      return () => {models = undefined;modelContext = undefined;};
    });
  });
  ctx.effect(() => bridge.useModelRouting({execute: (operation, args, signal, dispatch) =>
    audit.execute(operation,args,signal,(operation,args={},signal)=>analysis.execute(operation, args, signal, (operation, args = {}, signal) =>
      scheduler.execute(operation, args, signal, (name, values = {}, cancellation) =>
        models ? models.execute(name, values, cancellation, dispatch) : dispatch(name, values, cancellation))))}));
  ctx.effect(() => async () => {
    await audit.dispose();
    await auditHost.dispose();
    await analysis.dispose();
    await exploration.dispose();
    await knowledge.dispose();
    await scheduler.dispose();
    await host.dispose();
  });
}
