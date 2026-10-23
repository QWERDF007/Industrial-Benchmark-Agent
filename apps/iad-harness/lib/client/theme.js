/** DSH owns theme selection. Standalone surfaces use the same semantic roles. */
export const themeStyles = `
.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-sidebar-content,.iad-detail-dialog::backdrop {
 --iad-canvas:#F7F8FA;
 --iad-surface:#fff;
 --iad-surface-muted:#f1f4f8;
 --iad-text:#202938;
 --iad-muted:#626e80;
 --iad-border:#e2e6ec;
 --iad-control-border:#7D899A;
 --iad-primary:#275BCC;
 --iad-primary-fill:#275BCC;
 --iad-on-primary:#fff;
 --iad-hover:#edf3ff;
 --iad-danger:color-mix(in srgb,var(--dsw-alias-state-error-primary,#a22c34) 85%,var(--iad-text));
 --iad-danger-bg:var(--dsw-alias-state-error-secondary,#ffeded);
 --iad-success:var(--dsw-alias-state-success-primary,#12634b);
 --iad-warning:var(--dsw-alias-state-warn-primary,#af4a12);
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#1d2633;
 --iad-on-viewer:#fff;
 --iad-scrim:#101b2bd9;
 --iad-radius:.375rem;
 --iad-control-height:2.5rem;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] :is(.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-sidebar-content) {--iad-canvas:#171c25;--iad-surface:#222936;--iad-surface-muted:#2a3342;--iad-text:#f2f4f7;--iad-muted:#b1bbcb;--iad-border:#3e4756;--iad-hover:#283b59;--iad-primary:#A6C8FF;--iad-control-border:#7F8A9C;}
`;
