import React from 'react';
import type {Dataset, DatasetGroup} from '../../shared/contracts.js';
import {MultiSelect, Select} from './Select.js';

export interface DatasetScopeSelectorProps {
  groups: DatasetGroup[]; selectedGroupId: string; onGroupChange(groupId: string): void;
  childDatasets: Dataset[]; selectedChildIds: string[] | Set<string>; onChildToggle(childId: string): void;
  disabled?: boolean; className?: string; groupId?: string; childId?: string; childMenuId?: string;
  groupLabel?: string; childLabel?: string; emptyChildText?: string; children?: React.ReactNode;
}

export function DatasetScopeSelector({groups, selectedGroupId, onGroupChange, childDatasets, selectedChildIds, onChildToggle,
  disabled = false, className = 'dataset-panel', groupId = 'parent', childId = 'child', childMenuId,
  groupLabel = '数据集', childLabel = '子数据集', emptyChildText = '暂无子数据集', children}: DatasetScopeSelectorProps) {
  return <div className={`iba-scope-selector ${className}`} aria-label={`选择${groupLabel}`}>
    <div className="iad-scope-parent"><label htmlFor={groupId}>{groupLabel}</label>
      <Select id={groupId} value={selectedGroupId} disabled={disabled} onChange={event => onGroupChange(event.target.value)}>
        {groups.map(group => <option key={group.group_id} value={group.group_id}>{group.name}</option>)}
      </Select>
    </div>
    <div className="iad-scope-child"><label htmlFor={childId}>{childLabel}</label>
      <MultiSelect id={childId} menuId={childMenuId} label={childLabel} options={childDatasets.map(dataset => ({value:dataset.dataset_id,label:dataset.name}))}
        selected={selectedChildIds} onToggle={onChildToggle} disabled={disabled} emptyText={emptyChildText} />
    </div>
    {children}
  </div>;
}
