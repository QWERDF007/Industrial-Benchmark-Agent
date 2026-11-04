export const knowledgeStyles = `
/* V49 Knowledge Mining Styles - Scoped to .kb-v45 and workbench */

:root {
  --iad-content-modal-gutter: clamp(20px, 3.4vw, 60px);
  --iad-content-modal-radius: 8px;
  --iad-content-modal-width: 1260px;
  --iad-content-modal-height: 820px;
}

#knowledge-page {
  --iad-content-modal-gutter: clamp(20px, 3.4vw, 60px);
  --iad-content-modal-radius: 8px;
  --iad-content-modal-width: 1260px;
  --iad-content-modal-height: 820px;
}

.iad-knowledge-page {
  min-width: 0;
  width: 100%;
}

.kb-v45-main {
  min-width: 0;
  padding: 0;
}

.main-inner {
  max-width: 1550px;
  margin: 0 auto;
}

/* Header & Topline */
.kb-v45 .topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin: 0 0 18px;
}

.kb-v45 .titlebar .eyebrow {
  font-size: 13px !important;
  color: #172338 !important;
  font-weight: 400 !important;
}

.kb-v45 .titlebar h1 {
  font-size: 23px !important;
  margin: 0;
  line-height: 1.5;
  letter-spacing: -0.4px;
  color: #172338 !important;
  font-weight: 650 !important;
}

.kb-v45 .actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Common Buttons & Form Controls in KB */
.kb-v45 .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 37px;
  min-height: 37px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #b7c5d9;
  border-radius: 5px;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  box-shadow: none;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.kb-v45 .btn:hover:not(:disabled) {
  background: #f2f6fd;
  border-color: #9caed1;
}

.kb-v45 .btn.primary {
  background: #285ed6;
  border: 1px solid #285ed6;
  color: #fff !important;
  font-weight: 600 !important;
}

.kb-v45 .btn.primary:hover:not(:disabled) {
  background: #1e51c2;
  border-color: #1e51c2;
}

.kb-v45 .btn.quiet {
  height: 32px;
  min-height: 32px;
  padding: 0 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #2d5dcb !important;
  font-size: 12px !important;
}

.kb-v45 .btn.quiet:hover:not(:disabled) {
  background: #eff4fb;
  border-color: transparent;
}

.kb-v45 .btn.small {
  height: 32px;
  min-height: 32px;
  padding: 0 10px;
  font-size: 12px !important;
}

.kb-v45 .btn.danger,
.kb-v45 .btn.is-danger {
  background: #fff;
  border-color: #deaeb5;
  color: #b24652 !important;
}

.kb-v45 .btn.danger:hover:not(:disabled),
.kb-v45 .btn.is-danger:hover:not(:disabled) {
  background: #fff2f3;
  border-color: #deaeb5;
}

.kb-v45 .iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #d4dce7;
  border-radius: 5px;
  background: white;
  color: #172338 !important;
  font-size: 18px;
  cursor: pointer;
}

.kb-v45 .iconbtn:hover:not(:disabled) {
  background: #f1f5fb;
}

.kb-v45 .f {
  min-height: 38px;
  height: 38px;
  border: 1px solid #b7c5d9;
  border-radius: 5px;
  background: #fff;
  padding: 0 11px;
  font-size: 13px !important;
  color: #172338 !important;
}

.kb-v45 .f:hover:not(:disabled) {
  border-color: #94aad0;
}

.kb-v45 .f:focus-visible {
  outline: 2px solid #a9c1f5;
  outline-offset: 0;
  border-color: #285ed6;
}

.kb-v45 .f.wide {
  width: 100%;
}

.kb-v45 .f.select {
  padding-right: 24px;
}

.kb-v45 .f.textarea {
  min-height: 148px;
  height: auto;
  padding: 11px;
  max-height: 470px;
  line-height: 1.7;
  font-size: 13px !important;
  resize: vertical;
}

.kb-v45 .label {
  font-size: 13px !important;
  font-weight: 500;
  color: #172338 !important;
  display: block;
  margin: 0 0 7px;
}

/* Context scope bar */
.kb-v45 .context {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  margin-bottom: 18px;
}

.kb-v45 .context .control:first-child {
  width: min(310px, 32%);
}

.kb-v45 .context .control:nth-child(2) {
  width: min(410px, 40%);
}

.kb-v45 .kb-context-actions {
  display: flex;
  align-items: center;
  align-self: flex-end;
  flex: none;
}

.kb-v45 .kb-context-actions .iconbtn {
  width: 38px;
  height: 38px;
}

.kb-v45 .context-info {
  display: none !important;
}

/* Panels */
.kb-v45 .panel {
  background: white;
  border: 1px solid #dbe2eb;
  border-radius: 6px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: none;
}

.kb-v45 .panelbar {
  padding: 17px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kb-v45 .panelbar h2 {
  font-size: 16px !important;
  font-weight: 650 !important;
  margin: 0;
  line-height: 1.3;
  color: #172338 !important;
}

.kb-v45 .count {
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  margin-left: 10px;
}

.kb-v45 .filterset {
  display: flex;
  align-items: center;
  gap: 9px;
}

.kb-v45 .filterset .f {
  height: 34px;
  min-height: 34px;
}

.kb-v45 .filterset input {
  width: 220px;
}

.kb-v45 .filterset select {
  width: 143px;
}

/* Jobs Table */
.kb-v45 .tableframe {
  overflow-x: auto;
}

.kb-v45 .jobs-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 970px;
  text-align: left;
  font-size: 13px;
}

.kb-v45 .jobs-table th {
  height: 43px;
  background: #f1f4f9;
  border-top: 1px solid #e6ebf1;
  border-bottom: 1px solid #dfe6f0;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  padding: 12px 16px;
  white-space: nowrap;
}

.kb-v45 .jobs-table td {
  height: 58px;
  border-bottom: 1px solid #e5eaf1;
  padding: 13px 16px;
  white-space: nowrap;
  color: #172338 !important;
  font-size: 13px !important;
}

.kb-v45 .jobs-table tbody tr {
  cursor: pointer;
}

.kb-v45 .jobs-table tbody tr:hover {
  background: #f7faff;
}

.kb-v45 .jobs-table tbody tr.current {
  background: #eaf0ff;
  box-shadow: inset 3px 0 0 #285ed6;
}

.kb-v45 .jobs-table tr:focus-visible {
  outline: 2px solid #81a6fa;
  outline-offset: -2px;
}

.kb-v45 .jobs-table .jobtitle {
  font-weight: 600 !important;
  color: #172338 !important;
  font-size: 13px !important;
  max-width: 285px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kb-v45 .jobs-table .sub {
  display: block;
  color: #172338 !important;
  font-size: 11px;
  margin-top: 2px;
}

.kb-v45 .jobs-table .num {
  text-align: center;
}

.kb-v45 .jobs-table .right {
  text-align: right;
}

.kb-v45 .jobact {
  display: flex;
  gap: 7px;
  justify-content: flex-end;
}

.kb-v45 .job-mini-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 33px;
  width: 34px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #172338 !important;
  cursor: pointer;
  padding: 0;
}

.kb-v45 .job-mini-icon svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  stroke-width: 1.8;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.kb-v45 .job-mini-icon:hover {
  background: #edf2fa;
}

.kb-v45 .job-mini-icon[data-remove-job]:hover,
.kb-v45 .job-mini-icon[data-delete-entry]:hover,
.kb-v45 .knowledge-entry-delete:hover {
  color: #b24652 !important;
  background: #fff0f1 !important;
}

.kb-v45 .knowledge-entry-view:hover {
  color: #285fc9 !important;
  background: #edf2fa !important;
}

/* Status Badges */
.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  font-weight: 550;
}

.status.green {
  color: #177b53 !important;
  background: #e7f6eb;
}

.status.blue {
  color: #2458c7 !important;
  background: #e7efff;
}

.status.amber {
  color: #976013 !important;
  background: #fff2e0;
}

.status.red {
  color: #b23c43 !important;
  background: #fff0f0;
}

.status.gray {
  color: #526176 !important;
  background: #edf1f5;
}

/* Pagination */
.kb-v45 .job-pager,
.kb-v45 .knowledge-pager {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-height: 59px;
  border-top: 1px solid #e6ebf1;
  padding: 13px 20px;
  background: #fff;
  color: #172338 !important;
  font-size: 13px !important;
}

.kb-v45 .job-pager .pages,
.kb-v45 .knowledge-pager .pages {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.kb-v45 .pagebtn {
  height: 32px;
  min-width: 32px;
  padding: 0 10px;
  background: #fff;
  border: 1px solid #dbe2eb;
  border-radius: 5px;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 500;
  cursor: pointer;
}

.kb-v45 .pagebtn:hover:not(:disabled) {
  background: #f2f6fd;
  border-color: #b7c7df;
}

.kb-v45 .pagebtn[aria-current="page"] {
  background: #285ed6 !important;
  color: #fff !important;
  border-color: #285ed6 !important;
  font-weight: 600;
}

.kb-v45 .pagebtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.kb-v45 .page-total {
  margin-left: 8px;
  white-space: nowrap;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

.kb-v45 .pager-ellipsis {
  padding: 0 2px;
  color: #8190a5;
}

.kb-v45 .tableempty {
  padding: 50px 18px;
  text-align: center;
  color: #172338 !important;
  font-size: 13px !important;
}

.kb-v45 .tableempty strong {
  display: block;
  color: #172338 !important;
  font-weight: 650 !important;
  margin: 7px 0;
}

/* Lower Panel: Knowledge Entries */
.kb-v45 .knowledgebar {
  align-items: center;
}

.kb-v45 .knowledge-wrap {
  border-top: 1px solid #e8edf4;
}

.kb-v45 .knowledge-list {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
}

.kb-v45 .knowledge-head,
.kb-v45 .knowledge-row {
  display: grid;
  grid-template-columns: minmax(200px, 28%) minmax(290px, 1fr) 112px 90px !important;
  align-items: center;
  gap: 14px !important;
  min-width: 770px !important;
}

.kb-v45 .knowledge-entry-name,
.kb-v45 .knowledge-entry-description {
  display: block;
  font-weight: 400 !important;
  color: var(--iba-v50-ink, #172338) !important;
  line-height: 1.55;
  min-width: 0;
  overflow-wrap: anywhere;
}

.kb-v45 .knowledge-row .knowledge-entry-description {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  max-height: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.kb-v45 .jobtitle {
  font-weight: 400 !important;
  color: var(--iba-v50-ink, #172338) !important;
}

.kb-v45 .count.hide,
#jobs-count.hide,
#knowledge-count.hide {
  display: none !important;
}

.kb-v45 .knowledge-head {
  min-height: 43px;
  padding: 0 20px;
  background: #f1f4f9;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-bottom: 1px solid #dfe6f0;
}

.kb-v45 .knowledge-head > span:last-child {
  text-align: right;
}

.kb-v45 .knowledge-row {
  width: 100%;
  min-height: 74px;
  padding: 11px 20px;
  border: 0;
  border-bottom: 1px solid #e5eaf1;
  text-align: left;
  background: #fff;
  color: #172338 !important;
  cursor: pointer;
  font-size: 13px !important;
  border-radius: 0;
  font-family: inherit;
}

.kb-v45 .knowledge-row:hover {
  background: #f7faff;
}

.kb-v45 .knowledge-row:focus-visible {
  outline: 2px solid #8caef1;
  outline-offset: -2px;
  background: #f3f7ff;
}

.kb-v45 .knowledge-row .row-title {
  display: block;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.5;
}

.kb-v45 .knowledge-row .row-desc {
  display: block;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
  line-height: 1.55;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-v45 .knowledge-row .col-evidence-count {
  text-align: left;
  color: #172338 !important;
  font-size: 13px !important;
  font-variant-numeric: tabular-nums;
}

.kb-v45 .knowledge-row .col-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  min-width: 0;
}

/* Blank states */
.kb-v45 .blank {
  padding: 57px 22px;
  text-align: center;
  color: #172338 !important;
}

.kb-v45 .blank-icon {
  font-size: 34px;
  color: #92a6c4;
  line-height: 1.5;
}

.kb-v45 .blank strong {
  display: block;
  color: #172338 !important;
  font-weight: 650 !important;
  margin: 8px 0;
  font-size: 14px;
}

.kb-v45 .blank p {
  margin: 0;
  line-height: 1.7;
  color: #172338 !important;
  font-size: 13px !important;
  font-weight: 400 !important;
}

.kb-v45 .demo-note {
  font-size: 13px !important;
  color: #172338 !important;
  font-weight: 400 !important;
  margin-top: 6px;
}

/* Overlays and Modals */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 27, 44, 0.42);
  display: none !important;
  z-index: 140;
  justify-content: center;
  align-items: center;
  padding: 18px;
}

.overlay.show {
  display: flex !important;
}

.overlay:not(.show),
#knowledge-page .detail-overlay:not(.show),
.confirm-overlay:not(.show),
.knowledge-prompt-overlay:not(.show),
#create-overlay:not(.show),
#lightbox:not(.show) {
  display: none !important;
}

/* Detail Modal */
.detail-overlay {
  z-index: 150;
  background: rgba(23, 34, 51, 0.68) !important;
  padding: var(--iad-content-modal-gutter) !important;
  align-items: center !important;
  justify-content: center !important;
}

.detail-modal {
  width: min(var(--iad-content-modal-width), calc(100vw - 2 * var(--iad-content-modal-gutter))) !important;
  height: min(var(--iad-content-modal-height), calc(100dvh - 2 * var(--iad-content-modal-gutter))) !important;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  background: #fff;
  border-radius: var(--iad-content-modal-radius) !important;
  border: 1px solid #d9e2ed !important;
  box-shadow: 0 22px 65px rgba(20, 35, 63, 0.26) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-modal .modalheader {
  flex: none;
  padding: 17px 22px;
  border-bottom: 1px solid #e1e7ef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.detail-modal .modalheader h2 {
  font-size: 16px !important;
  font-weight: 650 !important;
  line-height: 1.5;
  margin: 0;
  color: #172338 !important;
}

.detail-modal .modalcontent {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 20px 22px;
}

.detail-modal .modalfooter {
  flex: none;
  padding: 12px 22px;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  border-top: 1px solid #e5eaf2;
  display: flex;
}

.detail-section {
  padding: 0 0 17px;
  margin: 0 0 17px;
  border-bottom: 1px solid #e6ebf1;
}

.detail-section:last-child {
  border-bottom: 0;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h3 {
  font-size: 14px !important;
  font-weight: 650 !important;
  margin: 0 0 9px;
  color: #172338 !important;
}

.detail-section p {
  font-size: 13px !important;
  color: #172338 !important;
  line-height: 1.75;
  margin: 0;
  overflow-wrap: anywhere;
}

.detail-evidence-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-evidence {
  display: block;
  width: 100%;
  padding: 0;
  background: #fafbfd;
  border: 1px solid #d6e0eb;
  border-radius: 5px;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
}

.detail-evidence:hover {
  border-color: #8dadde;
  background: #f5f8ff;
}

.detail-evidence:focus-visible {
  outline: 2px solid #83a8ef;
  outline-offset: 2px;
}

.detail-evidence img {
  width: 100%;
  height: 138px;
  object-fit: cover;
  display: block;
  background: #eef2f8;
}

.detail-evidence span {
  display: block;
  padding: 7px 9px;
  color: #172338 !important;
  font-size: 12px;
}

.detail-evidence-empty {
  padding: 15px;
  border: 1px dashed #dbe4ee;
  background: #f9fafc;
  border-radius: 5px;
  color: #172338 !important;
  font-size: 13px !important;
}

.knowledge-review-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin: 6px 0 17px;
}

.knowledge-review-options label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font-weight: 400;
  color: #172338 !important;
  font-size: 13px !important;
}

.knowledge-review-options input {
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: #285ed6;
  cursor: pointer;
}

.detail-review textarea {
  min-height: 74px;
  max-height: 150px;
  width: 100%;
}

/* Prompt Drawer */
.knowledge-prompt-overlay.overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 410 !important;
  align-items: stretch !important;
  justify-content: flex-end !important;
  padding: 0 !important;
  background: rgba(22, 33, 51, 0.36) !important;
}

.knowledge-prompt-drawer {
  box-sizing: border-box;
  width: min(560px, 100vw);
  height: 100dvh;
  max-height: 100dvh;
  flex: none;
  background: #fff;
  box-shadow: -15px 0 45px #15223830;
  border-left: 1px solid #d6deeb;
  display: flex;
  flex-direction: column;
  min-width: 0;
  animation: knowledge-drawer-enter 0.15s ease-out;
}

@keyframes knowledge-drawer-enter {
  from {
    transform: translateX(24px);
    opacity: 0.7;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.knowledge-prompt-drawer-head {
  flex: none;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e3e9f1;
  padding: 0 22px;
}

.knowledge-prompt-drawer-head h2 {
  font-size: 17px !important;
  line-height: 1.5;
  font-weight: 650 !important;
  margin: 0;
  color: #172338 !important;
}

.knowledge-prompt-drawer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.knowledge-prompt-drawer-close {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #172338 !important;
  cursor: pointer;
  padding: 7px;
}

.knowledge-prompt-drawer-close svg {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
}

.knowledge-prompt-drawer-close:hover,
.knowledge-prompt-drawer-close:focus-visible {
  background: #edf2f8;
}

.knowledge-prompt-drawer-content {
  padding: 22px;
  overflow: auto;
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
}

.knowledge-prompt-readonly {
  font: inherit;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 13px !important;
  line-height: 1.9;
  color: #172338 !important;
  margin: 0;
}

/* Confirm Modal */
.confirm-overlay {
  z-index: 170;
}

.confirm-modal {
  width: min(485px, calc(100vw - 32px));
  max-height: calc(100dvh - 40px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 18px 55px rgba(16, 31, 55, 0.22);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.confirm-modal .modalheader {
  padding: 17px 22px;
  border-bottom: 1px solid #e1e7ef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.confirm-modal .modalheader h2 {
  font-size: 16px !important;
  font-weight: 650 !important;
  margin: 0;
  color: #172338 !important;
}

.confirm-modal .modalcontent {
  padding: 22px;
  line-height: 1.75;
  color: #172338 !important;
  font-size: 13px !important;
}

.confirm-modal .modalfooter {
  border-top: 1px solid #e5eaf2;
  padding: 12px 22px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

/* Create Overlay */
#create-overlay > .modal {
  width: min(var(--iad-content-modal-width), calc(100vw - 2 * var(--iad-content-modal-gutter))) !important;
  height: min(var(--iad-content-modal-height), calc(100dvh - 2 * var(--iad-content-modal-gutter))) !important;
  max-height: none !important;
  max-width: none !important;
  min-height: 0 !important;
  border-radius: var(--iad-content-modal-radius) !important;
  border: 1px solid #d9e2ed !important;
  background: #fff;
  box-shadow: 0 22px 65px rgba(20, 35, 63, 0.26) !important;
  display: flex;
  flex-direction: column;
}

#create-overlay .modalheader {
  padding: 19px 24px;
  border-bottom: 1px solid #e6ebf1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#create-overlay .modalheader h2 {
  font-size: 19px !important;
  margin: 0;
  font-weight: 650 !important;
  color: #172338 !important;
}

#create-overlay .modalheader .subtitle {
  color: #172338 !important;
  font-size: 12px !important;
  margin: 4px 0 0;
}

#create-overlay .modalcontent {
  overflow: auto;
  padding: 22px 24px 24px;
  flex: 1;
}

#create-overlay .modalfooter {
  border-top: 1px solid #e6ebf1;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fff;
}

.modalgrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 25px;
}

.form-section {
  margin: 0 0 22px;
}

.form-section h3 {
  font-size: 15px !important;
  margin: 0 0 13px;
  font-weight: 650 !important;
  color: #172338 !important;
}

.rangebar {
  padding: 14px 15px;
  border: 1px solid #d8e1ed;
  background: #f7f9fc;
  border-radius: 5px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
  align-items: center;
}

.rangebar strong {
  display: block;
  font-size: 13px !important;
  margin-top: 3px;
  color: #172338 !important;
}

.kindrow {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border: 1px solid #d6e0ed;
  border-radius: 5px;
  cursor: pointer;
  background: white;
  font-size: 13px !important;
  color: #172338 !important;
}

.toggle:has(input:checked) {
  border-color: #97b2e7;
  background: #eef3ff;
  color: #1d54b6 !important;
}

.preset-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 9px;
}

.direction-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.direction {
  display: flex;
  align-items: start;
  gap: 9px;
  border: 1px solid #d9e2ee;
  border-radius: 5px;
  padding: 10px 11px;
  cursor: pointer;
  min-height: 64px;
}

.direction:hover {
  background: #f8faff;
}

.direction:has(input:checked) {
  background: #f0f5ff;
  border-color: #b3c8f1;
}

.direction strong {
  display: block;
  font-size: 13px !important;
  margin-bottom: 3px;
  color: #172338 !important;
}

.direction span {
  display: block;
  color: #172338 !important;
  font-size: 12px !important;
  line-height: 1.45;
}

.sectionrow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
}

.sectionrow h3 {
  margin: 0;
}

.sectionrow small {
  color: #172338 !important;
}

.customrow {
  display: flex;
  gap: 9px;
  margin-top: 10px;
}

.customrow input {
  flex: 1;
}

.tokens {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.token {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  background: #eef2f8;
  color: #172338 !important;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 12px;
}

.token button {
  border: 0;
  background: none;
  color: #172338 !important;
  cursor: pointer;
}

.promptactions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.counter {
  display: flex;
  justify-content: space-between;
  color: #172338 !important;
  font-size: 12px !important;
  padding-top: 6px;
}

.subtlebox {
  border: 1px solid #dfe6ef;
  border-radius: 6px;
  background: #f8fafc;
  padding: 14px 15px;
  margin-bottom: 14px;
}

.sidecaption {
  font-weight: 650 !important;
  font-size: 14px !important;
  margin: 0 0 10px;
  color: #172338 !important;
}

.summarylist {
  display: grid;
  grid-template-columns: 1fr auto;
  row-gap: 11px;
  font-size: 13px !important;
  color: #172338 !important;
}

.summarylist b {
  color: #172338 !important;
  text-align: right;
}

.samples {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 9px;
  margin: 12px 0;
}

.sample {
  border: 1px solid #d5dfe9;
  border-radius: 5px;
  padding: 0;
  background: white;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.sample img {
  display: block;
  width: 100%;
  height: 93px;
  object-fit: cover;
}

.sample .sampleid {
  display: block;
  text-align: center;
  font-size: 11px;
  color: #172338 !important;
  padding: 6px 0;
}

.sample.checked {
  border: 2px solid #285fc9;
}

.sample.checked::after {
  content: '✓';
  position: absolute;
  right: 6px;
  top: 6px;
  border-radius: 3px;
  background: #285fc9;
  color: #fff;
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
}

.alert {
  padding: 10px 12px;
  border-radius: 5px;
  border: 1px solid #eadab2;
  background: #fff9ed;
  color: #896324;
  font-size: 12px;
  margin-bottom: 10px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 180;
  background: rgba(10, 16, 25, 0.93);
  display: none;
  align-items: center;
  justify-content: center;
}

.lightbox.show {
  display: flex !important;
}

.lightbox img {
  max-width: 85vw;
  max-height: 84vh;
  object-fit: contain;
}

.lbnav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #ffffff22;
  color: white;
  border: 0;
  font-size: 35px;
  border-radius: 5px;
  width: 48px;
  height: 60px;
  cursor: pointer;
}

.lbnav.left {
  left: 18px;
}

.lbnav.right {
  right: 18px;
}

.lbclose {
  position: absolute;
  right: 25px;
  top: 20px;
  background: #ffffff22;
  color: white;
  border: 0;
  font-size: 25px;
  width: 39px;
  height: 39px;
  border-radius: 5px;
  cursor: pointer;
}

.lbcaption {
  position: absolute;
  bottom: 22px;
  color: white;
  font-size: 13px;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #23354e;
  color: white;
  border-radius: 6px;
  padding: 10px 18px;
  z-index: 990;
  box-shadow: 0 6px 22px #1220393d;
  display: none;
  font-size: 13px;
}

.toast.show {
  display: block;
}

.hide {
  display: none !important;
}
`;
