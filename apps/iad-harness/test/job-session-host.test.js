import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {LlmAdapter, MessageId} from '@deepseek-ai/dsh-llm';
import {JobSessionHost} from '../lib/server/sessions/host.js';

test('exploration and mining keep separate native Sessions across rounds and reopening in business output directories', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-job-sessions-'));
  const locate = async id => path.join(root, id.startsWith('exploration') ? 'exploration-sessions' : 'knowledge-sessions',
    '2026-11-08T06-50-49.561Z', id, 'session', 'events.jsonl');
  let host = await JobSessionHost.open(root, locate);
  const requests = [];
  class Provider extends LlmAdapter {
    async *stream(request) {
      requests.push(request);
      yield {type: 'block-start', index: 0, blockType: 'text'};
      yield {type: 'text-delta', index: 0, text: '已观察本轮原图'};
      yield {type: 'block-end', index: 0, block: {type: 'text', text: '已观察本轮原图'}};
      yield {type: 'finish', reason: {kind: 'stop'}};
    }
  }
  const setup = scope => {
    scope.llm.registerAdapter(['test'], new Provider());
    scope.systemPrompt.section({name: 'analysis', order: 100, text: '观察本场冻结清单，保留反例。'});
  };
  try {
    for (const id of ['exploration-A', 'knowledge-B']) {
      await host.create(id);
      await host.notice(id, {type: 'iad/job', summary: '本轮登记', value: {round: 1, subset_id: '甲'}});
      await host.withAgent(id, {agentOptions: {provider: 'test', model: 'fixture'}, setup}, async agent => {
        assert.equal(agent.session.deriveMessages().filter(message => message.role === 'user').length, 0);
        agent.followup({id: MessageId(id + '-1'), role: 'user', source: {kind: 'user'},
          content: [{type: 'text', text: id + ' 首轮目标：甲/同名.png'}]});
        await agent.whenIdle();
      });
    }
    await host.dispose();
    host = await JobSessionHost.open(root, locate);
    for (const id of ['exploration-A', 'knowledge-B']) {
      await host.withAgent(id, {agentOptions: {provider: 'test', model: 'fixture'}, setup}, async agent => {
        const users = agent.session.deriveMessages().filter(message => message.role === 'user');
        assert.equal(users.length, 1);
        assert.equal(users[0].content[0].text, id + ' 首轮目标：甲/同名.png');
        agent.followup({id: MessageId(id + '-2'), role: 'user', source: {kind: 'user'},
          content: [{type: 'text', text: id + ' 后续目标：乙/同名.png'}]});
        await agent.whenIdle();
      });
      const file = await locate(id);
      assert.equal(await host.exportJsonl(id), await fs.readFile(file, 'utf8'));
      const stored = await host.read(id);
      assert.equal(stored.header.id, id);
      assert.equal(stored.events.filter(event => event.type === 'user/message').length, 2);
      assert.equal(stored.events.filter(event => event.type === 'assistant/message').length, 2);
      assert.deepEqual(await fs.readdir(path.dirname(file)), ['events.jsonl']);
    }
    assert.equal(requests.length, 4);
  } finally {
    await host.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});
