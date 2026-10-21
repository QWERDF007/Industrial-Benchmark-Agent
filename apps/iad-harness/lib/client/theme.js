/** DSH owns theme selection. Standalone surfaces use the same semantic roles. */
export const themeStyles = `
.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-detail-dialog::backdrop {
 --iad-canvas:var(--dsw-alias-bg-module-platform,#edf2f7);
 --iad-surface:var(--dsw-alias-bg-layer-1,#fff);
 --iad-surface-muted:var(--dsw-alias-bg-module-platform,#e7edf5);
 --iad-text:var(--dsw-alias-label-primary,#1c2a3c);
 --iad-muted:var(--dsw-alias-label-secondary,#53647c);
 --iad-border:var(--dsw-alias-border-l3,#a1adbe);
 --iad-control-border:color-mix(in srgb,var(--iad-muted) 90%,var(--iad-surface));
 --iad-primary:#215bd5;
 --iad-primary-fill:#215bd5;
 --iad-on-primary:#fff;
 --iad-hover:var(--dsw-alias-interactive-bg-hover,#e4eaf4);
 --iad-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary,#a22c34) 85%,var(--iad-text));
 --iad-danger-bg:var(--dsw-alias-state-error-secondary,#ffeded);
 --iad-success:var(--dsw-alias-state-success-primary,#12634b);
 --iad-warning:var(--dsw-alias-state-warn-primary,#af4a12);
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#15202e;
 --iad-on-viewer:#fff;
 --iad-scrim:#101b2bd9;
 --iad-radius:8px;
 --iad-control-height:40px;
}
[data-ds-dark-theme] :is(.iad-workbench,.iad-tool-card,.iad-tooltip) {--iad-primary:#a6c8ff;}
`;
