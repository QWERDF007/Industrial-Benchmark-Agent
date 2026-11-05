import type {Dataset, DatasetGroup} from '../shared/contracts.js';

export const UNGROUPED_SCOPE_ID = '__ungrouped__';
export type DatasetHierarchyGroup = DatasetGroup & {kind:'group'|'ungrouped'};

/** Read-only scope projection; ungrouped data never creates a stored parent. */
export function buildHierarchyGroups(datasets:Dataset[], groups:DatasetGroup[] = []):DatasetHierarchyGroup[] {
  const result:DatasetHierarchyGroup[]=groups.map(group=>({...group,kind:'group'}));
  if(datasets.some(dataset=>!dataset.group_id))result.push({group_id:UNGROUPED_SCOPE_ID,name:'未分组',kind:'ungrouped'});
  return result;
}

export function getDatasetGroupId(dataset:Dataset):string {
  return dataset.group_id||UNGROUPED_SCOPE_ID;
}
