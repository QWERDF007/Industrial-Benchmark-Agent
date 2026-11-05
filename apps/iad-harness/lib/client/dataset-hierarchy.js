export const UNGROUPED_SCOPE_ID = '__ungrouped__';
/** Read-only scope projection; ungrouped data never creates a stored parent. */
export function buildHierarchyGroups(datasets, groups = []) {
    const result = groups.map(group => ({ ...group, kind: 'group' }));
    if (datasets.some(dataset => !dataset.group_id))
        result.push({ group_id: UNGROUPED_SCOPE_ID, name: '未分组', kind: 'ungrouped' });
    return result;
}
export function getDatasetGroupId(dataset) {
    return dataset.group_id || UNGROUPED_SCOPE_ID;
}
