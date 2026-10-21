import React, { useEffect, useState } from "react";
import type { ReviewHistoryPage } from "../../shared/contracts.js";
import { message, request, reviewLabel } from "../api.js";
import { Pagination, pageSize } from "./Pagination.js";

export function ReviewRecords({ datasetId, page, search, selected, revision, onPage, onSearch, onSelect }: {
  datasetId: string; page: number; search: string; selected: string; revision: number;
  onPage(page: number): void; onSearch(search: string): void; onSelect(sampleId: string): void;
}) {
  const [result, setResult] = useState<ReviewHistoryPage | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    const query = new URLSearchParams({ dataset_id: datasetId, page: String(page), page_size: String(pageSize), search });
    request<ReviewHistoryPage>(`/review/history?${query}`, undefined, undefined, controller.signal).then(result => {
      if (!controller.signal.aborted) setResult(result);
    }).catch(error => { if (!controller.signal.aborted) setError(message(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [datasetId, page, search, revision, retry]);
  const pagination = result && <Pagination total={result.total} page={page} unit="条记录" onPage={onPage} />;
  return <section className="iad-review-records" aria-label="复核记录">
    <label className="iad-field">搜索复核记录<input aria-label="搜索复核记录" placeholder="图像名、复核人或说明" value={search} onChange={event => onSearch(event.target.value)} /></label>
    {error ? <div role="alert" className="iad-error">{error}<button onClick={() => setRetry(value => value + 1)}>重新加载记录</button></div>
      : loading ? <p role="status">加载复核记录…</p> : <>{pagination}
        {result?.items.length ? <div className="iad-table-scroll" role="region" aria-label="复核历史表格" tabIndex={0} onFocus={event => { if (event.target === event.currentTarget) event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" }); }}><table>
          <caption>人工裁决历史</caption><thead><tr><th>图像</th><th>人工裁决</th><th>复核人 / 时间</th><th>复核说明</th><th>操作</th></tr></thead>
          <tbody>{result.items.map(record => <tr key={record.decision_id} data-decision-id={record.decision_id} data-selected={record.sample_id === selected}>
            <td title={record.relative_path}>{record.relative_path}</td><td>{reviewLabel(record.decision)}</td>
            <td>{record.reviewer}<br />{record.submitted_at ? <time dateTime={record.submitted_at}>{new Date(record.submitted_at).toLocaleString()}</time> : "未记录提交时间"}</td>
            <td>{record.comment || "—"}</td><td><button onClick={() => onSelect(record.sample_id)}>查看样本</button></td>
          </tr>)}</tbody></table></div> : <p className="iad-empty">没有符合条件的复核记录。</p>}{pagination}</>}
  </section>;
}
