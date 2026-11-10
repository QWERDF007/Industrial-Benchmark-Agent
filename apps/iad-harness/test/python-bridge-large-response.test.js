import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {createHash} from 'node:crypto';
import {findWorkspaceRoot,resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('a report sized Python response preserves every byte and releases subsequent queries within the request deadline',{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-bridge-large-report-'));
  const workspace=findWorkspaceRoot(),launcher=path.join(root,'python');
  await fs.writeFile(launcher,`#!${resolvePythonPath()}
import hashlib,json,sys
html='<html>'+('a'*512+'原图观察😀')*65536+'</html>'
for line in sys.stdin:
 request=json.loads(line)
 data={'html':html,'sha256':hashlib.sha256(html.encode()).hexdigest()} if request['operation']=='audit_job_export' else {'groups':[]}
 sys.stdout.write(json.dumps(dict(event='result',request_id=request['request_id'],data=data),ensure_ascii=False)+'\\n')
 sys.stdout.flush()
`,{mode:0o755});
  const modulePath=path.join(root,'bridge.mjs');
  await build({entryPoints:[path.join(workspace,'apps/iad-harness/src/server/python-bridge/index.ts')],outfile:modulePath,
    bundle:true,platform:'node',format:'esm',packages:'external'});
  const {PythonBridge}=await import(pathToFileURL(modulePath).href);
  const bridge=new PythonBridge({cwd:workspace,pythonPath:launcher,timeoutMs:10000});
  try{
    const [report,following]=await Promise.all([bridge.execute('audit_job_export',{run_id:'frozen-report'}),bridge.execute('dataset_group_list',{})]);
    assert.equal(report.html.length,518*65536+13);
    assert.ok(report.html.endsWith('原图观察😀</html>'));
    assert.equal(createHash('sha256').update(report.html).digest('hex'),report.sha256);
    assert.deepEqual(following,{groups:[]});
    assert.deepEqual(await bridge.execute('dataset_group_list',{}),{groups:[]});
  }finally{bridge.destroy();await fs.rm(root,{recursive:true,force:true});}
});
