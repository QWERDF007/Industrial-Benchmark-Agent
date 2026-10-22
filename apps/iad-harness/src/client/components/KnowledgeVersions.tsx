import React, { useState } from "react";
import type { KnowledgeVersion } from "../../shared/contracts.js";
import { Pagination } from "./Pagination.js";

export function KnowledgeVersions({ versions, onSelect }: { versions: KnowledgeVersion[]; onSelect(id: string): void }) {
  const [page, setPage] = useState(1);
  const current = Math.min(page, Math.max(1, Math.ceil(versions.length / 10)));
  return <><div className="iad-table-scroll"><table className="iad-resource-table" aria-label="知识版本列表"><thead><tr><th>版本</th><th className="iad-number">来源</th><th className="iad-number">判据</th><th>时间</th><th>依据</th></tr></thead><tbody>{versions.slice((current - 1) * 10, current * 10).map(version => <tr key={version.version_id}>
    <td><button title={version.version_id} className="iad-identifier" onClick={() => onSelect(version.version_id)}>{version.version_id}</button></td><td className="iad-number">{version.source_count}</td><td className="iad-number">{version.check_count}</td><td><time dateTime={version.created_at}>{new Date(version.created_at).toLocaleString()}</time></td><td><details><summary>版本关系</summary><dl><dt>父版本</dt><dd>{version.parent_version_id || "无"}</dd><dt>良品基准</dt><dd>{version.normal_version_id || "未使用"}</dd></dl></details></td>
  </tr>)}</tbody></table></div><Pagination total={versions.length} page={current} size={10} unit="个版本" onPage={setPage} /></>;
}
