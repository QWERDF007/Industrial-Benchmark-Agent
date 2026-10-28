import type { Context } from '@deepseek-ai/cordis';
import { defineTool, type ToolExecution, type InferArgs } from '@deepseek-ai/dsh-tools';
import type { Session } from '@deepseek-ai/dsh-session';
import type { TemporaryImageRef } from '../../shared/domain.generated.js';
import { imageRetrieveParameters } from '../../shared/consistency.parameters.generated.js';
import type { PythonBridge } from '../python-bridge/index.js';
import { workbenchJsonOutput } from '../tool-output.js';

type RetrievalArguments = InferArgs<typeof imageRetrieveParameters>;

export class NativeImageQueries {
  private readonly active = new Map<Session, Set<Promise<unknown>>>();
  private readonly disposed = new WeakSet<Session>();

  constructor(private readonly bridge: PythonBridge, private readonly ctx: Context) {}

  async retrieve(request: RetrievalArguments, exec: ToolExecution) {
    const session = exec.agent?.session;
    if (session && this.disposed.has(session)) throw new Error('REFERENCE_NOT_FOUND: 会话已关闭');
    const work = this.query(request, exec);
    if (!session) return await work;
    const pending = this.active.get(session) ?? new Set();
    this.active.set(session, pending);
    pending.add(work);
    try { return await work; }
    finally {
      pending.delete(work);
      if (!pending.size) this.active.delete(session);
    }
  }

  private async query(request: RetrievalArguments, exec: ToolExecution) {
    const session = exec.agent?.session;
    const owner = session ? 'session:' + session.id : null;
    if (request.query.kind === 'temporary' && !request.query.image_ref.startsWith('image_')) {
      const reference = request.query.image_ref;
      const attachment = session?.deriveMessages().filter(message => message.role === 'user')
        .flatMap(message => message.content).find(block => block.type === 'image' && block.attachment.attachmentId === reference);
      if (!attachment || attachment.type !== 'image' || !owner) {
        throw new Error('REFERENCE_NOT_FOUND: 当前会话中没有该图像附件');
      }
      const stored = await this.ctx.attachments.readImage(attachment.attachment, exec.signal);
      exec.signal.throwIfAborted();
      const accepted = await this.bridge.execute<TemporaryImageRef>('temporary_image_accept', {
        data_base64: Buffer.from(stored.data).toString('base64'), owner_id: owner, source_ref: reference});
      exec.signal.throwIfAborted();
      request = {...request, query: {kind: 'temporary', image_ref: accepted.image_ref}};
    }
    return await this.bridge.execute('image_retrieve', {request, owner_id: owner}, exec.signal);
  }

  async dispose(session: Session) {
    this.disposed.add(session);
    await Promise.allSettled(this.active.get(session) ?? []);
    await this.bridge.execute('temporary_image_release_owner', {owner_id: 'session:' + session.id});
  }
}

export function createImageTools(queries: NativeImageQueries) {
  return [defineTool({name: 'image_retrieve',
    description: '检索当前样本或当前会话已上传图像。精确组完整核验且不受视觉Top-K截断；返回分支来源、三层覆盖及组/成员游标。临时图 image_ref 使用当前会话附件的 attachmentId 或先前返回的 image_ref，不接受文件路径。',
    parameters: imageRetrieveParameters, output: workbenchJsonOutput,
    execute: (args, exec) => queries.retrieve(args, exec)})];
}
