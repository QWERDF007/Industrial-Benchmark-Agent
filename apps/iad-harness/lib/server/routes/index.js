/**
 * DSH Native HTTP Route Handler for Industrial AD Benchmark (DS-S01, DS-S02, DS-S03, DS-S11, DS-S15).
 * Mounted directly into DSH WebServer (port 5173) under /api/iad/*.
 * Strictly isolated, safe, no external server or port 8000.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
function sendJson(res, statusCode, data) {
    const jsonStr = JSON.stringify(data);
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(jsonStr),
        "Cache-Control": "no-cache",
    });
    res.end(jsonStr);
}
function sendError(res, statusCode, message, details) {
    sendJson(res, statusCode, {
        error: {
            status_code: statusCode,
            message,
            details,
        },
    });
}
async function readBodyJson(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString("utf8");
            if (body.length > 10 * 1024 * 1024) {
                // 10MB limit for JSON bodies
                req.destroy(new Error("Request payload too large"));
            }
        });
        req.on("end", () => {
            if (!body.trim())
                return resolve({});
            try {
                resolve(JSON.parse(body));
            }
            catch (err) {
                reject(new Error(`Invalid JSON payload: ${err.message}`));
            }
        });
        req.on("error", reject);
    });
}
export function createIadHttpHandler(bridge) {
    return async function iadHttpHandler(req, res) {
        try {
            const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
            const pathname = parsedUrl.pathname.replace(/\/+$/, "");
            const method = (req.method || "GET").toUpperCase();
            // CORS headers for local development & LAN access
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            if (method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
            // 1. Generic RPC fallback: POST /api/iad/rpc
            if (pathname === "/api/iad/rpc" && method === "POST") {
                const payload = await readBodyJson(req);
                const { operation, arguments: args } = payload;
                if (!operation) {
                    sendError(res, 400, "Field 'operation' is required");
                    return;
                }
                const result = await bridge.execute(operation, args || {});
                sendJson(res, 200, { status: "OK", data: result });
                return;
            }
            // 2. Dataset list: GET /api/iad/tasks
            if (pathname === "/api/iad/tasks" && method === "GET") {
                const result = await bridge.execute("dataset_list");
                sendJson(res, 200, result);
                return;
            }
            // 3. Dataset detail: GET /api/iad/task/:taskId
            const taskDetailMatch = pathname.match(/^\/api\/iad\/task\/([^/?#]+)$/);
            if (taskDetailMatch && method === "GET") {
                const taskId = decodeURIComponent(taskDetailMatch[1]);
                const result = await bridge.execute("dataset_get", { task_id: taskId });
                sendJson(res, 200, result);
                return;
            }
            // 4. Sample list: GET /api/iad/samples/:taskId
            const samplesMatch = pathname.match(/^\/api\/iad\/samples\/([^/?#]+)$/);
            if (samplesMatch && method === "GET") {
                const taskId = decodeURIComponent(samplesMatch[1]);
                const page = parseInt(parsedUrl.searchParams.get("page") || "1", 10);
                const pageSize = parseInt(parsedUrl.searchParams.get("page_size") || "24", 10);
                const filter = parsedUrl.searchParams.get("filter") || "all";
                const sortBy = parsedUrl.searchParams.get("sort_by") || "default";
                const result = await bridge.execute("sample_list", {
                    task_id: taskId,
                    page,
                    page_size: pageSize,
                    filter,
                    sort_by: sortBy,
                });
                sendJson(res, 200, result);
                return;
            }
            // 5. Sample detail: GET /api/iad/sample/:sampleId
            const sampleMatch = pathname.match(/^\/api\/iad\/sample\/(.+)$/);
            if (sampleMatch && method === "GET") {
                const sampleId = decodeURIComponent(sampleMatch[1]);
                const result = await bridge.execute("sample_get", { sample_id: sampleId });
                sendJson(res, 200, result);
                return;
            }
            // 5b. Single-sample Multimodal Audit: POST /api/iad/sample/:sampleId/audit or POST /api/iad/audit/sample
            const sampleAuditMatch = pathname.match(/^\/api\/iad\/sample\/(.+)\/audit$/);
            if ((sampleAuditMatch && method === "POST") || (pathname === "/api/iad/audit/sample" && method === "POST")) {
                const payload = await readBodyJson(req);
                const sampleId = sampleAuditMatch ? decodeURIComponent(sampleAuditMatch[1]) : payload.sample_id;
                if (!sampleId) {
                    sendError(res, 400, "sample_id is required");
                    return;
                }
                const result = await bridge.execute("sample_audit", {
                    sample_id: sampleId,
                    model_name: payload.model_name || "Qwen/Qwen3.8-27B-FP8",
                });
                sendJson(res, 200, result);
                return;
            }
            // 6. Thumbnail delivery: GET /api/iad/media/sample/:taskId/:sampleId/thumbnail
            const thumbMatch = pathname.match(/^\/api\/iad\/media\/sample\/([^/?#]+)\/(.+)\/thumbnail$/);
            if (thumbMatch && method === "GET") {
                const sampleId = decodeURIComponent(thumbMatch[2]);
                const size = parseInt(parsedUrl.searchParams.get("size") || "240", 10);
                const thumbInfo = await bridge.execute("sample_thumbnail", { sample_id: sampleId, size });
                if (!fs.existsSync(thumbInfo.path)) {
                    sendError(res, 404, "Thumbnail file not found");
                    return;
                }
                const stat = await fsp.stat(thumbInfo.path);
                res.writeHead(200, {
                    "Content-Type": thumbInfo.media_type || "image/jpeg",
                    "Content-Length": stat.size,
                    "Cache-Control": "public, max-age=86400, immutable",
                });
                fs.createReadStream(thumbInfo.path).pipe(res);
                return;
            }
            // 7. Full Image delivery: GET /api/iad/media/sample/:taskId/:sampleId/image
            const imageMatch = pathname.match(/^\/api\/iad\/media\/sample\/([^/?#]+)\/(.+)\/image$/);
            if (imageMatch && method === "GET") {
                const taskId = decodeURIComponent(imageMatch[1]);
                const sampleId = decodeURIComponent(imageMatch[2]);
                const imageInfo = await bridge.execute("sample_image_path", { sample_id: sampleId });
                if (!fs.existsSync(imageInfo.path)) {
                    sendError(res, 404, "Image file not found");
                    return;
                }
                const stat = await fsp.stat(imageInfo.path);
                res.writeHead(200, {
                    "Content-Type": imageInfo.media_type || "image/jpeg",
                    "Content-Length": stat.size,
                    "Cache-Control": "public, max-age=3600",
                });
                fs.createReadStream(imageInfo.path).pipe(res);
                return;
            }
            // 8. Audit start: POST /api/iad/audit/start
            if (pathname === "/api/iad/audit/start" && method === "POST") {
                const payload = await readBodyJson(req);
                const { task_id, mode, model_name } = payload;
                const result = await bridge.execute("audit_start", {
                    task_id,
                    mode: mode || "HYBRID",
                    model_name: model_name || "Qwen/Qwen3.8-27B-FP8",
                });
                sendJson(res, 200, result);
                return;
            }
            // 9. Audit status: GET /api/iad/audit/status/:runId
            const auditStatusMatch = pathname.match(/^\/api\/iad\/audit\/status\/([^/?#]+)$/);
            if (auditStatusMatch && method === "GET") {
                const runId = decodeURIComponent(auditStatusMatch[1]);
                const result = await bridge.execute("audit_status", { run_id: runId });
                sendJson(res, 200, result);
                return;
            }
            // 10. Audit cancel: POST /api/iad/audit/cancel/:runId
            const auditCancelMatch = pathname.match(/^\/api\/iad\/audit\/cancel\/([^/?#]+)$/);
            if (auditCancelMatch && method === "POST") {
                const runId = decodeURIComponent(auditCancelMatch[1]);
                const result = await bridge.execute("audit_cancel", { run_id: runId });
                sendJson(res, 200, result);
                return;
            }
            // 11. Review submit: POST /api/iad/review/submit
            if (pathname === "/api/iad/review/submit" && method === "POST") {
                const payload = await readBodyJson(req);
                const result = await bridge.execute("review_submit_decision", payload);
                sendJson(res, 200, result);
                return;
            }
            // 11b. Review queue: GET /api/iad/review/:taskId/queue
            const revQueueMatch = pathname.match(/^\/api\/iad\/review\/([^/?#]+)\/queue$/);
            if (revQueueMatch && method === "GET") {
                const taskId = decodeURIComponent(revQueueMatch[1]);
                const page = parseInt(parsedUrl.searchParams.get("page") || "1", 10);
                const pageSize = parseInt(parsedUrl.searchParams.get("page_size") || "20", 10);
                const result = await bridge.execute("review_queue", { task_id: taskId, page, page_size: pageSize });
                sendJson(res, 200, result);
                return;
            }
            // 12. Review stats: GET /api/iad/review/stats/:taskId
            const revStatsMatch = pathname.match(/^\/api\/iad\/review\/stats\/([^/?#]+)$/);
            if (revStatsMatch && method === "GET") {
                const taskId = decodeURIComponent(revStatsMatch[1]);
                const result = await bridge.execute("review_stats", { task_id: taskId });
                sendJson(res, 200, result);
                return;
            }
            // 13. Audit report: GET /api/iad/report/:taskId
            const reportMatch = pathname.match(/^\/api\/iad\/report\/([^/?#]+)$/);
            if (reportMatch && method === "GET") {
                const taskId = decodeURIComponent(reportMatch[1]);
                const result = await bridge.execute("report_get", { task_id: taskId });
                sendJson(res, 200, result);
                return;
            }
            // 14. File Upload: POST /api/iad/upload (DS-S02, DS-S15)
            if (pathname === "/api/iad/upload" && method === "POST") {
                const taskId = parsedUrl.searchParams.get("task_id") || `upload_${Date.now()}`;
                const uploadId = `upl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
                const uploadDir = path.resolve(bridge.cwd, "data/uploads", uploadId);
                await fsp.mkdir(uploadDir, { recursive: true });
                // Save incoming binary body directly to a zip file or tar
                const rawFilePath = path.join(uploadDir, "upload.zip");
                const fileStream = fs.createWriteStream(rawFilePath);
                await new Promise((resolve, reject) => {
                    req.pipe(fileStream);
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                    req.on("error", reject);
                });
                // Generate synthetic or scanned dataset configuration
                const yamlConfigPath = path.join(uploadDir, "dataset_config.yaml");
                const yamlContent = `task_id: "${taskId}"\nproduct: "${taskId}"\nroot_dir: "${uploadDir}"\npatterns: ["*.png", "*.jpg", "*.jpeg"]\n`;
                await fsp.writeFile(yamlConfigPath, yamlContent, "utf8");
                // Execute dataset scan
                try {
                    const scanRes = await bridge.execute("dataset_scan", {
                        config_path: yamlConfigPath,
                        task_id: taskId,
                    });
                    sendJson(res, 200, {
                        status: "OK",
                        upload_id: uploadId,
                        task_id: taskId,
                        scan: scanRes,
                    });
                }
                catch (scanErr) {
                    sendError(res, 400, `Dataset scan failed: ${scanErr.message}`);
                }
                return;
            }
            // Route not found
            sendError(res, 404, `No IAD route matched ${method} ${pathname}`);
        }
        catch (err) {
            sendError(res, 500, `Internal IAD error: ${err.message}`, { stack: err.stack });
        }
    };
}
