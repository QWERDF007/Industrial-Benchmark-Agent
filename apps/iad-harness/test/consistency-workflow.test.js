import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFile,execFileSync} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';

const execute=promisify(execFile);
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('workflow CLI retrieves B/E/F, reads every image page and verifies only actual rescanned corrections',{timeout:60000},async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'iad-complete-workflow-'));
  const requests=[];
  const model=http.createServer(async(req,res)=>{
    if(req.method==='GET'){
      res.setHeader('Content-Type','application/json');
      return res.end(JSON.stringify({data:[{id:'local-workflow-model',max_model_len:262144}]}));
    }
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=JSON.parse(Buffer.concat(chunks));requests.push(body);
    const input=body.messages.filter(item=>item.role==='user').flatMap(item=>typeof item.content==='string' ? [item.content] : item.content.filter(block=>block.type==='text').map(block=>block.text)).join('\n');
    const reference=JSON.parse(input.split('一致性证据引用：')[1].split('\n')[0]);
    const contexts=body.messages.filter(item=>item.role==='tool').map(item=>JSON.parse(item.content.split('\n')[0]).context).filter(Boolean);
    const latest=contexts.at(-1);
    const args=!latest ? reference : latest.next_cursor ? {...reference,cursor:latest.next_cursor} : null;
    const delta=args ? {role:'assistant',tool_calls:[{index:0,id:'workflow-'+contexts.length,type:'function',function:{name:'consistency_context',arguments:JSON.stringify(args)}}]} : {role:'assistant',content:'B/E/F 是受控标注缺失，原像素完全相同。返回证据 '+reference.evidence_id};
    res.writeHead(200,{'Content-Type':'text/event-stream'});
    for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:args ? 'tool_calls' : 'stop'}])res.write('data: '+JSON.stringify({id:'workflow',object:'chat.completion.chunk',model:'local-workflow-model',choices:[choice]})+'\n\n');
    res.end('data: [DONE]\n\n');
  });
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));
  try{
    const image=path.join(root,'source.png');
    execFileSync(resolvePythonPath(),['-c',"from PIL import Image;import sys;Image.new('RGB',(222,415),(40,60,90)).save(sys.argv[1])",image]);
    const result=await execute(process.execPath,[path.join(app,'scripts/verify-consistency-session.js'),
      '--image',image,'--output',path.join(root,'output'),'--case','missing-instances','--verify-corrections'],
      {cwd:app,timeout:45000,env:{...process.env,IAD_PYTHON_PATH:resolvePythonPath(),LIVE_VLM_ENDPOINT:`http://127.0.0.1:${model.address().port}/v1`,LIVE_VLM_KEY:'synthetic-local-only'}});
    assert.equal(result.stderr,'');
    const report=JSON.parse(await fs.readFile(path.join(root,'output/result.json'),'utf8'));
    assert.deepEqual(report.missing_labels,['B','E','F']);
    assert.equal(report.retrieval.member_count,1);
    assert.equal(report.read_differences,3);assert.equal(report.remaining,0);
    assert.equal(report.correction.before,'AWAITING_RESCAN');
    assert.equal(report.correction.after,'VERIFIED');
    assert.equal(report.correction.remaining_differences,0);
    assert.equal(report.correction.proposal_preserved_source,true);
    assert.equal(report.correction.historical_evidence_unchanged,true);
    assert.equal(report.correction.raw_image_unchanged,true);
    assert.equal(report.correction.changed_source_path,path.join(root,'output/images/right.json'));
    assert.ok(requests.at(-1).messages.flatMap(item=>Array.isArray(item.content) ? item.content : []).some(block=>block.type==='image_url'));
  }finally{await new Promise(resolve=>model.close(resolve));await fs.rm(root,{recursive:true,force:true});}
});
