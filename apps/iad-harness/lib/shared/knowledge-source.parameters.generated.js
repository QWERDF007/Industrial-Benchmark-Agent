/* Generated from Python KnowledgeSourceQuery by scripts/generate-contracts.js. */
export const knowledgeSourceParameters = {
    "recheck_from_version": {
        "type": "string",
        "description": "仅查询所选版本中判据修订后尚待视觉重核验的历史合格来源",
        "title": "Recheck From Version"
    },
    "include_observed": {
        "type": "boolean",
        "description": "明确重核验选图时包含已观察的合格来源；不扩大冻结范围，不启动作业",
        "title": "Include Observed",
        "default": false
    },
    "scope_run_id": {
        "type": "string",
        "title": "Scope Run Id"
    },
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "kind": {
        "type": "string",
        "enum": [
            "normal",
            "defect"
        ],
        "title": "Kind",
        "required": true
    },
    "normal_version_id": {
        "type": "string",
        "title": "Normal Version Id"
    },
    "uncovered_from_version": {
        "type": "string",
        "description": "仅查询指定版本语义链尚未观察的新来源；已变更旧来源单列待重核验",
        "title": "Uncovered From Version"
    },
    "page": {
        "type": "integer",
        "title": "Page",
        "default": 1
    },
    "page_size": {
        "type": "integer",
        "description": "每页1..200，默认10；仅取本次已确认图组所需引用，不预先枚举全库",
        "title": "Page Size",
        "default": 10
    },
    "search": {
        "type": "string",
        "title": "Search",
        "default": ""
    }
};
