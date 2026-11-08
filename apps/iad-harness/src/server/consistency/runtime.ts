import path from 'node:path';
import type {Context} from '@deepseek-ai/cordis';
import {WorkbenchModelRouting} from '../models/index.js';
import {ModelConfigurationError, NativeProviders} from '../models/providers.js';
import type {ModelRouting, PythonBridge} from '../python-bridge/index.js';
import {ConsistencyAnchorReviewer} from './anchor-reviewer.js';
import {ConsistencyCheckScheduler} from './scheduler.js';
import {ConsistencySessionHost} from './session-host.js';
import type {ConsistencySessionLocation} from '../../shared/domain.generated.js';

export const name = 'iad-consistency-runtime';

export async function apply(ctx: Context, {bridge}: {bridge: PythonBridge}) {
  const database = path.resolve(bridge.cwd, bridge.dbPath || process.env.IAD_DB_PATH || 'data/benchmark.db');
  const host = await ConsistencySessionHost.open(path.join(path.dirname(database), 'consistency-sessions'),
    session_id => bridge.execute<ConsistencySessionLocation>('consistency_agent_session_location', {session_id}));
  let modelContext: Context | undefined;
  const providers = new NativeProviders(() => {
    if (!modelContext) throw new ModelConfigurationError('原生模型服务尚未加载');
    return modelContext;
  });
  const reviewer = new ConsistencyAnchorReviewer(bridge, host, providers);
  const scheduler = new ConsistencyCheckScheduler(bridge, host, providers, task => reviewer.review(task),
    error => ctx.logger.warn(error));
  let models: ModelRouting | undefined;
  ctx.inject(['llm', 'settings', 'credentials'], scope => {
    modelContext = scope;
    const routing = new WorkbenchModelRouting(scope);
    scope.effect(() => {
      models = routing;
      return () => {models = undefined;modelContext = undefined;};
    });
  });
  ctx.effect(() => bridge.useModelRouting({execute: (operation, args, signal, dispatch) =>
    scheduler.execute(operation, args, signal, (name, values = {}, cancellation) =>
      models ? models.execute(name, values, cancellation, dispatch) : dispatch(name, values, cancellation))}));
  ctx.effect(() => async () => {
    await scheduler.dispose();
    await host.dispose();
  });
}
