import React from 'react';

export const IBA_JOBS_PAGE_SIZE = 8;

export interface IbaJobPagerProps {
  total: number;
  page: number;
  onPage: (page: number) => void;
  label: string;
  pageSize?: number;
  dataActionAttr?: string;
  dataActionName?: string;
}

export function IbaJobPager({
  total,
  page,
  onPage,
  label,
  pageSize = IBA_JOBS_PAGE_SIZE,
  dataActionAttr,
  dataActionName
}: IbaJobPagerProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const nums: number[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
      nums.push(p);
    }
  }

  const items: Array<{ type: 'page'; p: number } | { type: 'ellipsis'; key: string }> = [];
  let last = 0;
  for (const p of nums) {
    if (last && p - last > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${last}-${p}` });
    }
    items.push({ type: 'page', p });
    last = p;
  }

  const makeCustomAttrs = (p: number) => {
    if (!dataActionAttr || !dataActionName) return { 'data-id': p };
    return {
      [dataActionAttr]: dataActionName,
      'data-id': p
    };
  };

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(pages, page + 1);

  return (
    <nav className="iba-job-pager" aria-label={`${label}分页`}>
      <button
        type="button"
        {...makeCustomAttrs(prevPage)}
        disabled={page <= 1}
        aria-label={page <= 1 ? '上一页' : `转到第 ${prevPage} 页`}
        onClick={() => onPage(prevPage)}
      >
        上一页
      </button>

      {items.map(item =>
        item.type === 'ellipsis' ? (
          <span key={item.key} className="iba-job-ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item.p}
            type="button"
            {...makeCustomAttrs(item.p)}
            aria-current={item.p === page ? 'page' : undefined}
            aria-label={item.p === page ? `当前第 ${item.p} 页` : `转到第 ${item.p} 页`}
            onClick={() => onPage(item.p)}
          >
            {item.p}
          </button>
        )
      )}

      <button
        type="button"
        {...makeCustomAttrs(nextPage)}
        disabled={page >= pages}
        aria-label={page >= pages ? '下一页' : `转到第 ${nextPage} 页`}
        onClick={() => onPage(nextPage)}
      >
        下一页
      </button>

      <span className="iba-job-total">
        第 {page} / {pages} 页 · 共 {total} 条
      </span>
    </nav>
  );
}
