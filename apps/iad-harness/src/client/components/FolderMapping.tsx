import React from "react";
import type { FolderPreview, FolderRule } from "../../shared/contracts.js";

const roleLabels: Record<FolderRule["role"], string> = {
  normal: "正常 (OK)", anomaly: "异常 (NG)", unlabeled: "未标记", excluded: "排除",
};

export function FolderMapping({ preview, rules, pending, disabled, onChange }: {
  preview: FolderPreview | null; rules?: FolderRule[]; pending: boolean; disabled: boolean; onChange(rules: FolderRule[]): void;
}) {
  return <div className="iad-folder-rules">
    {pending && <p role="status">正在预览目录…</p>}
    {preview && <><p className="iad-muted">发现 {preview.total_images} 张图像</p>
      <div className="iad-table-scroll"><table className="iad-preview-table">
        <thead><tr><th>目录</th><th>图像数</th><th>角色</th></tr></thead>
        <tbody>{preview.items.map(item => <tr key={item.path}>
          <td><code>{item.path === "." ? "直属图像" : item.path}</code></td><td>{item.image_count}</td>
          <td><select aria-label={`目录 ${item.path} 角色`} disabled={disabled}
            value={rules?.find(rule => rule.path === item.path)?.role || item.role}
            onChange={event => onChange(preview.items.map(row => ({ path: row.path,
              role: row.path === item.path ? event.target.value as FolderRule["role"] : rules?.find(rule => rule.path === row.path)?.role || row.role })))}>
            {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></td>
        </tr>)}</tbody>
      </table></div>
      {preview.conflicts.length > 0 && <div role="alert" className="iad-error">{preview.conflicts.map(conflict => <p key={conflict}>{conflict}</p>)}</div>}
    </>}
  </div>;
}
