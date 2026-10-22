import React from "react";

export const pageSize = 24;

export function Pagination({ total, page, unit, onPage, size = pageSize }: { total: number; page: number; unit: string; onPage(page: number): void; size?: number }) {
  return <div className="iad-pagination"><span>{total} {unit}</span><button disabled={page <= 1} onClick={() => onPage(page - 1)}>上一页</button>
    <span>{page} / {Math.max(1, Math.ceil(total / size))}</span><button disabled={page * size >= total} onClick={() => onPage(page + 1)}>下一页</button></div>;
}
