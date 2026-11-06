export const jobsStyles = `
.iad-job-panel{min-width:0}.iad-job-panel>h2{margin-top:26px}
.iad-job-drawer-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:22px 24px 28px;color:var(--iad-text);font-size:var(--iad-font-size)}
.iad-job-statusline{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.iad-job-statusline>strong{font-size:15px;font-weight:650}
.iad-job-pill{display:inline-flex;align-items:center;padding:4px 10px;border:1px solid #d7e0eb;background:#f5f7fa;border-radius:var(--iad-radius);font-size:12px;font-weight:500}
.iad-job-pill[data-status=RUNNING]{border-color:#aec4ea;background:#edf3fd}
.iad-job-pill:is([data-status=FAILED],[data-status=PARTIAL],[data-status=INTERRUPTED]){border-color:#e6bfc5;background:#fff4f5}
.iad-job-drawer-body .iad-job-meta{display:grid;grid-template-columns:100px minmax(0,1fr);column-gap:14px;row-gap:10px;margin:0 0 22px}
.iad-job-drawer-body .iad-job-meta dt{color:var(--iad-muted)}.iad-job-drawer-body .iad-job-meta dd{margin:0;overflow-wrap:anywhere}
.iad-job-status-section{padding-top:20px;margin-top:18px;border-top:1px solid var(--iad-border)}
.iad-job-status-section h3{font-size:14px;font-weight:650;margin:0 0 14px}
.iad-job-stage-list{display:flex;flex-direction:column;gap:0;position:relative}
.iad-job-stage{display:grid;grid-template-columns:26px 1fr;gap:10px;min-height:48px;position:relative;color:var(--iad-muted)}
.iad-job-stage:not(:last-child)::before{content:'';position:absolute;left:11px;top:25px;bottom:1px;width:1px;background:var(--iad-border)}
.iad-job-dot{display:grid;place-items:center;box-sizing:border-box;width:24px;height:24px;border-radius:50%;border:1px solid #ced8e3;background:var(--iad-surface);font-size:12px;color:#63758d;z-index:1}
.iad-job-stage[data-state=done] .iad-job-dot{background:#f2f5f9;border-color:#9baabd;color:var(--iad-text)}
.iad-job-stage[data-state=current] .iad-job-dot{border-color:#2b60c6;background:#ecf3ff;color:#244ca9}
.iad-job-stage[data-state=error] .iad-job-dot{border-color:#b35f68;background:#fff1f2;color:#912c36}
.iad-job-stage strong{display:block;font-weight:500;color:var(--iad-text);padding-top:3px}
.iad-job-stage small{display:block;font-size:12px;color:var(--iad-muted);margin-top:4px}
.iad-job-error{background:#faf5f5;border:1px solid #e7cfd0;border-radius:var(--iad-radius);padding:14px 15px;line-height:1.7;overflow-wrap:anywhere}
.iad-job-error+.iad-job-error{margin-top:10px}.iad-job-error strong{display:block;font-size:var(--iad-font-size);margin-bottom:5px}.iad-job-error p{margin:0}.iad-job-error code{display:block;overflow-wrap:anywhere}
.iad-job-note{font-size:12px;color:var(--iad-muted);line-height:1.65;margin:12px 0 0}
.iad-job-drawer-footer{border-top:1px solid var(--iad-border);display:flex;justify-content:flex-end;padding:13px 24px;flex:none}
@media(max-width:680px){.iad-job-drawer-body{padding:18px 16px}.iad-job-drawer-footer{padding:12px 16px}}
`;
