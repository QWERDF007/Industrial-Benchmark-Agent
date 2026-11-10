import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {findWorkspaceRoot, resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('model orchestration can outlive the bridge deadline while retaining cancellation and progress', {timeout:30000}, async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-bridge-deadlines-'));
  const workspace=findWorkspaceRoot(), launcher=path.join(root,'python');
  await fs.writeFile(launcher,`#!${resolvePythonPath()}
import json,sys,time
for line in sys.stdin:
 request=json.loads(line)
 print(json.dumps(dict(event='progress',request_id=request['request_id'],status='working')),flush=True)
 time.sleep(request['arguments'].get('delay',0))
 print(json.dumps(dict(event='result',request_id=request['request_id'],data={'completed':True})),flush=True)
`,{mode:0o755});
  const modulePath=path.join(root,'bridge.mjs');
  await build({entryPoints:[path.join(workspace,'apps/iad-harness/src/server/python-bridge/index.ts')],
    outfile:modulePath,bundle:true,platform:'node',format:'esm',packages:'external'});
  const {PythonBridge}=await import(pathToFileURL(modulePath).href);
  const bridge=new PythonBridge({cwd:workspace,pythonPath:launcher,timeoutMs:300});
  try {
    assert.deepEqual(await bridge.execute('consistency_agent_observe',{delay:0}),{completed:true});
    await assert.rejects(bridge.execute('ordinary_operation',{delay:.5}),/timed out after 300ms/);
    const progress=[];
    assert.deepEqual(await bridge.execute('consistency_agent_observe',{delay:.5},undefined,
      {timeoutMs:0,onProgress:event=>progress.push(event.status)}),{completed:true});
    assert.deepEqual(progress,['working']);
    const controller=new AbortController();
    const aborted=bridge.execute('consistency_agent_observe',{delay:.5},controller.signal,
      {timeoutMs:0,onProgress:()=>controller.abort()});
    await assert.rejects(aborted,/aborted by caller/);
    assert.deepEqual(await bridge.execute('ordinary_operation',{delay:0},undefined,{timeoutMs:2000}),{completed:true});
  } finally {bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
