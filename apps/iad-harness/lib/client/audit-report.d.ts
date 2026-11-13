declare const sections: readonly [readonly ['conclusion', '总体结论'], readonly ['distribution', '数据分布'], readonly ['consistency', '数据是否自洽'], readonly ['quality', '标注质量与复核重点'], readonly ['coverage', '覆盖了哪些视觉场景'], readonly ['independence', '样本独立性与代表性'], readonly ['capabilities', '能够检验模型哪些能力'], readonly ['usability', '当前适合哪些用途、还缺什么'], readonly ['knowledge', '引用知识及审计结果']];
export type AuditReportSectionKey = typeof sections[number][0];
export declare const auditReportSections: Record<AuditReportSectionKey, {
    title: string;
    prefix: string;
}>;
export declare const auditMetadataLabels: Record<string, string>;
export declare function auditMetadataValue(key: string, value: string): string;
export {};
//# sourceMappingURL=audit-report.d.ts.map