export const galleryStyles = `
.iad-image-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.iad-image-pair-side{min-width:0}.iad-image-pair-side>p{margin-bottom:8px;color:var(--iad-muted)}

.iad-thumbnail-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,180px),1fr));gap:10px 12px;align-content:start;align-items:start}
button.iad-thumbnail-card{display:flex;flex-direction:column;align-items:stretch;width:100%;max-width:192px;min-width:0;flex:0 0 180px;align-self:start;height:168px;max-height:100%;padding:8px;box-sizing:border-box;background:var(--iad-surface,#fff);color:var(--iad-text,#172338);border:1px solid var(--iad-control-border,#a7b8d1);border-radius:5px;text-align:left;white-space:normal;overflow:hidden;cursor:pointer;font:inherit}
button.iad-thumbnail-card:hover{border-color:var(--iad-primary,#2458d5);background:var(--iad-surface,#fff)}
button.iad-thumbnail-card:focus-visible,button.iad-thumbnail-card[data-focused=true],button.iad-thumbnail-card[data-highlighted=true],button.iad-thumbnail-card[aria-pressed=true]{outline:2px solid var(--iad-primary,#2458d5);outline-offset:1px}
.iad-thumbnail-card>.iad-thumbnail-media{display:flex;align-items:center;justify-content:center;width:100%;height:128px;min-height:0;overflow:hidden;background:var(--iad-surface-muted,#eef2f7);position:relative;flex:1 1 128px;padding:0}
.iad-thumbnail-card>.iad-thumbnail-media>img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain}
.iad-thumbnail-strip{display:flex;flex:none;gap:12px;overflow-x:auto;max-width:100%;min-height:0;padding:3px 2px 8px}
.iad-thumbnail-card>.iad-thumbnail-caption{display:block;min-width:0;padding:6px 0 2px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:12px;font-weight:400;color:inherit;line-height:18px}
.iad-thumbnail-card>small,.iad-thumbnail-card>.iad-thumbnail-meta{display:block;font-size:12px;line-height:18px;color:var(--iad-muted,#687990)}
nav.iad-pagination{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:8px;padding:4px 0 2px;margin:10px 0 0;font-size:12px;color:var(--iad-text,#172338)}
nav.iad-pagination>button{height:32px;min-height:32px;min-width:32px;padding:0 8px;border:1px solid var(--iad-control-border,#dbe2eb);border-radius:5px;background:var(--iad-surface,#fff);color:inherit;cursor:pointer;font-size:12px;font-weight:400;line-height:normal;box-shadow:none}
nav.iad-pagination>button:disabled{opacity:.4;cursor:not-allowed}
nav.iad-pagination>button:not(:disabled):hover{background:var(--iad-hover,#eef4ff);border-color:var(--iad-primary,#2458d5)}
nav.iad-pagination>button[aria-current=page]{background:var(--iad-primary,#2458d5);border-color:var(--iad-primary,#2458d5);color:#fff}
nav.iad-pagination>span{white-space:nowrap;margin-left:4px}
dialog.iad-fullscreen-dialog{width:100vw;height:100dvh;max-width:none;max-height:none;padding:0;margin:0;border:0;border-radius:0;background:#202a36;overflow:hidden}
dialog.iad-fullscreen-dialog .full-overlay{position:absolute;inset:0}
.full-image-world>.iad-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.iad-annotation-layer{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden}
.iad-annotation-layer :is(rect,polygon){fill:none;stroke:#ffb74c;stroke-width:2;vector-effect:non-scaling-stroke}
.iad-annotation-layer text{fill:#fff;stroke:#152538;stroke-width:3;paint-order:stroke;font-size:12px}
.iad-annotation-layer .iad-annotation-mask>g>rect{fill:#ffb74c;fill-opacity:.45;stroke:none}
.full-content{display:flex;flex:1;min-height:0;min-width:0}.full-context{width:288px;min-width:0;overflow:auto;background:var(--iad-surface,#fff);padding:16px;color:var(--iad-text,#172338)}.full-context .iad-thumbnail-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
`;
