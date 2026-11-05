import {ThumbnailCard} from "./ThumbnailCard.js";
import React, { useState } from "react";
import type { KnowledgeEvidence, KnowledgeEvidencePage } from "../../shared/domain.generated.js";
import type { ImageSource } from "./ImageViewer.js";
import { Pagination } from "./Pagination.js";
import {useResource} from '../useResource.js';

export function KnowledgeEvidenceGallery({ versionId, items, onOpen }: { versionId: string; items: readonly KnowledgeEvidence[]; onOpen(image: ImageSource): void }) {
  const scope = JSON.stringify([versionId, items.map(item => item.image.evidence_id)]);
  const [position, setPosition] = useState({ scope: "", page: 1 });
  const page = position.scope === scope ? position.page : 1;
  const query = new URLSearchParams({version_id:versionId,section:'evidence',
    evidence_ids:JSON.stringify(items.map(item=>item.image.evidence_id)),page:String(page),page_size:'10'});
  const resource = useResource<KnowledgeEvidencePage>(items.length ? `/knowledge/details?${query}` : null);
  const displayed = resource.data?.items || [];
  return <><div className="iad-thumbnail-grid">{displayed.map(({ image, sample_id },index) => {
    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
    const title=`图像 ${(page-1)*10+index+1}`;
    return <ThumbnailCard key={image.evidence_id} src={src} label={title}
      onClick={()=>onOpen({src,title,width:image.sent_size[0],height:image.sent_size[1],sampleId:sample_id,evidence:image})} />;
  })}</div>{resource.loading && <p>正在读取证据…</p>}{resource.error && <p role="alert">{resource.error}</p>}
    {!items.length && <p>未提供此组证据。</p>}{resource.data && resource.data.total>10 && <Pagination total={resource.data.total} page={page} size={10} unit="张" onPage={page => setPosition({scope,page})} />}</>;
}
