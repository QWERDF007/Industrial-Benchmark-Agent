import { jsx as _jsx } from "react/jsx-runtime";
import { Button } from './Button.js';
export function AnalysisExportButton({ versionId }) {
    return _jsx(Button, { "aria-label": "\u5BFC\u51FA\u5F53\u524D\u4F5C\u4E1A\u6210\u679C", "data-version-id": versionId, onClick: () => window.location.assign(`/api/iad/analysis/publications/${encodeURIComponent(versionId)}/export`), children: "\u5BFC\u51FA\u6210\u679C" });
}
