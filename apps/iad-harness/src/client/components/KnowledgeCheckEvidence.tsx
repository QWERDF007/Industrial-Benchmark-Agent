import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {KnowledgeCheckEvidencePage, KnowledgeDetailQuery, KnowledgeEvidence} from '../../shared/domain.generated.js';
import {useResource} from '../useResource.js';
import {analysisImageUrl,currentKnowledgeDetail,type AnalysisReadSource} from '../analysis-results.js';
import {Pagination} from './Pagination.js';
import {ThumbnailCard} from './ThumbnailCard.js';

export function KnowledgeCheckEvidence({source, checkId, role, active, onOpen, onLoaded}: {
  source: AnalysisReadSource; checkId: string; role: NonNullable<KnowledgeDetailQuery['evidence_role']>;
  active: boolean;
  onOpen(item: KnowledgeEvidence): void; onLoaded?(detail: KnowledgeCheckEvidencePage): void;
}) {
  const grid = useRef<HTMLDivElement>(null);
  const [paging, setPaging] = useState({page: 1, size: 0});
  useLayoutEffect(() => {
    const element = grid.current!;
    const observer = new ResizeObserver(() => {
      if (!element.getBoundingClientRect().width) return;
      const columns = getComputedStyle(element).gridTemplateColumns.split(' ').length;
      const size = columns * 2;
      setPaging(previous => previous.size === size ? previous : {page: 1, size});
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const query = new URLSearchParams({version_id: source.kind==='published'?source.versionId:'', check_id: checkId, evidence_role: role,
    page: String(paging.page), page_size: String(paging.size)});
  const result = useResource<KnowledgeCheckEvidencePage>(active && paging.size && source.kind==='published' ? `/knowledge/details?${query}` : null);
  const detail = source.kind==='current'&&paging.size?currentKnowledgeDetail(source.view,checkId,role,paging.page,paging.size):result.data;
  useEffect(() => {if(detail)onLoaded?.(detail);},[result.data,source,checkId,role,paging.page,paging.size,onLoaded]);
  const label = role === 'support' ? '支持证据' : '反对证据';
  return <section data-evidence-role={role} aria-label={label}>
    <div ref={grid} className="iad-thumbnail-grid" aria-busy={result.loading}>
      {detail?.items.map(item => {
        const filename = item.sample_id.slice(item.sample_id.indexOf(':') + 1).split('/').pop()!;
        return <ThumbnailCard key={item.image.evidence_id} label={filename} aria-label={`放大${label} ${filename}`}
          onClick={() => onOpen(item)}
          src={analysisImageUrl(source,item.image.evidence_id)} />;
      })}
    </div>
    {result.error && <p role="alert">{result.error}</p>}
    {result.loading && <p>正在读取证据…</p>}
    {detail && (detail.total ? <Pagination hideSinglePage total={detail.total} page={paging.page} size={paging.size} unit="张" label={label}
      onPage={page => setPaging(previous => ({...previous, page}))} /> : <p>暂无{label}</p>)}
  </section>;
}
