export const navigation = {
    'industrial-datasets': { label: '数据集管理', chapter: '数据准备' },
    'industrial-images': { label: '图像浏览', chapter: '数据准备' },
    'industrial-exploration': { label: '方向探索', chapter: '知识构建' },
    'industrial-knowledge': { label: '知识挖掘', chapter: '知识构建' },
    'industrial-audit': { label: '模型审计', chapter: '质量审核' },
    'industrial-review': { label: '人工复核', chapter: '质量审核' },
    'industrial-model-settings': { label: '模型设置', chapter: '工具' },
};
export const pages = Object.fromEntries(Object.entries(navigation).map(([id, page]) => [id, page.label]));
