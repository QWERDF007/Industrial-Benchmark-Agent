/* Generated from Python MiningStart by scripts/generate-contracts.js. */
export const miningParameters = {
    "dataset_id": {
        "type": "string",
        "title": "Dataset Id",
        "required": true
    },
    "origin_session_id": {
        "type": "string",
        "title": "Origin Session Id"
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
    "model_name": {
        "type": "string",
        "title": "Model Name",
        "default": "Qwen/Qwen3.8-27B-FP8"
    },
    "sample_ids": {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "新增来源范围，与父版本仍合格来源合并核验；省略覆盖全部合格来源",
        "title": "Sample Ids"
    },
    "base_version_id": {
        "type": "string",
        "description": "人工修订所依据的当前同类型知识版本",
        "title": "Base Version Id"
    },
    "corrections": {
        "type": "array",
        "items": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
                "check_id": {
                    "type": "string",
                    "description": "冻结基准版本中的检查项ID",
                    "title": "Check Id",
                    "required": true
                },
                "instruction": {
                    "type": "string",
                    "description": "待视觉核验的人工修订建议，不是已证实事实",
                    "title": "Instruction",
                    "required": true
                }
            },
            "title": "KnowledgeCorrection"
        },
        "description": "待核验的人工修订，需同时指定base_version_id；不得直接作为事实",
        "title": "Corrections"
    }
};
