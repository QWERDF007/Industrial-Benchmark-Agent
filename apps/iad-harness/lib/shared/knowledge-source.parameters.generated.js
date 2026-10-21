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
        "title": "Page Size",
        "default": 10
    },
    "search": {
        "type": "string",
        "title": "Search",
        "default": ""
    }
};
