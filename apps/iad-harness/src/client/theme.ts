/** DSH owns theme selection. Standalone surfaces use the same semantic roles. */
export const themeStyles = `
.iad-workbench,.iad-tool-card,.iad-tooltip,.iad-detail-dialog::backdrop {
 --iad-canvas:var(--dsw-alias-bg-module-platform,#F7F8FA);
 --iad-surface:var(--dsw-alias-bg-layer-1,#fff);
 --iad-surface-muted:var(--dsw-alias-bg-module-platform,#e7edf5);
 --iad-text:var(--dsw-alias-label-primary,#182230);
 --iad-muted:var(--dsw-alias-label-secondary,#667085);
 --iad-border:var(--dsw-alias-border-l3,#E4E7EC);
 --iad-control-border:#7D899A;
 --iad-primary:#245BCC;
 --iad-primary-fill:#245BCC;
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
 --iad-radius:.375rem;
 --iad-control-height:2.5rem;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-8);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.428571);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.142857);
}
[data-ds-dark-theme] :is(.iad-workbench,.iad-tool-card,.iad-tooltip) {--iad-primary:#A6C8FF;--iad-control-border:#7F8A9C;}
`;
