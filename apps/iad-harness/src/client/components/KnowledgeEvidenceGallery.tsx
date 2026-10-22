import React, { useState } from "react";
import type { KnowledgeEvidence } from "../../shared/domain.generated.js";
import type { ImageSource } from "./ImageViewer.js";
import { Pagination } from "./Pagination.js";

export function KnowledgeEvidenceGallery({ versionId, items, onOpen }: { versionId: string; items: readonly KnowledgeEvidence[]; onOpen(image: ImageSource): void }) {
  const scope = JSON.stringify([versionId, items.map(item => item.image.evidence_id)]);
  const [position, setPosition] = useState({ scope: "", page: 1 });
  const page = position.scope === scope ? Math.min(position.page, Math.max(1, Math.ceil(items.length / 10))) : 1;
  return <><div className="iad-knowledge-evidence iad-reference-grid">{items.slice((page - 1) * 10, page * 10).map(({ image }) => {
    const src = `/api/iad/knowledge/evidence/${encodeURIComponent(versionId)}/${encodeURIComponent(image.evidence_id)}`;
    return <button key={image.evidence_id} title="放大冻结证据" onClick={() => onOpen({src, title:`${image.role} · ${image.representation} · ${image.crop_bbox.join(", ")}`,width:image.sent_size[0],height:image.sent_size[1]})}>
      <img src={src} alt={`${image.role} · ${image.representation}`} loading="lazy" /><small>{image.role} · {image.representation}</small>
    </button>;
  })}</div>{!items.length && <p className="iad-muted">未提供此组证据。</p>}{items.length > 10 && <Pagination total={items.length} page={page} size={10} unit="项证据" onPage={page => setPosition({scope,page})} />}</>;
}
