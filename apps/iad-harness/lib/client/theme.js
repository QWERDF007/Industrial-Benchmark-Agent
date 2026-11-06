/** DSH owns theme selection. Standalone surfaces use the same semantic roles. */
const darkColors = `--iad-canvas:#141B25;--iad-surface:#202B3A;--iad-navigation:#182231;--iad-surface-muted:#293648;--iad-text:#EDF2F8;--iad-muted:#B4C0D0;--iad-border:#4C5B6E;--iad-panel-border:var(--iad-border);--iad-control-border:#8393AA;--iad-primary:#A7C5FF;--iad-primary-fill:#315FC9;--iad-hover:#293E60;--iad-success:#92D7B0;--iad-warning:#F3C280;--iad-danger:#FFB7B1;--iad-viewer:#10161F;`;
export const themeStyles = `
:root {
 --iad-canvas:#F5F7FA;
 --iad-surface:#fff;
 --iad-navigation:#F5F7FA;
 --iad-surface-muted:#F2F5F9;
 --iad-text:#172338;
 --iad-muted:#536174;
 --iad-border:#CBD3DE;
 --iad-panel-border:#DBE2EB;
 --iad-control-border:#B9C7D9;
 --iad-primary:#285ED6;
 --iad-primary-fill:#285ED6;
 --iad-primary-hover:#1E51C2;
 --iad-on-primary:#fff;
 --iad-hover:#EAF0FE;
 --iad-danger:#B42318;
 --iad-success:#166344;
 --iad-warning:#8A4B06;
 --iad-success-badge:color-mix(in srgb,var(--iad-success) 45%,#000);
 --iad-viewer:#202833;
 --iad-on-viewer:#fff;
 --iad-viewer-edge-fill:rgba(15,25,36,.76);--iad-viewer-edge-hover:rgba(35,48,65,.94);
 --iad-viewer-edge-border:#4B5C70;--iad-viewer-edge-hover-border:#8294A8;--iad-viewer-edge-shadow:rgba(0,0,0,.1);
 --iad-scrim:#101b2bd9;
 --iad-radius:5px;
 --iad-control-height:38px;
 --iad-field-width:220px;
 --iad-dataset-width:250px;
 --iad-subset-width:390px;
 --iad-icon-size:18px;
 --iad-row-action-size:32px;
 --iad-tab-height:44px;
 --iad-font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;
 --iad-font-size:13px;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] {${darkColors}}
[data-shortcut-modal="settings"] > nav {border-inline-end:1px solid var(--iad-panel-border)}
`;
