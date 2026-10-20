/**
 * IadRemoteService: Typert Remote Gateway Service for DSH Client-Host Communication (DS-S03, DSH-05).
 * Binds `ctx.remote.iad` directly to python -m iad_core.entry operations.
 */

import { Context } from "@deepseek-ai/cordis";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { PythonBridge } from "../python-bridge/index.js";
import type { AuditStartRequest, DatasetImportRequest, Filters, ReviewSubmission } from "../../shared/contracts.js";

export class IadRemoteService extends TypertRemoteService {
  readonly bridge: PythonBridge;

  constructor(ctx: Context, bridge: PythonBridge) {
    super(ctx, "iad");
    this.bridge = bridge;
  }

  @Remote
  async datasetList(args: any = {}) {
    return this.bridge.execute("dataset_list", args);
  }

  @Remote
  async datasetGet(args: { dataset_id?: string; task_id?: string }) {
    return this.bridge.execute("dataset_get", args);
  }

  @Remote
  async datasetImport(args: DatasetImportRequest) {
    return this.bridge.execute("dataset_import", { ...args });
  }

  @Remote
  async datasetUpdate(args: { dataset_id: string; name?: string; reference_sample_ids?: string[]; unannotated_is_normal?: boolean }) {
    return this.bridge.execute("dataset_update", args);
  }

  @Remote
  async datasetScan(args: { config_path: string; task_id?: string }) {
    return this.bridge.execute("dataset_scan", args);
  }

  @Remote
  async sampleList(args: {
    task_id?: string;
    dataset_id?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
  } & Partial<Filters>) {
    return this.bridge.execute("sample_list", args);
  }

  @Remote
  async sampleGet(args: { sample_id: string }) {
    return this.bridge.execute("sample_get", args);
  }

  @Remote
  async sampleImagePath(args: { sample_id: string }) {
    return this.bridge.execute("sample_image_path", args);
  }

  @Remote
  async sampleThumbnail(args: { sample_id: string; size?: number }) {
    return this.bridge.execute("sample_thumbnail", args);
  }

  @Remote
  async auditStart(args: AuditStartRequest) {
    return this.bridge.execute("audit_start", { ...args });
  }

  @Remote
  async auditStatus(args: { run_id: string }) {
    return this.bridge.execute("audit_status", args);
  }

  @Remote
  async auditCancel(args: { run_id: string }) {
    return this.bridge.execute("audit_cancel", args);
  }

  @Remote
  async modelCallGet(args: { run_id: string; call_id: string }) {
    return this.bridge.execute("model_call_get", args);
  }

  @Remote
  async reviewQueue(args: { task_id: string; page?: number; page_size?: number }) {
    return this.bridge.execute("review_queue", args);
  }

  @Remote
  async reviewEvidence(args: { task_id: string; sample_id: string }) {
    return this.bridge.execute("review_evidence", args);
  }

  @Remote
  async reviewSubmitDecision(args: ReviewSubmission) {
    return this.bridge.execute("review_submit_decision", { ...args });
  }

  @Remote
  async reviewStats(args: { task_id: string }) {
    return this.bridge.execute("review_stats", args);
  }

  @Remote
  async reportGet(args: { task_id: string }) {
    return this.bridge.execute("report_get", args);
  }
}
