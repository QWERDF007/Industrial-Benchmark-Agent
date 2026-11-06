import React from 'react';
import type {ImageQualityLabel} from '../dataset-image-annotations.js';

export function ImageQualityBadge({label}:{label?:ImageQualityLabel}) {
  return label?<span className="iad-image-quality" data-quality={label}>{label}</span>:null;
}
