import fs from "node:fs";
import fsp from "node:fs/promises";
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
            if (pathname === "/api/iad/datasets" && method === "GET")
                return await call("dataset_list");
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
            if (pathname === "/api/iad/knowledge" && method === "GET")
                return await call("knowledge_get", query);
            if (pathname === "/api/iad/knowledge/sources" && method === "GET")
                return await call("knowledge_sources", query);
            if (pathname === "/api/iad/knowledge/start" && method === "POST")
                return await call("knowledge_start", body);
            if (pathname === "/api/iad/knowledge/jobs" && method === "GET")
                return await call("knowledge_list", query);
            const knowledge = pathname.match(/^\/api\/iad\/knowledge\/(status|cancel|retry)\/([^/]+)$/);
            if (knowledge && ((knowledge[1] === "status" && method === "GET") || (knowledge[1] !== "status" && method === "POST"))) {
                return await call("knowledge_" + knowledge[1], { ...body, run_id: decodeURIComponent(knowledge[2]) });
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
            sendJson(res, status, { error: { message: err.message } });
        }
    };
}
