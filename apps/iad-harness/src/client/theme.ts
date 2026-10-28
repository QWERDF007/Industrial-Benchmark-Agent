/** DSH owns theme selection. Standalone surfaces use the same semantic roles. */
const darkColors = `--iad-canvas:#141B25;--iad-surface:#202B3A;--iad-navigation:#182231;--iad-surface-muted:#293648;--iad-text:#EDF2F8;--iad-muted:#B4C0D0;--iad-border:#4C5B6E;--iad-control-border:#8393AA;--iad-primary:#A7C5FF;--iad-primary-fill:#315FC9;--iad-hover:#293E60;--iad-success:#92D7B0;--iad-warning:#F3C280;--iad-danger:#FFB7B1;--iad-viewer:#10161F;`;

export const themeStyles = `
:root {
 --iad-canvas:#EEF1F5;
 --iad-surface:#fff;
 --iad-navigation:#F5F7FA;
 --iad-surface-muted:#F2F5F9;
 --iad-text:#182230;
 --iad-muted:#536174;
 --iad-border:#CBD3DE;
 --iad-control-border:#7D8CA0;
 --iad-primary:#2458C6;
 --iad-primary-fill:#2458C6;
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
 --iad-radius:.375rem;
 --iad-control-height:2.5rem;
 --iad-space-1:.25rem;--iad-space-2:.5rem;--iad-space-3:.75rem;--iad-space-4:1rem;--iad-space-6:1.5rem;--iad-space-8:2rem;--iad-space-12:3rem;
 --iad-page-padding:var(--iad-space-8);--iad-section-gap:var(--iad-space-6);--iad-field-gap:var(--iad-space-4);
 --iad-title-size:calc(var(--dsh-content-font-size,.875rem)*2);--iad-section-size:calc(var(--dsh-content-font-size,.875rem)*1.285714);--iad-group-size:calc(var(--dsh-content-font-size,.875rem)*1.071429);
}
[data-ds-dark-theme] {${darkColors}}
.iad-consistency{--iad-text:#17243A;--iad-muted:#64748A;--iad-border:#D9E0E9;--iad-primary:#275BCC;--iad-primary-fill:#275BCC;--iad-hover:#EAF0FD;--iad-surface-muted:#F9FAFC}
[data-ds-dark-theme] .iad-consistency{${darkColors}}
:is([data-page="industrial-datasets"],.iad-dataset-dialog) {
 --iad-canvas:#F7F8FA;--iad-surface:#fff;--iad-surface-muted:#F1F4F8;
 --iad-text:#202938;--iad-muted:#626E80;--iad-border:#E2E6EC;--iad-panel-border:#CBD5E1;
 --iad-control-border:#8491A3;--iad-primary:#275BCC;--iad-primary-fill:#275BCC;--iad-hover:#EDF3FF;--iad-dialog-shadow:#17213435;
}
.iad-detail-dialog.iad-dataset-dialog::backdrop{background:rgba(17,30,51,.45)}
[data-ds-dark-theme] :is([data-page="industrial-datasets"],.iad-dataset-dialog) {${darkColors}--iad-panel-border:var(--iad-border);}
`;
