declare const sections: readonly [readonly ['conclusion', '总体结论'], readonly ['distribution', '数据分布'], readonly ['consistency', '数据是否自洽'], readonly ['quality', '标注质量与复核重点'], readonly ['coverage', '覆盖了哪些视觉场景'], readonly ['independence', '样本独立性与代表性'], readonly ['capabilities', '能够检验模型哪些能力'], readonly ['usability', '当前适合哪些用途、还缺什么'], readonly ['knowledge', '引用知识及审计结果']];
export type AuditReportSectionKey = typeof sections[number][0] | 'score';
type SectionHeading = {
    title: string;
    prefix: string;
};
type SectionMap = Record<typeof sections[number][0], SectionHeading> & {
    score?: SectionHeading;
};
export declare const auditReportSections: SectionMap;
export declare const scoredAuditReportSections: SectionMap;
export declare const consistencyAuditReportSections: SectionMap;
export declare const AuditReportSectionsContext: import("react").Context<SectionMap>;
export declare const useAuditReportSections: () => SectionMap;
export declare const auditDistributionMetricLabels: {
    readonly image_aspect_ratio: '图像宽高比';
    readonly box_aspect_ratio: '实例外接矩形宽高比';
    readonly relative_area: '实例面积占图像比例';
};
export declare const auditDistributionClassLabel: (name: string, classification?: boolean) => string;
export declare const auditMetadataLabels: Record<string, string>;
export declare function auditMetadataValue(key: string, value: string): string;
export {};
//# sourceMappingURL=audit-report.d.ts.map