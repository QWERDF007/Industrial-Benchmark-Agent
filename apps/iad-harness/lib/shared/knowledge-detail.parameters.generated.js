/* Generated from Python KnowledgeDetailQuery by scripts/generate-contracts.js. */
export const knowledgeDetailParameters = {
    "version_id": {
        "type": "string",
        "title": "Version Id",
        "required": true
    },
    "check_id": {
        "type": "string",
        "title": "Check Id"
    },
    "section": {
        "type": "string",
        "enum": [
            "checks",
            "discovery"
        ],
        "title": "Section",
        "default": "checks"
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
    }
};
