/**
 * IadRemoteService: Typert Remote Gateway Service for DSH Client-Host Communication (DS-S03, DSH-05).
 * Binds `ctx.remote.iad` directly to python -m iad_core.entry operations.
 */
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
let IadRemoteService = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _datasetList_decorators;
    let _datasetGet_decorators;
    let _datasetImport_decorators;
    let _datasetUpdate_decorators;
    let _datasetScan_decorators;
    let _sampleList_decorators;
    let _sampleGet_decorators;
    let _sampleImagePath_decorators;
    let _sampleThumbnail_decorators;
    let _auditStart_decorators;
    let _auditStatus_decorators;
    let _auditCancel_decorators;
    let _modelCallGet_decorators;
    let _reviewQueue_decorators;
    let _reviewEvidence_decorators;
    let _reviewSubmitDecision_decorators;
    let _reviewStats_decorators;
    let _reportGet_decorators;
    return class IadRemoteService extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _datasetList_decorators = [Remote];
            _datasetGet_decorators = [Remote];
            _datasetImport_decorators = [Remote];
            _datasetUpdate_decorators = [Remote];
            _datasetScan_decorators = [Remote];
            _sampleList_decorators = [Remote];
            _sampleGet_decorators = [Remote];
            _sampleImagePath_decorators = [Remote];
            _sampleThumbnail_decorators = [Remote];
            _auditStart_decorators = [Remote];
            _auditStatus_decorators = [Remote];
            _auditCancel_decorators = [Remote];
            _modelCallGet_decorators = [Remote];
            _reviewQueue_decorators = [Remote];
            _reviewEvidence_decorators = [Remote];
            _reviewSubmitDecision_decorators = [Remote];
            _reviewStats_decorators = [Remote];
            _reportGet_decorators = [Remote];
            __esDecorate(this, null, _datasetList_decorators, { kind: "method", name: "datasetList", static: false, private: false, access: { has: obj => "datasetList" in obj, get: obj => obj.datasetList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _datasetGet_decorators, { kind: "method", name: "datasetGet", static: false, private: false, access: { has: obj => "datasetGet" in obj, get: obj => obj.datasetGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _datasetImport_decorators, { kind: "method", name: "datasetImport", static: false, private: false, access: { has: obj => "datasetImport" in obj, get: obj => obj.datasetImport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _datasetUpdate_decorators, { kind: "method", name: "datasetUpdate", static: false, private: false, access: { has: obj => "datasetUpdate" in obj, get: obj => obj.datasetUpdate }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _datasetScan_decorators, { kind: "method", name: "datasetScan", static: false, private: false, access: { has: obj => "datasetScan" in obj, get: obj => obj.datasetScan }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sampleList_decorators, { kind: "method", name: "sampleList", static: false, private: false, access: { has: obj => "sampleList" in obj, get: obj => obj.sampleList }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sampleGet_decorators, { kind: "method", name: "sampleGet", static: false, private: false, access: { has: obj => "sampleGet" in obj, get: obj => obj.sampleGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sampleImagePath_decorators, { kind: "method", name: "sampleImagePath", static: false, private: false, access: { has: obj => "sampleImagePath" in obj, get: obj => obj.sampleImagePath }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sampleThumbnail_decorators, { kind: "method", name: "sampleThumbnail", static: false, private: false, access: { has: obj => "sampleThumbnail" in obj, get: obj => obj.sampleThumbnail }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _auditStart_decorators, { kind: "method", name: "auditStart", static: false, private: false, access: { has: obj => "auditStart" in obj, get: obj => obj.auditStart }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _auditStatus_decorators, { kind: "method", name: "auditStatus", static: false, private: false, access: { has: obj => "auditStatus" in obj, get: obj => obj.auditStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _auditCancel_decorators, { kind: "method", name: "auditCancel", static: false, private: false, access: { has: obj => "auditCancel" in obj, get: obj => obj.auditCancel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _modelCallGet_decorators, { kind: "method", name: "modelCallGet", static: false, private: false, access: { has: obj => "modelCallGet" in obj, get: obj => obj.modelCallGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reviewQueue_decorators, { kind: "method", name: "reviewQueue", static: false, private: false, access: { has: obj => "reviewQueue" in obj, get: obj => obj.reviewQueue }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reviewEvidence_decorators, { kind: "method", name: "reviewEvidence", static: false, private: false, access: { has: obj => "reviewEvidence" in obj, get: obj => obj.reviewEvidence }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reviewSubmitDecision_decorators, { kind: "method", name: "reviewSubmitDecision", static: false, private: false, access: { has: obj => "reviewSubmitDecision" in obj, get: obj => obj.reviewSubmitDecision }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reviewStats_decorators, { kind: "method", name: "reviewStats", static: false, private: false, access: { has: obj => "reviewStats" in obj, get: obj => obj.reviewStats }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportGet_decorators, { kind: "method", name: "reportGet", static: false, private: false, access: { has: obj => "reportGet" in obj, get: obj => obj.reportGet }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        bridge = __runInitializers(this, _instanceExtraInitializers);
        constructor(ctx, bridge) {
            super(ctx, "iad");
            this.bridge = bridge;
        }
        async datasetList(args = {}) {
            return this.bridge.execute("dataset_list", args);
        }
        async datasetGet(args) {
            return this.bridge.execute("dataset_get", args);
        }
        async datasetImport(args) {
            return this.bridge.execute("dataset_import", { ...args });
        }
        async datasetUpdate(args) {
            return this.bridge.execute("dataset_update", args);
        }
        async datasetScan(args) {
            return this.bridge.execute("dataset_scan", args);
        }
        async sampleList(args) {
            return this.bridge.execute("sample_list", args);
        }
        async sampleGet(args) {
            return this.bridge.execute("sample_get", args);
        }
        async sampleImagePath(args) {
            return this.bridge.execute("sample_image_path", args);
        }
        async sampleThumbnail(args) {
            return this.bridge.execute("sample_thumbnail", args);
        }
        async auditStart(args) {
            return this.bridge.execute("audit_start", { ...args });
        }
        async auditStatus(args) {
            return this.bridge.execute("audit_status", args);
        }
        async auditCancel(args) {
            return this.bridge.execute("audit_cancel", args);
        }
        async modelCallGet(args) {
            return this.bridge.execute("model_call_get", args);
        }
        async reviewQueue(args) {
            return this.bridge.execute("review_queue", args);
        }
        async reviewEvidence(args) {
            return this.bridge.execute("review_evidence", args);
        }
        async reviewSubmitDecision(args) {
            return this.bridge.execute("review_submit_decision", { ...args });
        }
        async reviewStats(args) {
            return this.bridge.execute("review_stats", args);
        }
        async reportGet(args) {
            return this.bridge.execute("report_get", args);
        }
    };
})();
export { IadRemoteService };
