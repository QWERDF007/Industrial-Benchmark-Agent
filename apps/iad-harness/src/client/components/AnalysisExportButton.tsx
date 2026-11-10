import React from 'react';
import {Button} from './Button.js';

export function AnalysisExportButton({versionId}:{versionId:string}) {
  return <Button aria-label="导出当前作业成果" data-version-id={versionId}
    onClick={()=>window.location.assign(`/api/iad/analysis/publications/${encodeURIComponent(versionId)}/export`)}>导出成果</Button>;
}
