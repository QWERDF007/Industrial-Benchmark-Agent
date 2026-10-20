/**
 * IadRemoteService: Typert Remote Gateway Service for DSH Client-Host Communication (DS-S03, DSH-05).
 * Binds `ctx.remote.iad` directly to python -m iad_core.entry operations.
 */
import { Context } from "@deepseek-ai/cordis";
import { TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { PythonBridge } from "../python-bridge/index.js";
import type { AuditStartRequest, DatasetImportRequest, Filters, ReviewSubmission, ReviewHistoryQuery } from "../../shared/contracts.js";
export declare class IadRemoteService extends TypertRemoteService {
    readonly bridge: PythonBridge;
    constructor(ctx: Context, bridge: PythonBridge);
    datasetList(args?: any): Promise<any>;
    datasetGet(args: {
        dataset_id?: string;
        task_id?: string;
    }): Promise<any>;
    datasetImport(args: DatasetImportRequest): Promise<any>;
    datasetUpdate(args: {
        dataset_id: string;
        name?: string;
        reference_sample_ids?: string[];
        unannotated_is_normal?: boolean;
    }): Promise<any>;
    datasetScan(args: {
        config_path: string;
        task_id?: string;
    }): Promise<any>;
    sampleList(args: {
        task_id?: string;
        dataset_id?: string;
        page?: number;
        page_size?: number;
        sort_by?: string;
    } & Partial<Filters>): Promise<any>;
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
    auditStart(args: AuditStartRequest): Promise<any>;
    auditStatus(args: {
        run_id: string;
    }): Promise<any>;
    auditCancel(args: {
        run_id: string;
    }): Promise<any>;
    modelCallGet(args: {
        run_id: string;
        call_id: string;
    }): Promise<any>;
    reviewQueue(args: {
        task_id: string;
        page?: number;
        page_size?: number;
    }): Promise<any>;
    reviewEvidence(args: {
        task_id: string;
        sample_id: string;
    }): Promise<any>;
    reviewHistory(args: ReviewHistoryQuery): Promise<any>;
    reviewSubmitDecision(args: ReviewSubmission): Promise<any>;
    reviewStats(args: {
        task_id: string;
    }): Promise<any>;
    reportGet(args: {
        task_id: string;
    }): Promise<any>;
}
//# sourceMappingURL=index.d.ts.map