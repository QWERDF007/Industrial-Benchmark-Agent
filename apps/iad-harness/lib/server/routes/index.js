import fs from "node:fs";
import fsp from "node:fs/promises";
import { ImageHttpQueries } from '../images/http.js';
function sendJson(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store" });
    res.end(body);
}
async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024)
            throw Object.assign(new Error("JSON body is too large"), { statusCode: 413 });
        chunks.push(Buffer.from(chunk));
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if (!body || typeof body !== "object" || Array.isArray(body))
        throw new Error("Expected a JSON object");
    return body;
}
async function sendMedia(res, info) {
    const stat = await fsp.stat(info.path);
    res.writeHead(200, { "Content-Type": info.media_type, "Content-Length": stat.size, "Cache-Control": "private, max-age=60" });
    fs.createReadStream(info.path).on("error", () => res.destroy()).pipe(res);
}
export function createIadHttpHandler(bridge) {
    const images = new ImageHttpQueries(bridge);
    return async function iadHttpHandler(req, res) {
        try {
            const url = new URL(req.url || "/", "http://localhost");
            const pathname = url.pathname.replace(/\/+$/, "");
            const method = req.method || "GET";
            if (method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
            if (pathname === '/api/iad/images/temporary' && method === 'POST') {
                return sendJson(res, 200, await images.upload(req, res));
            }
            const temporary = pathname.match(/^\/api\/iad\/images\/temporary\/([^/]+)$/);
            if (temporary && method === 'DELETE') {
                return sendJson(res, 200, await images.release(req, res, decodeURIComponent(temporary[1])));
            }
            const query = Object.fromEntries(url.searchParams);
            for (const key of ["page", "page_size"]) {
                if (key in query)
                    query[key] = Number(query[key]);
            }
            if (url.searchParams.has("raw_label_filters"))
                query.raw_label_filters = JSON.parse(url.searchParams.get("raw_label_filters"));
            if (url.searchParams.has("annotation_filters"))
                query.annotation_filters = JSON.parse(url.searchParams.get("annotation_filters"));
            const body = ["POST", "PATCH"].includes(method) ? await readJson(req) : {};
            const call = async (operation, args = {}) => {
                const data = await bridge.execute(operation, args);
                sendJson(res, 200, data);
            };
            if (pathname === "/api/iad/images/settings" && method === "GET")
                return await call("feature_settings_view");
            if (pathname === '/api/iad/images/index/prepare' && method === 'POST')
                return await call('image_index_prepare', body);
            if (pathname === '/api/iad/consistency/start' && method === 'POST')
                return await call('consistency_start', body);
            if (pathname === '/api/iad/consistency/query' && method === 'POST')
                return await call('consistency_query', body);
            if (pathname === '/api/iad/consistency/report' && method === 'POST')
                return await call('consistency_report', body);
            const savedReport = pathname.match(/^\/api\/iad\/consistency\/report\/([^/]+)$/);
            if (savedReport && method === 'GET')
                return await call('consistency_report_saved', { query_id: decodeURIComponent(savedReport[1]) });
            if (pathname === '/api/iad/consistency/gallery' && method === 'POST')
                return await call('consistency_gallery', body);
            if (pathname === '/api/iad/consistency/gallery/members' && method === 'POST')
                return await call('consistency_gallery_members', body);
            if (pathname === '/api/iad/consistency/gallery/analysis' && method === 'POST')
                return await call('consistency_group_analysis', body);
            if (pathname === '/api/iad/consistency/context' && method === 'POST')
                return await call('consistency_context', body);
            if (pathname === '/api/iad/consistency/review/context' && method === 'POST')
                return await call('consistency_review_context', body);
            if (pathname === '/api/iad/consistency/review/submit' && method === 'POST')
                return await call('consistency_review_submit', body);
            if (pathname === '/api/iad/consistency/review/verify' && method === 'POST')
                return await call('consistency_correction_verify', body);
            if (pathname === '/api/iad/consistency/groups' && method === 'POST')
                return await call('consistency_groups', body);
            if (pathname === '/api/iad/consistency/groups/members' && method === 'POST')
                return await call('consistency_group_members', body);
            if (pathname === '/api/iad/consistency/runs' && method === 'GET')
                return await call('consistency_list');
            const consistencyRun = pathname.match(/^\/api\/iad\/consistency\/runs\/([^/]+)(?:\/(cancel|retry))?$/);
            if (consistencyRun) {
                const batch_id = decodeURIComponent(consistencyRun[1]);
                if (!consistencyRun[2] && method === 'GET')
                    return await call('consistency_status', { batch_id });
                if (consistencyRun[2] === 'cancel' && method === 'POST')
                    return await call('consistency_cancel', { batch_id });
                if (consistencyRun[2] === 'retry' && method === 'POST')
                    return await call('consistency_retry', { ...body, batch_id });
            }
            if (pathname === '/api/iad/consistency/compare' && method === 'POST')
                return await call('consistency_compare', body);
            const consistencyEvidence = pathname.match(/^\/api\/iad\/consistency\/evidence\/([^/]+)(?:\/(export|media)(?:\/([^/]+))?)?$/);
            if (consistencyEvidence && method === 'GET') {
                const reference = { evidence_id: decodeURIComponent(consistencyEvidence[1]) };
                if (!consistencyEvidence[2])
                    return await call('consistency_evidence', reference);
                if (consistencyEvidence[2] === 'export' && !consistencyEvidence[3]) {
                    const artifact = await bridge.execute('consistency_evidence_export', reference);
                    res.setHeader('Content-Disposition', `attachment; filename="${reference.evidence_id}.zip"`);
                    return await sendMedia(res, { path: artifact.path, media_type: 'application/zip' });
                }
                if (consistencyEvidence[2] === 'media' && consistencyEvidence[3]) {
                    const media = await bridge.execute('consistency_evidence_media', { ...reference, media_id: decodeURIComponent(consistencyEvidence[3]) });
                    return await sendMedia(res, media);
                }
            }
            if (pathname === '/api/iad/images/retrieve' && method === 'POST') {
                return sendJson(res, 200, await images.retrieve(req, res, body));
            }
            if (pathname === "/api/iad/images/settings" && method === "POST")
                return await call("feature_settings_save", body);
            if (pathname === "/api/iad/images/settings/check" && method === "POST")
                return await call("feature_connection_check", body);
            if (pathname === "/api/iad/images/profiles" && method === "POST")
                return await call("feature_profile_create", body);
            if (pathname === "/api/iad/models" && method === "GET")
                return await call("model_settings_view");
            if (pathname === "/api/iad/models" && method === "POST")
                return await call("model_settings_save", body);
            if (pathname === "/api/iad/models/check" && method === "POST")
                return await call("model_connection_check", body);
            if (pathname === "/api/iad/models/providers" && method === "POST")
                return await call("model_provider_save", body);
            if (pathname === "/api/iad/models/providers/discover" && method === "POST")
                return await call("model_provider_models", body);
            const provider = pathname.match(/^\/api\/iad\/models\/providers\/([^/]+)$/);
            if (provider && method === "DELETE")
                return await call("model_provider_delete", { provider_id: decodeURIComponent(provider[1]), expected_revision: Number(query.expected_revision) });
            if (pathname === "/api/iad/datasets" && method === "GET")
                return await call("dataset_list");
            if (pathname === "/api/iad/review/knowledge" && method === "GET")
                return await call("knowledge_review_context", query);
            if (pathname === "/api/iad/review/knowledge" && method === "POST")
                return await call("knowledge_review_submit", body);
            if (pathname === "/api/iad/review/knowledge/queue" && method === "GET")
                return await call("knowledge_review_queue", query);
            if (pathname === "/api/iad/review/history" && method === "GET")
                return await call("review_history", query);
            if (pathname === "/api/iad/datasets/import" && method === "POST")
                return await call("dataset_import", body);
            if (pathname === "/api/iad/datasets/preview" && method === "POST")
                return await call("dataset_preview", body);
            const rescan = pathname.match(/^\/api\/iad\/datasets\/([^/]+)\/rescan$/);
            if (rescan && method === "POST")
                return await call("dataset_scan", { ...body, dataset_id: decodeURIComponent(rescan[1]) });
            if (pathname === "/api/iad/datasets/archive/inspect" && method === "POST")
                return await call("dataset_archive_inspect", body);
            if (pathname === "/api/iad/directories" && method === "GET")
                return await call("directory_list", query);
            const dataset = pathname.match(/^\/api\/iad\/datasets\/([^/]+)$/);
            if (dataset) {
                const args = { ...body, dataset_id: decodeURIComponent(dataset[1]) };
                if (method === "PATCH")
                    return await call("dataset_update", args);
                if (method === "DELETE")
                    return await call("dataset_delete", { dataset_id: args.dataset_id });
                if (method === "GET")
                    return await call("dataset_get", { dataset_id: args.dataset_id });
            }
            const samples = pathname.match(/^\/api\/iad\/samples\/([^/]+)$/);
            if (samples && method === "GET")
                return await call("sample_list", { ...query, task_id: decodeURIComponent(samples[1]) });
            const sample = pathname.match(/^\/api\/iad\/sample\/(.+)$/);
            if (sample && method === "GET")
                return await call("sample_get", { sample_id: decodeURIComponent(sample[1]) });
            const media = pathname.match(/^\/api\/iad\/media\/sample\/([^/]+)\/(.+)\/(thumbnail|image|mask)$/);
            if (media && method === "GET") {
                const sampleId = decodeURIComponent(media[2]);
                const operations = { thumbnail: "sample_thumbnail", image: "sample_image_path", mask: "sample_mask_path" };
                const info = await bridge.execute(operations[media[3]], { sample_id: sampleId, ...(media[3] === "thumbnail" ? { size: Number(query.size || 240) } : {}),
                    ...(media[3] === "mask" ? { annotation_id: query.annotation_id, sha256: query.sha256 } : {}) });
                await sendMedia(res, info);
                return;
            }
            const evidence = pathname.match(/^\/api\/iad\/evidence\/([^/]+)\/([^/]+)$/);
            if (evidence && method === "GET") {
                const info = await bridge.execute("audit_evidence", { suggestion_id: decodeURIComponent(evidence[1]), evidence_id: decodeURIComponent(evidence[2]) });
                await sendMedia(res, info);
                return;
            }
            if (pathname === "/api/iad/audit/start" && method === "POST")
                return await call("audit_start", body);
            if (pathname === "/api/iad/inspection/context" && method === "POST")
                return await call("inspection_context", body);
            const modelCall = pathname.match(/^\/api\/iad\/jobs\/([^/]+)\/model-calls\/([^/]+)$/);
            if (modelCall && method === "GET")
                return await call("model_call_get", {
                    run_id: decodeURIComponent(modelCall[1]), call_id: decodeURIComponent(modelCall[2]),
                });
            if (pathname === "/api/iad/audit/jobs" && method === "GET")
                return await call("audit_list", query);
            const retryOptions = pathname.match(/^\/api\/iad\/(audit|knowledge)\/retry\/([^/]+)$/);
            if (retryOptions && method === "GET")
                return await call(retryOptions[1] + "_retry_options", { run_id: decodeURIComponent(retryOptions[2]) });
            const audit = pathname.match(/^\/api\/iad\/audit\/(status|cancel|retry)\/([^/]+)$/);
            if (audit && ((audit[1] === "status" && method === "GET") || (audit[1] !== "status" && method === "POST")))
                return await call("audit_" + audit[1], { ...body, run_id: decodeURIComponent(audit[2]) });
            if (pathname === "/api/iad/knowledge/scopes/open" && method === "POST")
                return await call("knowledge_scope_open", { request: body });
            const scope = pathname.match(/^\/api\/iad\/knowledge\/scopes\/([^/]+)(?:\/(start|stop|resume))?$/);
            if (scope) {
                const scope_run_id = decodeURIComponent(scope[1]);
                if (!scope[2] && method === "GET")
                    return await call("knowledge_scope_get", { scope_run_id });
                if (scope[2] === "start" && method === "POST")
                    return await call("knowledge_start", { request: body, scope_run_id });
                if ((scope[2] === "stop" || scope[2] === "resume") && method === "POST")
                    return await call("knowledge_scope_" + scope[2], { scope_run_id });
            }
            if (pathname === "/api/iad/exploration" && method === "GET")
                return await call("direction_exploration_get", query);
            if (pathname === "/api/iad/exploration/presets" && method === "GET")
                return await call("direction_exploration_presets", query);
            if (pathname === "/api/iad/exploration/presets" && method === "POST")
                return await call("direction_exploration_preset_save", body);
            if (pathname === "/api/iad/exploration/start" && method === "POST")
                return await call("direction_exploration_start", { request: body });
            if (pathname === "/api/iad/exploration/jobs" && method === "GET")
                return await call("direction_exploration_list", query);
            const exploration = pathname.match(/^\/api\/iad\/exploration\/(status|cancel|retry)\/([^/]+)$/);
            if (exploration && ((exploration[1] === "status" && method === "GET") || (exploration[1] !== "status" && method === "POST")))
                return await call("direction_exploration_" + exploration[1], { run_id: decodeURIComponent(exploration[2]) });
            const explorationImage = pathname.match(/^\/api\/iad\/exploration\/evidence\/([^/]+)\/([^/]+)$/);
            if (explorationImage && method === "GET") {
                const info = await bridge.execute("direction_exploration_evidence", {
                    version_id: decodeURIComponent(explorationImage[1]), evidence_id: decodeURIComponent(explorationImage[2]),
                });
                await sendMedia(res, info);
                return;
            }
            if (pathname === "/api/iad/knowledge" && method === "GET")
                return await call("knowledge_get", query);
            if (pathname === "/api/iad/knowledge/prompt" && method === "GET")
                return await call("knowledge_prompt_get", query);
            if (pathname === "/api/iad/knowledge/prompt" && method === "POST")
                return await call("knowledge_prompt_save", body);
            if (pathname === "/api/iad/knowledge/details" && method === "GET")
                return await call("knowledge_details", query);
            if (pathname === "/api/iad/knowledge/sources" && method === "GET")
                return await call("knowledge_sources", query);
            if (pathname === "/api/iad/knowledge/start" && method === "POST")
                return await call("knowledge_start", { request: body });
            if (pathname === "/api/iad/knowledge/jobs" && method === "GET")
                return await call("knowledge_list", query);
            const knowledgeJob = pathname.match(/^\/api\/iad\/knowledge\/jobs\/([^/]+)$/);
            if (knowledgeJob && method === "DELETE")
                return await call("knowledge_job_delete", { run_id: decodeURIComponent(knowledgeJob[1]) });
            const removeCheck = pathname.match(/^\/api\/iad\/knowledge\/versions\/([^/]+)\/checks\/remove$/);
            if (removeCheck && method === "POST")
                return await call("knowledge_check_remove", { version_id: decodeURIComponent(removeCheck[1]), request: body });
            const knowledge = pathname.match(/^\/api\/iad\/knowledge\/(status|cancel|retry)\/([^/]+)$/);
            if (knowledge && ((knowledge[1] === "status" && method === "GET") || (knowledge[1] !== "status" && method === "POST"))) {
                return await call("knowledge_" + knowledge[1], { ...body, run_id: decodeURIComponent(knowledge[2]) });
            }
            const observations = pathname.match(/^\/api\/iad\/knowledge\/observations\/([^/]+)(?:\/evidence\/([^/]+))?$/);
            if (observations && method === "GET") {
                const run_id = decodeURIComponent(observations[1]);
                if (!observations[2])
                    return await call("knowledge_observations", { ...query, run_id });
                const info = await bridge.execute("knowledge_evidence", { run_id, evidence_id: decodeURIComponent(observations[2]) });
                await sendMedia(res, info);
                return;
            }
            const knowledgeEvidence = pathname.match(/^\/api\/iad\/knowledge\/evidence\/([^/]+)\/([^/]+)$/);
            if (knowledgeEvidence && method === "GET") {
                const info = await bridge.execute("knowledge_evidence", {
                    version_id: decodeURIComponent(knowledgeEvidence[1]), evidence_id: decodeURIComponent(knowledgeEvidence[2]),
                });
                await sendMedia(res, info);
                return;
            }
            if (pathname === "/api/iad/review/submit" && method === "POST")
                return await call("review_submit_decision", body);
            const queue = pathname.match(/^\/api\/iad\/review\/([^/]+)\/queue$/);
            if (queue && method === "GET")
                return await call("review_queue", { ...query, task_id: decodeURIComponent(queue[1]) });
            const stats = pathname.match(/^\/api\/iad\/review\/stats\/([^/]+)$/);
            if (stats && method === "GET")
                return await call("review_stats", { ...query, task_id: decodeURIComponent(stats[1]) });
            const report = pathname.match(/^\/api\/iad\/report\/([^/]+)$/);
            if (report && method === "GET")
                return await call("report_get", { ...query, task_id: decodeURIComponent(report[1]) });
            sendJson(res, 404, { error: { message: `No route for ${method} ${pathname}` } });
        }
        catch (error) {
            const err = error;
            const status = err.details?.status_code || err.statusCode || (error instanceof SyntaxError ? 400 : 500);
            sendJson(res, status, { error: { ...(err.code ? { code: err.code } : {}), message: err.message } });
        }
    };
}
