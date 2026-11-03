/**
 * Derives parent dataset groups from dataset list and existing groups.
 * Provides a single source of truth (SSOT) across all workbench pages.
 */
export function buildHierarchyGroups(datasets, groups = []) {
    const list = [...groups];
    if (list.length === 0) {
        const hasFrame = datasets.some(d => d.name.includes("框胶") || d.image_dir?.includes("框胶"));
        const hasNode = datasets.some(d => d.name.includes("超节点") || d.image_dir?.includes("超节点"));
        if (hasFrame)
            list.push({ group_id: "group-1", name: "框胶大数据集" });
        if (hasNode)
            list.push({ group_id: "group-2", name: "超节点数据集" });
        if (list.length === 0 && datasets.length > 0) {
            list.push({ group_id: "default", name: "全部数据集" });
        }
    }
    return list;
}
/**
 * Matches a child dataset to its parent group_id.
 */
export function getDatasetGroupId(dataset, hierarchyGroups) {
    if (dataset.group_id && hierarchyGroups.some(g => g.group_id === dataset.group_id)) {
        return dataset.group_id;
    }
    if (dataset.name.includes("框胶") || dataset.image_dir?.includes("框胶")) {
        const match = hierarchyGroups.find(g => g.group_id === "group-1" || g.name.includes("框胶"));
        if (match)
            return match.group_id;
    }
    if (dataset.name.includes("超节点") || dataset.image_dir?.includes("超节点")) {
        const match = hierarchyGroups.find(g => g.group_id === "group-2" || g.name.includes("超节点"));
        if (match)
            return match.group_id;
    }
    return hierarchyGroups[0]?.group_id || "default";
}
