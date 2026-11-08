import type { Context } from '@deepseek-ai/cordis';
import { SessionId, type SessionHeader } from '@deepseek-ai/dsh-session';
import { SessionPersistence, SessionPersistenceRevision, type SessionHandle, type SessionAccess, type SessionPersistenceCreateOptions, type SessionPersistenceOpenOptions } from '@deepseek-ai/dsh-session-persistence';
import type { ConsistencySessionLocation } from '../../shared/domain.generated.js';
export type SessionLocator = (id: string) => Promise<ConsistencySessionLocation>;
export declare function consistencySessionPath(root: string, location: ConsistencySessionLocation): string;
export declare class ConsistencySessionPersistence extends SessionPersistence {
    private readonly root;
    private readonly locate;
    private readonly handles;
    private readonly writers;
    constructor(ctx: Context, root: string, locate: SessionLocator);
    create(header: SessionHeader, options?: SessionPersistenceCreateOptions): Promise<SessionHandle>;
    open(id: SessionId, access: SessionAccess, options?: SessionPersistenceOpenOptions): Promise<SessionHandle>;
    flush(): Promise<void>;
    stat(id: SessionId, options?: {
        signal?: AbortSignal;
    }): Promise<{
        header: SessionHeader;
        sizeBytes: number;
        revision: SessionPersistenceRevision;
    } | undefined>;
    list(options?: {
        signal?: AbortSignal;
    }): Promise<{
        header: SessionHeader;
        sizeBytes: number;
        revision: SessionPersistenceRevision;
    }[]>;
}
//# sourceMappingURL=session-persistence.d.ts.map