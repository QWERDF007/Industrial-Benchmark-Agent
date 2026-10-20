import React from "react";

export const pageSize = 24;

export function Pagination({ total, page, unit, onPage }: { total: number; page: number; unit: string; onPage(page: number): void }) {
  return <div className="iad-pagination"><span>{total} {unit}</span><button disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</button>
    <span>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span><button disabled={page * pageSize >= total} onClick={() => onPage(page + 1)}>下一页</button></div>;
}
