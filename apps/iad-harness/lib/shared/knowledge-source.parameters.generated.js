/* Generated from Python KnowledgeSourceQuery by scripts/generate-contracts.js. */
export const knowledgeSourceParameters = {
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
