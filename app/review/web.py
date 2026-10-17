import os
import json
import logging
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Optional, Dict, Any

from app.storage.database import Database
from app.review.service import ReviewQueueService
from app.review.schemas import ReviewDecisionType, ReasonCode

logger = logging.getLogger("iad_benchmark.review.web")


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Industrial AD Review Queue - {{TASK_ID}}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --success: #10b981;
      --purple: #8b5cf6;
      --danger: #ef4444;
      --warning: #f59e0b;
      --secondary: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    header {
      background: #111827;
      border-bottom: 1px solid var(--card-border);
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .header-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
    .header-badge { background: #374151; font-size: 12px; padding: 2px 8px; border-radius: 4px; color: #60a5fa; }
    .header-stats { display: flex; gap: 20px; font-size: 13px; color: var(--text-muted); }
    .stat-val { color: var(--text); font-weight: bold; }
    
    .main-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .col-left {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 12px;
      overflow-y: auto;
      border-right: 1px solid var(--card-border);
    }
    .col-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 16px;
      gap: 16px;
      overflow-y: auto;
      background: #131d31;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
    }

    .query-view-container {
      position: relative;
      background: #000;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 340px;
      max-height: 440px;
      overflow: hidden;
      border: 1px solid var(--card-border);
    }
    .query-img {
      max-width: 100%;
      max-height: 420px;
      object-fit: contain;
      display: block;
    }
    canvas#bbox-overlay {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }

    .score-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 8px;
    }
    .score-box {
      background: #0f172a;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #334155;
      text-align: center;
    }
    .score-label { font-size: 11px; color: var(--text-muted); }
    .score-number { font-size: 16px; font-weight: bold; color: #38bdf8; margin-top: 2px; }

    .meta-table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
    }
    .meta-table td { padding: 4px 6px; border-bottom: 1px solid #24324a; }
    .meta-label { color: var(--text-muted); width: 120px; }
    .meta-value { color: #f1f5f9; font-family: monospace; word-break: break-all; }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }
    .thumb-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      overflow: hidden;
      font-size: 11px;
      display: flex;
      flex-direction: column;
    }
    .thumb-card img {
      width: 100%;
      height: 95px;
      object-fit: cover;
      background: #000;
      cursor: pointer;
    }
    .thumb-meta {
      padding: 4px 6px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .sim-tag {
      font-weight: bold;
      color: #38bdf8;
    }
    .badge {
      display: inline-block;
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 10px;
      width: fit-content;
    }
    .badge-pass { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .badge-fail { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .badge-hard { background: rgba(139, 92, 246, 0.2); color: #a78bfa; }
    .badge-unc { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }

    footer {
      background: #111827;
      border-top: 1px solid var(--card-border);
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .decision-buttons {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }
    .btn-key {
      background: rgba(0,0,0,0.3);
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 11px;
    }
    .btn-pass { background: #059669; color: white; }
    .btn-pass:hover { background: #10b981; }
    .btn-hard { background: #7c3aed; color: white; }
    .btn-hard:hover { background: #8b5cf6; }
    .btn-fail { background: #dc2626; color: white; }
    .btn-fail:hover { background: #ef4444; }
    .btn-unc { background: #d97706; color: white; }
    .btn-unc:hover { background: #f59e0b; }
    .btn-skip { background: #475569; color: white; }
    .btn-skip:hover { background: #64748b; }

    .control-inputs {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    select, input[type="text"] {
      background: #1e293b;
      border: 1px solid #475569;
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 12px;
    }
    input[type="text"] { width: 220px; }
    select { width: 170px; }

    #loading-indicator {
      display: none;
      font-size: 12px;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-title">
      <span>Industrial AD Benchmark Review</span>
      <span class="header-badge">{{TASK_ID}}</span>
      <span id="loading-indicator">加载中...</span>
    </div>
    <div class="header-stats">
      <div>已审核: <span id="stat-reviewed" class="stat-val">-</span> / <span id="stat-total" class="stat-val">-</span></div>
      <div>待审核: <span id="stat-pending" class="stat-val">-</span></div>
      <div>高难良品: <span id="stat-hard" class="stat-val" style="color:#a78bfa">-</span></div>
      <div>缺陷: <span id="stat-fail" class="stat-val" style="color:#f87171">-</span></div>
      <div>产出率 (Yield): <span id="stat-yield" class="stat-val">-</span></div>
      <div>平均耗时: <span id="stat-time" class="stat-val">-</span></div>
    </div>
  </header>

  <div class="main-container">
    <!-- Left Column: Query Image & Signals -->
    <div class="col-left">
      <div class="card" style="padding: 8px;">
        <div class="card-title">
          <span>待审核样本 (Query Candidate)</span>
          <label style="font-size: 11px; cursor: pointer;">
            <input type="checkbox" id="toggle-bboxes" checked onchange="drawBBoxes()"> 显示标注框
          </label>
        </div>
        <div class="query-view-container">
          <img id="query-image" class="query-img" src="" alt="Query Image" onload="onImageLoaded()">
          <canvas id="bbox-overlay"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>综合评分与多维信号 (Candidate Score)</span>
          <span id="total-score-badge" style="color: #38bdf8; font-size: 14px; font-weight: bold;">Score: -</span>
        </div>
        <div class="score-grid">
          <div class="score-box">
            <div class="score-label">Normal Distance</div>
            <div id="sig-norm-dist" class="score-number">-</div>
          </div>
          <div class="score-box">
            <div class="score-label">Density Outlier</div>
            <div id="sig-density" class="score-number">-</div>
          </div>
          <div class="score-box">
            <div class="score-label">Domain Novelty</div>
            <div id="sig-domain" class="score-number">-</div>
          </div>
          <div class="score-box">
            <div class="score-label">Annotation Signal</div>
            <div id="sig-anno" class="score-number">-</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">元数据与上下文信息 (Metadata)</div>
        <table class="meta-table">
          <tr><td class="meta-label">Sample ID:</td><td id="meta-sample-id" class="meta-value">-</td></tr>
          <tr><td class="meta-label">Physical Sample:</td><td id="meta-physical-id" class="meta-value">-</td></tr>
          <tr><td class="meta-label">Batch / Domain:</td><td id="meta-batch-id" class="meta-value">-</td></tr>
          <tr><td class="meta-label">Data Origin:</td><td id="meta-origin" class="meta-value">-</td></tr>
          <tr><td class="meta-label">Original Quality:</td><td id="meta-quality" class="meta-value">-</td></tr>
          <tr><td class="meta-label">Image Resolution:</td><td id="meta-dim" class="meta-value">-</td></tr>
        </table>
      </div>
    </div>

    <!-- Right Column: Evidence Comparison -->
    <div class="col-right">
      <div class="card">
        <div class="card-title">最近良品基准 (Nearest Normal References)</div>
        <div id="normal-gallery" class="gallery-grid">
          <!-- Populated by JS -->
        </div>
      </div>

      <div class="card">
        <div class="card-title">最相似历史样本 (Similar History Neighbors)</div>
        <div id="history-gallery" class="gallery-grid">
          <!-- Populated by JS -->
        </div>
      </div>

      <div class="card" id="dup-card" style="display: none;">
        <div class="card-title" style="color: #fbbf24;">近重复群组证据 (Verified Duplicate Group)</div>
        <div id="dup-gallery" class="gallery-grid">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="control-inputs">
      <label style="font-size:12px; color:var(--text-muted);">原因分类:</label>
      <select id="reason-code">
        <option value="normal_nominal">正常/常规 (normal_nominal)</option>
        <option value="normal_color_shift" selected>高难正常/色差偏色 (normal_color_shift)</option>
        <option value="normal_position_shift">高难正常/位置偏移 (normal_position_shift)</option>
        <option value="normal_contamination">高难正常/轻微脏污 (normal_contamination)</option>
        <option value="normal_texture_variation">高难正常/纹理变化 (normal_texture_variation)</option>
        <option value="normal_illumination">高难正常/光照差异 (normal_illumination)</option>
        <option value="normal_other">高难正常/其他 (normal_other)</option>
        <option value="defect_confirmed">确认为缺陷 (defect_confirmed)</option>
        <option value="insufficient_evidence">证据不足 (insufficient_evidence)</option>
        <option value="data_issue">数据异常 (data_issue)</option>
      </select>
      <input type="text" id="review-comment" placeholder="输入评审备注 (可选)...">
      <span style="font-size:11px; color:var(--text-muted); margin-left: 10px;">耗时: <span id="timer-val">0.0</span>s</span>
    </div>

    <div class="decision-buttons">
      <button class="btn btn-pass" onclick="submitDecision('PASS')">
        <span class="btn-key">1</span> 良品 (PASS)
      </button>
      <button class="btn btn-hard" onclick="submitDecision('HARD_NORMAL')">
        <span class="btn-key">2</span> 高难良品 (HARD_NORMAL)
      </button>
      <button class="btn btn-fail" onclick="submitDecision('FAIL')">
        <span class="btn-key">3</span> 缺陷 (FAIL)
      </button>
      <button class="btn btn-unc" onclick="submitDecision('UNCERTAIN')">
        <span class="btn-key">4</span> 存疑 (UNCERTAIN)
      </button>
      <button class="btn btn-skip" onclick="submitDecision('SKIP')">
        <span class="btn-key">5</span> 跳过 (SKIP)
      </button>
    </div>
  </footer>

  <script>
    let currentEvidence = null;
    let startTime = Date.now();
    let timerInterval = null;
    const reviewSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    function formatTime(ms) {
      return (ms / 1000).toFixed(1);
    }

    function startTimer() {
      startTime = Date.now();
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        document.getElementById('timer-val').textContent = formatTime(elapsed);
      }, 100);
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/queue/stats');
        const data = await res.json();
        document.getElementById('stat-reviewed').textContent = data.reviewed_count.toLocaleString();
        document.getElementById('stat-total').textContent = data.total_candidates.toLocaleString();
        document.getElementById('stat-pending').textContent = data.pending_count.toLocaleString();
        document.getElementById('stat-hard').textContent = (data.decisions['HARD_NORMAL'] || 0).toLocaleString();
        document.getElementById('stat-fail').textContent = (data.decisions['FAIL'] || 0).toLocaleString();
        document.getElementById('stat-yield').textContent = (data.candidate_yield * 100).toFixed(1) + '%';
        document.getElementById('stat-time').textContent = (data.avg_duration_ms / 1000).toFixed(1) + 's';
      } catch (e) {
        console.error('Failed to load stats:', e);
      }
    }

    async function loadNextCandidate() {
      document.getElementById('loading-indicator').style.display = 'inline';
      try {
        const res = await fetch('/api/candidate/next');
        if (res.status === 404) {
          alert('当前队列所有候选已审核完毕！');
          document.getElementById('loading-indicator').style.display = 'none';
          return;
        }
        const evidence = await res.json();
        renderEvidence(evidence);
      } catch (e) {
        console.error('Error fetching candidate:', e);
      } finally {
        document.getElementById('loading-indicator').style.display = 'none';
      }
    }

    function renderEvidence(ev) {
      currentEvidence = ev;
      startTimer();

      // Query Image
      const imgEl = document.getElementById('query-image');
      imgEl.src = '/image?path=' + encodeURIComponent(ev.image_path);

      // Score
      document.getElementById('total-score-badge').textContent = 'Score: ' + ev.candidate_score.toFixed(4);
      document.getElementById('sig-norm-dist').textContent = ev.signals.normal_distance.toFixed(4);
      document.getElementById('sig-density').textContent = ev.signals.density_outlier.toFixed(4);
      document.getElementById('sig-domain').textContent = ev.signals.domain_novelty.toFixed(4);
      document.getElementById('sig-anno').textContent = ev.signals.annotation_signal.toFixed(4);

      // Metadata
      document.getElementById('meta-sample-id').textContent = ev.sample_id;
      document.getElementById('meta-physical-id').textContent = ev.metadata.physical_sample_id || '-';
      document.getElementById('meta-batch-id').textContent = ev.metadata.batch_id || '-';
      document.getElementById('meta-origin').textContent = ev.metadata.data_origin || '-';
      document.getElementById('meta-quality').textContent = ev.metadata.quality_status || '-';
      document.getElementById('meta-dim').textContent = `${ev.metadata.width || '?'} x ${ev.metadata.height || '?'}`;

      // Nearest Normal
      const normContainer = document.getElementById('normal-gallery');
      normContainer.innerHTML = '';
      if (ev.nearest_normal.length === 0) {
        normContainer.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:10px;">暂无可比正常基准</div>';
      } else {
        ev.nearest_normal.forEach(n => {
          const card = document.createElement('div');
          card.className = 'thumb-card';
          card.innerHTML = `
            <img src="/image?path=${encodeURIComponent(n.image_path)}" title="${n.sample_id}" onclick="window.open(this.src)">
            <div class="thumb-meta">
              <span class="sim-tag">Sim: ${(n.similarity * 100).toFixed(1)}%</span>
              <span class="badge badge-pass">${n.quality_status}</span>
              <span style="color:var(--text-muted);">${n.batch_id || '-'}</span>
            </div>
          `;
          normContainer.appendChild(card);
        });
      }

      // History Neighbors
      const histContainer = document.getElementById('history-gallery');
      histContainer.innerHTML = '';
      if (ev.nearest_neighbors.length === 0) {
        histContainer.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:10px;">暂无近邻样本</div>';
      } else {
        ev.nearest_neighbors.forEach(n => {
          const card = document.createElement('div');
          card.className = 'thumb-card';
          const qBadge = n.quality_status === 'PASS' ? 'badge-pass' : (n.quality_status === 'FAIL' ? 'badge-fail' : 'badge-unc');
          card.innerHTML = `
            <img src="/image?path=${encodeURIComponent(n.image_path)}" title="${n.sample_id}" onclick="window.open(this.src)">
            <div class="thumb-meta">
              <span class="sim-tag">Sim: ${(n.similarity * 100).toFixed(1)}%</span>
              <div><span class="badge ${qBadge}">${n.quality_status}</span></div>
              <span style="color:var(--text-muted);">${n.data_origin}</span>
            </div>
          `;
          histContainer.appendChild(card);
        });
      }

      // Verified Duplicates
      const dupCard = document.getElementById('dup-card');
      const dupContainer = document.getElementById('dup-gallery');
      dupContainer.innerHTML = '';
      if (ev.verified_duplicates && ev.verified_duplicates.length > 0) {
        dupCard.style.display = 'block';
        ev.verified_duplicates.forEach(d => {
          const card = document.createElement('div');
          card.className = 'thumb-card';
          card.innerHTML = `
            <img src="/image?path=${encodeURIComponent(d.image_path)}" title="${d.sample_id}" onclick="window.open(this.src)">
            <div class="thumb-meta">
              <span class="sim-tag">PixSim: ${(d.pixel_similarity * 100).toFixed(1)}%</span>
              <span class="badge badge-hard">${d.group_id}</span>
              <span style="color:var(--text-muted);">${d.data_origin}</span>
            </div>
          `;
          dupContainer.appendChild(card);
        });
      } else {
        dupCard.style.display = 'none';
      }

      // Clear comment
      document.getElementById('review-comment').value = '';
    }

    function onImageLoaded() {
      drawBBoxes();
    }

    function drawBBoxes() {
      const show = document.getElementById('toggle-bboxes').checked;
      const img = document.getElementById('query-image');
      const canvas = document.getElementById('bbox-overlay');
      if (!img || !canvas || !img.complete) return;

      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!show || !currentEvidence || !currentEvidence.annotations) return;

      const scaleX = canvas.width / (currentEvidence.metadata.width || 1);
      const scaleY = canvas.height / (currentEvidence.metadata.height || 1);

      currentEvidence.annotations.forEach(a => {
        if (!a.bbox_json) return;
        try {
          const bbox = JSON.parse(a.bbox_json); // [x1, y1, x2, y2]
          const x = bbox[0] * scaleX;
          const y = bbox[1] * scaleY;
          const w = (bbox[2] - bbox[0]) * scaleX;
          const h = (bbox[3] - bbox[1]) * scaleY;

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.fillRect(x, Math.max(0, y - 16), Math.max(60, ctx.measureText(a.raw_label).width + 8), 16);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.fillText(a.raw_label || a.phenomenon || 'box', x + 4, Math.max(12, y - 4));
        } catch(e) {}
      });
    }

    async function submitDecision(decision) {
      if (!currentEvidence) return;
      const durationMs = Date.now() - startTime;
      const startedAt = new Date(startTime).toISOString();
      const submittedAt = new Date().toISOString();
      const reasonCode = document.getElementById('reason-code').value;
      const comment = document.getElementById('review-comment').value.trim();

      const payload = {
        sample_id: currentEvidence.sample_id,
        decision: decision,
        reason_code: reasonCode,
        comment: comment || null,
        reviewer: 'reviewer_1',
        review_session_id: reviewSessionId,
        started_at: startedAt,
        submitted_at: submittedAt,
        duration_ms: durationMs
      };

      try {
        const res = await fetch('/api/review/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          await loadStats();
          await loadNextCandidate();
        } else {
          alert('保存审核结果失败！');
        }
      } catch (e) {
        console.error('Failed to submit decision:', e);
      }
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts if user is typing in comment input
      if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'text') {
        if (e.key === 'Enter') {
          // Default to HARD_NORMAL or current selected
          submitDecision('HARD_NORMAL');
        }
        return;
      }

      if (e.key === '1') submitDecision('PASS');
      else if (e.key === '2') submitDecision('HARD_NORMAL');
      else if (e.key === '3') submitDecision('FAIL');
      else if (e.key === '4') submitDecision('UNCERTAIN');
      else if (e.key === '5') submitDecision('SKIP');
    });

    window.addEventListener('resize', drawBBoxes);

    // Initial Load
    loadStats();
    loadNextCandidate();
  </script>
</body>
</html>
"""


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


class ReviewRequestHandler(BaseHTTPRequestHandler):
    task_id: str = ""
    service: Optional[ReviewQueueService] = None

    def log_message(self, format, *args):
        # Reduce log clutter
        pass

    def _send_json(self, data: Any, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message: str, status: int = 400):
        self._send_json({"error": message}, status=status)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Root: Serve HTML UI
        if path == "/" or path == "/index.html":
            html = HTML_TEMPLATE.replace("{{TASK_ID}}", self.task_id)
            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # 2. Stats
        if path == "/api/queue/stats":
            reviewer = query.get("reviewer", [None])[0]
            stats = self.service.get_stats(reviewer=reviewer)
            self._send_json(stats.model_dump())
            return

        # 3. Next Candidate Evidence
        if path == "/api/candidate/next":
            reviewer = query.get("reviewer", ["default"])[0]
            filter_domain = query.get("domain", [None])[0]
            filter_origin = query.get("origin", [None])[0]
            ev = self.service.get_next_pending(
                reviewer=reviewer,
                filter_domain=filter_domain,
                filter_origin=filter_origin,
            )
            if not ev:
                self._send_error("No pending candidates remaining in queue", status=404)
                return
            self._send_json(ev.model_dump())
            return

        # 4. Specific Sample Evidence
        if path.startswith("/api/candidate/") and path.endswith("/evidence"):
            sample_id = path[len("/api/candidate/") : -len("/evidence")]
            sample_id = urllib.parse.unquote(sample_id)
            try:
                ev = self.service.get_evidence(sample_id)
                self._send_json(ev.model_dump())
            except Exception as e:
                self._send_error(str(e), status=404)
            return

        # 5. Serve Image
        if path == "/image":
            img_paths = query.get("path", [])
            if not img_paths:
                self._send_error("Missing image path", status=400)
                return
            img_path = img_paths[0]
            if not os.path.exists(img_path):
                self._send_error("Image file not found", status=404)
                return

            ext = os.path.splitext(img_path)[1].lower()
            content_type = "image/png"
            if ext in [".jpg", ".jpeg"]:
                content_type = "image/jpeg"
            elif ext == ".bmp":
                content_type = "image/bmp"

            try:
                with open(img_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Cache-Control", "public, max-age=86400")
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self._send_error(f"Failed to read image: {e}", status=500)
            return

        self._send_error("Not found", status=404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # 1. Save Decision
        if path == "/api/review/decision":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.wfile.read(content_length) if content_length == 0 else self.rfile.read(content_length)
            try:
                data = json.loads(body_bytes.decode("utf-8"))
                sample_id = data["sample_id"]
                decision = ReviewDecisionType(data["decision"])
                reason_code = ReasonCode(data["reason_code"]) if data.get("reason_code") else None
                comment = data.get("comment")
                reviewer = data.get("reviewer", "default")
                review_session_id = data.get("review_session_id")
                started_at = data.get("started_at")
                submitted_at = data.get("submitted_at")
                duration_ms = int(data.get("duration_ms", 0))

                rec = self.service.save_decision(
                    sample_id=sample_id,
                    decision=decision,
                    reason_code=reason_code,
                    comment=comment,
                    reviewer=reviewer,
                    review_session_id=review_session_id,
                    started_at=started_at,
                    submitted_at=submitted_at,
                    duration_ms=duration_ms,
                )
                self._send_json(rec.model_dump())
            except Exception as e:
                self._send_error(f"Failed to save decision: {e}", status=400)
            return

        # 2. Skip
        if path == "/api/review/skip":
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            try:
                data = json.loads(body_bytes.decode("utf-8"))
                sample_id = data["sample_id"]
                reason = data.get("reason")
                reviewer = data.get("reviewer", "default")
                review_session_id = data.get("review_session_id")
                started_at = data.get("started_at")
                submitted_at = data.get("submitted_at")
                duration_ms = int(data.get("duration_ms", 0))

                rec = self.service.skip_sample(
                    sample_id=sample_id,
                    reason=reason,
                    reviewer=reviewer,
                    review_session_id=review_session_id,
                    started_at=started_at,
                    submitted_at=submitted_at,
                    duration_ms=duration_ms,
                )
                self._send_json(rec.model_dump())
            except Exception as e:
                self._send_error(f"Failed to skip candidate: {e}", status=400)
            return

        self._send_error("Not found", status=404)


def create_review_server(
    task_id: str,
    host: str = "127.0.0.1",
    port: int = 8000,
    db_path: str = "data/benchmark.db",
    candidates_json_path: Optional[str] = None,
) -> ThreadedHTTPServer:
    """
    Create a configured ThreadedHTTPServer for human review.
    """
    service = ReviewQueueService(
        task_id=task_id,
        db_path=db_path,
        candidates_json_path=candidates_json_path,
    )

    class CustomHandler(ReviewRequestHandler):
        pass

    CustomHandler.task_id = task_id
    CustomHandler.service = service

    server = ThreadedHTTPServer((host, port), CustomHandler)
    logger.info(f"Review UI server created on http://{host}:{port} for task '{task_id}'")
    return server
