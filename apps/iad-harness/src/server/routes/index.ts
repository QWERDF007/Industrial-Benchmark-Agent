import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import { PythonBridge } from "../python-bridge/index.js";
import { ImageHttpQueries } from '../images/http.js';
import {ConsistencyHttpQueries} from '../consistency/http.js';

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), "Cache-Control": "no-store" });
  res.end(body);
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw Object.assign(new Error("JSON body is too large"), { statusCode: 413 });
    chunks.push(Buffer.from(chunk));
  }
  const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected a JSON object");
  return body as Record<string, unknown>;
}

async function sendMedia(res: ServerResponse, info: { path: string; media_type: string }, immutable = false) {
  const stat = await fsp.stat(info.path);
  res.writeHead(200, { "Content-Type": info.media_type, "Content-Length": stat.size, "Cache-Control": immutable ? "private, max-age=31536000, immutable" : "private, max-age=60" });
  fs.createReadStream(info.path).on("error", () => res.destroy()).pipe(res);
}

export function createIadHttpHandler(bridge: PythonBridge) {
  const images = new ImageHttpQueries(bridge);
  const consistency = new ConsistencyHttpQueries(bridge);
  return async function iadHttpHandler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const pathname = url.pathname.replace(/\/+$/, "");
      const method = req.method || "GET";
      if (method === "OPTIONS") { res.writeHead(204); res.end(); return; }
      if (pathname === '/api/iad/images/temporary' && method === 'POST') {
        return sendJson(res, 200, await images.upload(req, res));
      }
      const temporary = pathname.match(/^\/api\/iad\/images\/temporary\/([^/]+)$/);
      if (temporary && method === 'DELETE') {
        return sendJson(res, 200, await images.release(req, res, decodeURIComponent(temporary[1])));
      }
      const query: Record<string, unknown> = Object.fromEntries(url.searchParams);
      for (const key of ["page", "page_size"]) {
        if (key in query) query[key] = Number(query[key]);
      }
      if (url.searchParams.has("raw_label_filters")) query.raw_label_filters = JSON.parse(url.searchParams.get("raw_label_filters")!);
      if (url.searchParams.has("annotation_filters")) query.annotation_filters = JSON.parse(url.searchParams.get("annotation_filters")!);
      const body = ["POST", "PATCH"].includes(method) ? await readJson(req) : {};
      const call = async (operation: string, args: Record<string, unknown> = {}) => {
        const data = await bridge.execute(operation, args);
        sendJson(res, 200, data);
      };
      const anchorMedia = pathname.match(/^\/api\/iad\/consistency\/checks\/([^/]+)\/anchors\/([^/]+)\/media\/([^/]+)$/);
      if(anchorMedia && method==='GET') {
        const media=await bridge.execute<{path:string;media_type:string}>('consistency_agent_media',{
          run_id:decodeURIComponent(anchorMedia[1]),anchor_id:decodeURIComponent(anchorMedia[2]),media_id:decodeURIComponent(anchorMedia[3])});
        return await sendMedia(res,media,true);
      }
      const anchorResult = pathname.match(/^\/api\/iad\/consistency\/checks\/([^/]+)\/anchors\/([^/]+)(?:\/(session\.jsonl|members|candidates|review|analysis|diagnostics))?$/);
      if (anchorResult && method === 'GET') {
        const run_id = decodeURIComponent(anchorResult[1]), anchor_id = decodeURIComponent(anchorResult[2]);
        if (anchorResult[3] === 'session.jsonl') return await consistency.session(res, run_id, anchor_id);
        return await call('consistency_agent_' + (anchorResult[3] || 'detail'), {run_id, anchor_id});
      }
      if (anchorResult?.[3] === 'review' && method === 'POST') {
        return await call('consistency_agent_review_submit', {run_id:decodeURIComponent(anchorResult[1]),
          anchor_id:decodeURIComponent(anchorResult[2]),request:body});
      }
      const check = pathname.match(/^\/api\/iad\/consistency\/checks\/([^/]+)\/(config|anchors|report|gallery|images|export\.jsonl)$/);
      if (check && method === 'GET') {
        const run_id = decodeURIComponent(check[1]);
        if (check[2] === 'export.jsonl') return await consistency.export(res, run_id);
        return await call('consistency_agent_' + (check[2] === 'config' ? 'snapshot' : check[2] === 'anchors' ? 'results' : check[2]), {...query, run_id});
      }
      if (pathname === "/api/iad/images/settings" && method === "GET") return await call("feature_settings_view");
      if(pathname==='/api/iad/images/index/prepare' && method==='POST')return await call('image_index_prepare',body);
      if(pathname==='/api/iad/consistency/start' && method==='POST')return await call('consistency_start',body);
      if(pathname==='/api/iad/consistency/query' && method==='POST')return await call('consistency_query',body);
      if(pathname==='/api/iad/consistency/report' && method==='POST')return await call('consistency_report',body);
      const savedReport=pathname.match(/^\/api\/iad\/consistency\/report\/([^/]+)$/);
      if(savedReport && method==='GET')return await call('consistency_report_saved',{query_id:decodeURIComponent(savedReport[1])});
      if(pathname==='/api/iad/consistency/gallery' && method==='POST')return await call('consistency_gallery',body);
      if(pathname==='/api/iad/consistency/gallery/members' && method==='POST')return await call('consistency_gallery_members',body);
      if(pathname==='/api/iad/consistency/gallery/analysis' && method==='POST')return await call('consistency_group_analysis',body);
      if (pathname === '/api/iad/analysis/start' && method === 'POST') return await call('analysis_start', {request:body});
      if (pathname === '/api/iad/analysis/jobs' && method === 'GET') return await call('analysis_list', query);
      if (pathname === '/api/iad/analysis/directions' && method === 'GET') return await call('analysis_direction_choices', {dataset_ids:JSON.parse(url.searchParams.get('dataset_ids') || '[]')});
      if (pathname === '/api/iad/analysis/sources' && method === 'GET') return await call('analysis_sources', {dataset_ids:JSON.parse(url.searchParams.get('dataset_ids') || '[]')});
      const publication = pathname.match(/^\/api\/iad\/analysis\/publications\/([^/]+)$/);
      if (publication && method === 'GET') return await call('analysis_publication', {version_id: decodeURIComponent(publication[1])});
      const analysisObservations=pathname.match(/^\/api\/iad\/analysis\/publications\/([^/]+)\/observations$/);
      if(analysisObservations&&method==='GET')return await call('analysis_observations',{
        version_id:decodeURIComponent(analysisObservations[1]),query});
      const analysisSampleEvidence=pathname.match(/^\/api\/iad\/analysis\/publications\/([^/]+)\/samples\/([^/]+)\/evidence$/);
      if(analysisSampleEvidence&&method==='GET')return await call('analysis_sample_evidence',{
        version_id:decodeURIComponent(analysisSampleEvidence[1]),sample_id:decodeURIComponent(analysisSampleEvidence[2])});
      const analysisExport=pathname.match(/^\/api\/iad\/analysis\/publications\/([^/]+)\/export$/);
      if(analysisExport&&method==='GET') {
        const artifact=await bridge.execute<{path:string}>('analysis_export',{version_id:decodeURIComponent(analysisExport[1])});
        res.setHeader('Content-Disposition',`attachment; filename="${decodeURIComponent(analysisExport[1])}.zip"`);
        return await sendMedia(res,{path:artifact.path,media_type:'application/zip'});
      }
      const analysisSession = pathname.match(/^\/api\/iad\/analysis\/session\/([^/]+)\.jsonl$/);
      if (analysisSession && method === 'GET') {
        const artifact = await bridge.execute<{filename: string; jsonl: string}>('analysis_agent_session_export', {run_id: decodeURIComponent(analysisSession[1])});
        res.writeHead(200, {'Content-Type': 'application/x-ndjson; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(artifact.filename)}`, 'Cache-Control': 'no-store'});
        res.end(artifact.jsonl);return;
      }
      const analysis = pathname.match(/^\/api\/iad\/analysis\/(status|node|results|cancel|retry|delete)\/([^/]+)$/);
      if (analysis && ((['status','node','results'].includes(analysis[1]) && method === 'GET') || (!['status','node','results'].includes(analysis[1]) && method === 'POST')))
        return await call('analysis_'+analysis[1], {run_id:decodeURIComponent(analysis[2])});
      const modelBatch=pathname.match(/^\/api\/iad\/consistency\/model-batches\/([^/]+)(?:\/(cancel))?$/);
      if(modelBatch && ((!modelBatch[2] && method==='GET') || (modelBatch[2] && method==='POST')))
        return await call('consistency_model_'+(modelBatch[2] || 'status'),{run_id:decodeURIComponent(modelBatch[1])});
      if(pathname==='/api/iad/consistency/context' && method==='POST')return await call('consistency_context',body);
      if(pathname==='/api/iad/consistency/review/context' && method==='POST')return await call('consistency_review_context',body);
      if(pathname==='/api/iad/consistency/review/submit' && method==='POST')return await call('consistency_review_submit',body);
      if(pathname==='/api/iad/consistency/review/verify' && method==='POST')return await call('consistency_correction_verify',body);
      if(pathname==='/api/iad/consistency/groups' && method==='POST')return await call('consistency_groups',body);
      if(pathname==='/api/iad/consistency/groups/members' && method==='POST')return await call('consistency_group_members',body);
      if(pathname==='/api/iad/consistency/runs' && method==='GET')return await call('consistency_list');
      const consistencyRun=pathname.match(/^\/api\/iad\/consistency\/runs\/([^/]+)(?:\/(cancel|retry|delete))?$/);
      if(consistencyRun){
        const batch_id=decodeURIComponent(consistencyRun[1]);
        if(!consistencyRun[2] && method==='GET')return await call('consistency_status',{batch_id});
        if((!consistencyRun[2] && method==='DELETE') || (consistencyRun[2]==='delete' && method==='POST'))return await call('consistency_delete',{batch_id});
        if(consistencyRun[2]==='cancel' && method==='POST')return await call('consistency_cancel',{batch_id});
        if(consistencyRun[2]==='retry' && method==='POST')return await call('consistency_retry',{...body,batch_id});
      }
      if (pathname==='/api/iad/consistency/compare' && method==='POST')return await call('consistency_compare',body);
      const consistencyEvidence=pathname.match(/^\/api\/iad\/consistency\/evidence\/([^/]+)(?:\/(export|media)(?:\/([^/]+))?)?$/);
      if(consistencyEvidence && method==='GET'){
        const reference={evidence_id:decodeURIComponent(consistencyEvidence[1])};
        if(!consistencyEvidence[2])return await call('consistency_evidence',reference);
        if(consistencyEvidence[2]==='export' && !consistencyEvidence[3]){
          const artifact=await bridge.execute<{path:string}>('consistency_evidence_export',reference);
          res.setHeader('Content-Disposition',`attachment; filename="${reference.evidence_id}.zip"`);
          return await sendMedia(res,{path:artifact.path,media_type:'application/zip'});
        }
        if(consistencyEvidence[2]==='media' && consistencyEvidence[3]){
          const media=await bridge.execute<{path:string;media_type:string}>('consistency_evidence_media',{...reference,media_id:decodeURIComponent(consistencyEvidence[3]),...(query.max_side===undefined ? {} : {max_side:Number(query.max_side)})});
          return await sendMedia(res,media,true);
        }
      }
      if (pathname === '/api/iad/images/retrieve' && method === 'POST') {
        return sendJson(res, 200, await images.retrieve(req, res, body));
      }
      if (pathname === "/api/iad/images/settings" && method === "POST") return await call("feature_settings_save", body);
      if (pathname === "/api/iad/images/settings/check" && method === "POST") return await call("feature_connection_check", body);
      if (pathname === "/api/iad/images/profiles" && method === "POST") return await call("feature_profile_create", body);
      const moduleSettings = pathname.match(/^\/api\/iad\/settings\/modules\/([^/]+)$/);
      if(moduleSettings && method==='GET')return await call('module_settings_get',{module:moduleSettings[1]});
      if(moduleSettings && method==='POST')return await call('module_settings_save',{...body,module:moduleSettings[1]});
      if (pathname === '/api/iad/models/providers' && method === 'GET') return await call('model_provider_list');
      if (pathname === "/api/iad/models/providers" && method === "POST") return await call("model_provider_save", body);
      if (pathname === "/api/iad/models/providers/discover" && method === "POST") return await call("model_provider_models", body);
      const provider = pathname.match(/^\/api\/iad\/models\/providers\/([^/]+)$/);
      if (provider && method === "DELETE") return await call("model_provider_delete", {provider_id: decodeURIComponent(provider[1]), expected_revision: Number(query.expected_revision)});
      if (pathname === "/api/iad/datasets/groups" && method === "GET") return await call("dataset_group_list");
      if (pathname === "/api/iad/datasets/groups" && method === "POST") return await call("dataset_group_create", body);
      const groupRoute = pathname.match(/^\/api\/iad\/datasets\/groups\/([^/]+)$/);
      if (groupRoute) {
        const group_id = decodeURIComponent(groupRoute[1]);
        if (method === "PATCH") return await call("dataset_group_update", { ...body, group_id });
        if (method === "DELETE") return await call("dataset_group_delete", { group_id, cascade: query.cascade !== "false" });
      }
      if (pathname === "/api/iad/datasets" && method === "GET") return await call("dataset_list");
      if (pathname === "/api/iad/review/knowledge" && method === "GET") return await call("knowledge_review_context", query);
      if (pathname === "/api/iad/review/knowledge" && method === "POST") return await call("knowledge_review_submit", body);
      if (pathname === "/api/iad/review/knowledge/queue" && method === "GET") return await call("knowledge_review_queue", query);
      if (pathname === "/api/iad/review/history" && method === "GET") return await call("review_history", query);
      if (pathname === "/api/iad/datasets/import" && method === "POST") return await call("dataset_import", body);
      if (pathname === "/api/iad/datasets/preview" && method === "POST") return await call("dataset_preview", body);
      const rescan = pathname.match(/^\/api\/iad\/datasets\/([^/]+)\/rescan$/);
      if (rescan && method === "POST") return await call("dataset_scan", { ...body, dataset_id: decodeURIComponent(rescan[1]) });
      if (pathname === "/api/iad/datasets/archive/inspect" && method === "POST") return await call("dataset_archive_inspect", body);
      if (pathname === "/api/iad/directories" && method === "GET") return await call("directory_list", query);
      const dataset = pathname.match(/^\/api\/iad\/datasets\/([^/]+)$/);
      if (dataset) {
        const args = { ...body, dataset_id: decodeURIComponent(dataset[1]) };
        if (method === "PATCH") return await call("dataset_update", args);
        if (method === "DELETE") return await call("dataset_delete", { dataset_id: args.dataset_id });
        if (method === "GET") return await call("dataset_get", { dataset_id: args.dataset_id });
      }
      if (pathname === "/api/iad/samples" && method === "GET") return await call("sample_list", query);
      const samples = pathname.match(/^\/api\/iad\/samples\/([^/]+)$/);
      if (samples && method === "GET") return await call("sample_list", { ...query, task_id: decodeURIComponent(samples[1]) });
      const sample = pathname.match(/^\/api\/iad\/sample\/(.+)$/);
      if (sample && method === "GET") return await call("sample_get", { sample_id: decodeURIComponent(sample[1]) });
      const media = pathname.match(/^\/api\/iad\/media\/sample\/([^/]+)\/(.+)\/(thumbnail|image|mask)$/);
      if (media && method === "GET") {
        const datasetId = decodeURIComponent(media[1]);
        const sampleId = decodeURIComponent(media[2]);
        const operations: Record<string, string> = { thumbnail: "sample_thumbnail", image: "sample_image_path", mask: "sample_mask_path" };
        const info = await bridge.execute<{ path: string; media_type: string }>(operations[media[3]],
          { dataset_id: datasetId, sample_id: sampleId, ...(media[3] === "thumbnail" ? { size: Number(query.size || 240) } : {}),
            ...(media[3] === "mask" ? { annotation_id: query.annotation_id, sha256: query.sha256 } : {}) });
        await sendMedia(res, info);
        return;
      }
      const evidence = pathname.match(/^\/api\/iad\/evidence\/([^/]+)\/([^/]+)$/);
      if (evidence && method === "GET") {
        const info = await bridge.execute<{ path: string; media_type: string }>("audit_evidence", { suggestion_id: decodeURIComponent(evidence[1]), evidence_id: decodeURIComponent(evidence[2]) });
        await sendMedia(res, info); return;
      }
      if (pathname === "/api/iad/audit/start" && method === "POST") return await call("audit_start", {request:body});
      if (pathname === '/api/iad/audit/sources' && method === 'GET') return await call('audit_sources', {
        dataset_ids: JSON.parse(url.searchParams.get('dataset_ids') || '[]'),
      });
      if (pathname === "/api/iad/inspection/context" && method === "POST") return await call("inspection_context", body);
      const modelCall = pathname.match(/^\/api\/iad\/jobs\/([^/]+)\/model-calls\/([^/]+)$/);
      if (modelCall && method === "GET") return await call("model_call_get", {
        run_id: decodeURIComponent(modelCall[1]), call_id: decodeURIComponent(modelCall[2]),
      });
      if (pathname === "/api/iad/audit/jobs" && method === "GET") return await call("audit_list", query);
      const auditSession = pathname.match(/^\/api\/iad\/audit\/jobs\/([^/]+)\/samples\/([^/]+)\/session\.jsonl$/);
      if(auditSession && method==='GET') {
        const output = await bridge.execute<{filename:string;jsonl:string}>('audit_agent_session_export',{
          run_id:decodeURIComponent(auditSession[1]),sample_id:decodeURIComponent(auditSession[2])});
        res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8',
          'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(output.filename)}`,'Cache-Control':'no-store'});
        res.end(output.jsonl);return;
      }
      const auditMedia = pathname.match(/^\/api\/iad\/audit\/jobs\/([^/]+)\/samples\/([^/]+)\/evidence\/([^/]+)$/);
      if(auditMedia && method==='GET') {
        return await sendMedia(res,await bridge.execute<{path:string;media_type:string}>('audit_evidence',{
          run_id:decodeURIComponent(auditMedia[1]),sample_id:decodeURIComponent(auditMedia[2]),evidence_id:decodeURIComponent(auditMedia[3])}),true);
      }
      const auditSample = pathname.match(/^\/api\/iad\/audit\/jobs\/([^/]+)\/samples\/([^/]+)$/);
      if (auditSample && method === 'GET') return await call('audit_job_sample', {
        run_id: decodeURIComponent(auditSample[1]), sample_id: decodeURIComponent(auditSample[2]),
      });
      const auditResults = pathname.match(/^\/api\/iad\/audit\/jobs\/([^/]+)\/(samples|report|export)$/);
      if (auditResults && method === 'GET') {
        const args = { ...query, run_id: decodeURIComponent(auditResults[1]) };
        if (auditResults[2] === 'export') {
          const output = await bridge.execute<{filename: string; html: string}>('audit_job_export', args);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(output.filename)}`,
            'Cache-Control': 'no-store' });
          res.end(output.html);
          return;
        }
        return await call(auditResults[2] === 'samples' ? 'audit_job_samples' : 'audit_job_report', args);
      }
      const retryOptions = pathname.match(/^\/api\/iad\/(audit)\/retry\/([^/]+)$/);
      if (retryOptions && method === "GET") return await call(retryOptions[1] + "_retry_options", { run_id: decodeURIComponent(retryOptions[2]) });
      const audit = pathname.match(/^\/api\/iad\/audit\/(status|cancel|retry)\/([^/]+)$/);
      if (audit && ((audit[1] === "status" && method === "GET") || (audit[1] !== "status" && method === "POST"))) return await call("audit_" + audit[1], { ...body, run_id: decodeURIComponent(audit[2]) });
      if (pathname === '/api/iad/exploration/directions/remove' && method === 'POST') return await call('direction_exploration_remove_direction', body);
      if (pathname === "/api/iad/exploration/presets" && method === "GET") return await call("direction_exploration_presets", query);
      if (pathname === "/api/iad/exploration/presets" && method === "POST") return await call("direction_exploration_preset_save", body);
      const explorationImage = pathname.match(/^\/api\/iad\/exploration\/evidence\/([^/]+)\/([^/]+)$/);
      if (explorationImage && method === "GET") {
        const info = await bridge.execute<{ path: string; media_type: string }>("direction_exploration_evidence", {
          version_id: decodeURIComponent(explorationImage[1]), evidence_id: decodeURIComponent(explorationImage[2]),
        });
        await sendMedia(res, info); return;
      }
      if (pathname === "/api/iad/knowledge" && method === "GET") return await call("knowledge_get", query);
      if (pathname === "/api/iad/knowledge/presets" && method === "GET") return await call("knowledge_presets", query);
      if (pathname === "/api/iad/knowledge/details" && method === "GET") return await call("knowledge_details", query);
      if (pathname === "/api/iad/knowledge/versions" && method === "GET") return await call("knowledge_versions", query);
      if (pathname === "/api/iad/knowledge/check-review" && method === "POST") return await call("knowledge_check_review", body);
      const removeCheck = pathname.match(/^\/api\/iad\/knowledge\/versions\/([^/]+)\/checks\/remove$/);
      if (removeCheck && method === "POST") return await call("knowledge_check_remove", { version_id: decodeURIComponent(removeCheck[1]), request: body });
      const knowledgeEvidence = pathname.match(/^\/api\/iad\/knowledge\/evidence\/([^/]+)\/([^/]+)$/);
      if (knowledgeEvidence && method === "GET") {
        const info = await bridge.execute<{ path: string; media_type: string }>("knowledge_evidence", {
          version_id: decodeURIComponent(knowledgeEvidence[1]), evidence_id: decodeURIComponent(knowledgeEvidence[2]),
        });
        await sendMedia(res, info); return;
      }
      if (pathname === "/api/iad/review/submit" && method === "POST") return await call("review_submit_decision", body);
      const queue = pathname.match(/^\/api\/iad\/review\/([^/]+)\/queue$/);
      if (queue && method === "GET") return await call("review_queue", { ...query, task_id: decodeURIComponent(queue[1]) });
      const stats = pathname.match(/^\/api\/iad\/review\/stats\/([^/]+)$/);
      if (stats && method === "GET") return await call("review_stats", { ...query, task_id: decodeURIComponent(stats[1]) });
      const report = pathname.match(/^\/api\/iad\/report\/([^/]+)$/);
      if (report && method === "GET") return await call("report_get", { ...query, task_id: decodeURIComponent(report[1]) });
      sendJson(res, 404, { error: { message: `No route for ${method} ${pathname}` } });
    } catch (error: unknown) {
      const err = error as Error & { code?: string; statusCode?: number; details?: { status_code?: number } };
      const status = err.details?.status_code || err.statusCode || (error instanceof SyntaxError ? 400 : 500);
      sendJson(res, status, { error: { ...(err.code ? { code: err.code } : {}), message: err.message } });
    }
  };
}
