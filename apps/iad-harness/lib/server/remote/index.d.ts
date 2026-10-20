/**
 * IadRemoteService: Typert Remote Gateway Service for DSH Client-Host Communication (DS-S03, DSH-05).
 * Binds `ctx.remote.iad` directly to python -m iad_core.entry operations.
 */
import { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { PythonBridge } from "../python-bridge/index.js";
export declare class IadRemoteService extends TypertRemoteService {
    readonly bridge: PythonBridge;
    constructor(ctx: Context, bridge: PythonBridge);
    datasetList(args?: any): Promise<any>;
    datasetGet(args: {
        task_id: string;
    }): Promise<any>;
    datasetScan(args: {
        config_path: string;
        task_id?: string;
    }): Promise<any>;
    sampleList(args: {
        task_id: string;
        page?: number;
        page_size?: number;
        filter?: string;
        sort_by?: string;
    }): Promise<any>;
    sampleGet(args: {
        sample_id: string;
    }): Promise<any>;
    sampleImagePath(args: {
        sample_id: string;
    }): Promise<any>;
    sampleThumbnail(args: {
        sample_id: string;
        size?: number;
    }): Promise<any>;
    auditStart(args: {
        task_id: string;
        mode?: string;
        model_name?: string;
    }): Promise<any>;
    auditStatus(args: {
        run_id: string;
    }): Promise<any>;
    auditCancel(args: {
        run_id: string;
    }): Promise<any>;
    reviewQueue(args: {
        task_id: string;
        limit?: number;
        offset?: number;
    }): Promise<any>;
    reviewEvidence(args: {
        sample_id: string;
    }): Promise<any>;
    reviewStartSession(args: {
        reviewer: string;
        task_id: string;
        goal?: string;
    }): Promise<any>;
    reviewSubmitDecision(args: {
        session_id: string;
        sample_id: string;
        decision: "PASS" | "FAIL" | "UNCERTAIN";
        reason?: string;
        reviewer?: string;
    }): Promise<any>;
    reviewFinishSession(args: {
        session_id: string;
    }): Promise<any>;
    reviewStats(args: {
        task_id: string;
    }): Promise<any>;
    reportGet(args: {
        task_id: string;
    }): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map