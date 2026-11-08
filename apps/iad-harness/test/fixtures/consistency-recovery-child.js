import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import {createConsistencyAgentHost} from './consistency-agent-host.js';
import {PythonBridge, findWorkspaceRoot} from '../../lib/server/python-bridge/index.js';
import {ConsistencySessionHost} from '../../lib/server/consistency/session-host.js';
import {ConsistencyAnchorReviewer} from '../../lib/server/consistency/anchor-reviewer.js';
import {ConsistencyCheckScheduler} from '../../lib/server/consistency/scheduler.js';
import {NativeProviders} from '../../lib/server/models/providers.js';

const [mode, root, runId, anchorId] = process.argv.slice(2);
if (mode === 'commit') {
  let fixture;
  fixture = await createConsistencyAgentHost({afterSubmission: async identity => {
    const detail = await fixture.bridge.execute('consistency_agent_detail', identity);
    const status = await fixture.bridge.execute('analysis_status', {run_id: identity.run_id});
    const snapshot = await fixture.bridge.execute('consistency_agent_snapshot', identity);
    process.send({root: fixture.root, run_id: identity.run_id, anchor_id: identity.anchor_id,
      detail, calls: status.model_calls, snapshot});
    await new Promise(() => {});
  }});
  await fixture.scheduler.start({submission_id: randomUUID(), dataset_ids: [fixture.datasetId], mode: 'exact',
    subjects: {kind: 'samples', sample_ids: [fixture.datasetId + ':A.png']}});
  await fixture.scheduler.whenIdle();
} else if (mode === 'recover') {
  const bridge = new PythonBridge({cwd: findWorkspaceRoot(), dbPath: path.join(root, 'checks.db')});
  const host = await ConsistencySessionHost.open(path.join(root, 'sessions'),
    session_id => bridge.execute('consistency_agent_session_location', {session_id}));
  const ctx = new Context();
  const providers = new NativeProviders(() => ctx);
  const reviewer = new ConsistencyAnchorReviewer(bridge, host, providers);
  const errors = [];
  const scheduler = new ConsistencyCheckScheduler(bridge, host, providers, task => reviewer.review(task), error => errors.push(String(error)));
  try {
    const module = await bridge.execute('module_settings_get', {module: 'consistency'});
    await bridge.execute('module_settings_save', {module: 'consistency', expected_revision: module.revision,
      settings: {model: null, agent_model: null, max_exact_candidates: 1}});
    await scheduler.resume(runId);await scheduler.whenIdle();
    await scheduler.resume(runId);await scheduler.whenIdle();
    process.send({detail: await bridge.execute('consistency_agent_detail', {run_id: runId, anchor_id: anchorId}),
      status: await bridge.execute('analysis_status', {run_id: runId}),
      snapshot: await bridge.execute('consistency_agent_snapshot', {run_id: runId}),
      jsonl: await host.exportJsonl((await bridge.execute('consistency_agent_anchor', {run_id: runId, anchor_id: anchorId})).session_id), errors});
  } finally {
    await scheduler.dispose();bridge.destroy();await host.dispose();
  }
} else throw new Error('Unknown recovery phase');
