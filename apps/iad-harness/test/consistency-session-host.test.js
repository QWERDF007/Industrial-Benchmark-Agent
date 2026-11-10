import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Context} from '@deepseek-ai/cordis';
import {SessionStore, SessionId} from '@deepseek-ai/dsh-session';
import {LlmAdapter, MessageId} from '@deepseek-ai/dsh-llm';
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl';
import {JobSessionHost} from '../lib/server/sessions/host.js';
import {imageSessionPath} from '../lib/server/sessions/image-path.js';

const locate = root => async id => imageSessionPath(root, {job_id: 'analysis_test', submitted_at: '2026-11-08T06:50:49.561969+00:00',
  image_name: '公头 - 副本.jpg', image_id: id});

test('session events use the job timestamp and image name in one uncompressed JSONL file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-session-layout-'));
  let host = await JobSessionHost.open(root, locate(root));
  try {
    await host.create('image-1');
    await host.notice('image-1', {type: 'iad/consistency', summary: '审核事实', value: {selected: 6}});
    const file = path.join(root, '2026-11-08T06-50-49.561Z', 'analysis_test', '公头 - 副本_image-1.jsonl');
    const records = (await fs.readFile(file, 'utf8')).trimEnd().split('\n').map(line => JSON.parse(line));
    assert.equal(records[0].id, 'image-1');
    assert.equal(records[1].type, 'iad/consistency');
    await host.dispose();
    host = await JobSessionHost.open(root, locate(root));
    await host.notice('image-1', {type: 'iad/consistency', summary: '审核提交', value: {state: 'COMPLETED'}});
    const stored = await host.read('image-1');
    assert.equal(stored.events.length, 2);
    assert.equal(await host.exportJsonl('image-1'), await fs.readFile(file, 'utf8'));
    assert.deepEqual(await fs.readdir(path.dirname(file)), ['公头 - 副本_image-1.jsonl']);
  } finally {
    await host.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('internal sessions survive reopening without appearing in the ordinary session store or persistence', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-sessions-'));
  const publicContext = new Context();
  const mountOrdinary = () => publicContext.plugin({apply: async ctx => {
    new SessionStore(ctx);
    await ctx.plugin(JsonlSessionPersistence, {root: path.join(root, 'ordinary')});
  }});
  let ordinary = await mountOrdinary();
  let host;
  try {
    const publicSession = publicContext.sessions.create(SessionId('ordinary'));
    const publicWriter = await publicContext.sessionPersistence.create(publicSession.header);
    publicSession.append('user/message', {id: MessageId('ordinary-input'), role: 'user', source: {kind: 'user'},
      content: [{type: 'text', text: '普通用户会话'}]}, {surfaceOp: 'append'});
    await publicContext.sessions.flush(publicSession);
    await publicWriter.close();
    host = await JobSessionHost.open(path.join(root, 'internal'), locate(path.join(root, 'internal')));
    await assert.rejects(host.withAgent('not-created', {}, () => {}), /会话缺失/);
    for (const anchor of ['A', 'B']) {
      await host.create('job-' + anchor);
      await host.notice('job-' + anchor, {type: 'iad/consistency', summary: 'rule-result', value: {anchor, reason: 'NO_CANDIDATES'}});
    }
    assert.deepEqual(publicContext.sessions.list().map(session => session.id), ['ordinary']);
    assert.equal(publicContext.sessions.get(SessionId('job-A')), undefined);
    assert.deepEqual((await publicContext.sessionPersistence.list()).map(item => item.header.id), ['ordinary']);
    await assert.rejects(publicContext.sessionPersistence.open(SessionId('job-A'), 'read'));
    await host.dispose();
    await ordinary.dispose();
    ordinary = await mountOrdinary();
    host = await JobSessionHost.open(path.join(root, 'internal'), locate(path.join(root, 'internal')));
    const publicReader = await publicContext.sessionPersistence.open(SessionId('ordinary'), 'read');
    try {
      assert.equal((await publicReader.read()).events[0].data.content[0].text, '普通用户会话');
    } finally {
      await publicReader.close();
    }
    for (const anchor of ['A', 'B']) {
      const stored = await host.read('job-' + anchor);
      assert.equal(stored.header.id, 'job-' + anchor);
      assert.equal(stored.events.length, 1);
      assert.deepEqual(stored.events[0].data.value, {anchor, reason: 'NO_CANDIDATES'});
    }
    await host.notice('job-A', {type: 'iad/consistency', summary: 'completion', value: {state: 'rule-completed'}});
    assert.deepEqual((await host.read('job-A')).events.map(event => event.type),
      ['iad/consistency', 'iad/consistency']);
    assert.equal((await host.read('job-B')).events.length, 1);
    assert.deepEqual(publicContext.sessions.list(), []);
    assert.deepEqual((await publicContext.sessionPersistence.list()).map(item => item.header.id), ['ordinary']);
    await assert.rejects(publicContext.sessionPersistence.open(SessionId('job-B'), 'read'));
  } finally {
    await host?.dispose();
    await ordinary.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('a persisted business notice can precede the Agent system prompt and survive native replay', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-consistency-prologue-'));
  const host = await JobSessionHost.open(root, locate(root));
  class Provider extends LlmAdapter {
    async *stream() {
      yield {type: 'block-start', index: 0, blockType: 'text'};
      yield {type: 'text-delta', index: 0, text: '审核完成'};
      yield {type: 'block-end', index: 0, block: {type: 'text', text: '审核完成'}};
      yield {type: 'finish', reason: {kind: 'stop'}};
    }
  }
  try {
    await host.create('anchor');
    await host.notice('anchor', {type: 'iad/consistency', summary: '冻结检索事实', value: {selected: ['candidate']}});
    await host.withAgent('anchor', {agentOptions: {provider: 'local', model: 'test'},
      setup: scope => {
        scope.llm.registerAdapter(['local'], new Provider());
        scope.systemPrompt.section({name: 'review', order: 100, text: '本场审核合同'});
      }}, async agent => {
        agent.followup({id: MessageId('review'), role: 'user', source: {kind: 'user'}, content: [{type: 'text', text: '审核主图'}]});
        await agent.whenIdle();
      });
    const persisted = await host.read('anchor');
    assert.equal(persisted.events.filter(event => event.type === 'assistant/message').length, 1);
    assert.equal(persisted.events.filter(event => event.type === 'iad/consistency' && event.ignorable === true).length, 1);
    await host.withAgent('anchor', {}, agent => {
      assert.ok(agent.session.deriveMessages().some(message => message.content.some?.(part => part.type === 'text' && part.text === '审核完成')));
    });
  } finally {
    await host.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});
