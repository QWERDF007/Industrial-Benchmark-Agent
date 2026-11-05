import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

test('real Python protocol preserves Chinese when a UTF-8 character spans pipe chunks',{timeout:30000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-bridge-unicode-'));
  const cwd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
  const launcher=path.join(root,'python');
  await fs.writeFile(launcher,`#!${resolvePythonPath()}
import runpy,sys,time
original=sys.stdout
class ChunkedOutput:
    def write(self,text):
        data=text.encode('utf-8')
        position=next((index for index,value in enumerate(data) if value>=192),None)
        if position is None:
            original.buffer.write(data)
        else:
            original.buffer.write(data[:position+1]);original.buffer.flush()
            time.sleep(.04)
            original.buffer.write(data[position+1:])
        original.buffer.flush()
        return len(text)
    def flush(self):
        original.flush()
sys.stdout=ChunkedOutput()
sys.argv=sys.argv[2:]
runpy.run_module('iad_core.entry',run_name='__main__')
`,{mode:0o755});
  const modulePath=path.join(root,'bridge.mjs');
  await build({entryPoints:[path.join(cwd,'apps/iad-harness/src/server/python-bridge/index.ts')],outfile:modulePath,
    bundle:true,platform:'node',format:'esm',packages:'external'});
  const {PythonBridge}=await import(pathToFileURL(modulePath).href);
  const bridge=new PythonBridge({cwd,pythonPath:launcher,dbPath:path.join(root,'test.db')});
  try{
    const name='实际中文与图像说明😀';
    const created=await bridge.execute('dataset_group_create',{name});
    assert.equal(created.name,name);
    const catalog=await bridge.execute('dataset_group_list',{});
    assert.equal(catalog.groups.find(group=>group.group_id===created.group_id).name,name);
  }finally{
    bridge.destroy();await fs.rm(root,{recursive:true,force:true});
  }
});
