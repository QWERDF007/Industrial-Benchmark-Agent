/* Generated from Python dataset models by scripts/generate-contracts.js. */
export const folderRulesParameter = {
    "type": "array",
    "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
            "path": {
                "type": "string",
                "description": "Relative directory path under dataset root, or '.' for root images",
                "title": "Path",
                "required": true
            },
            "role": {
                "type": "string",
                "enum": [
                    "normal",
                    "anomaly",
                    "unlabeled",
                    "excluded"
                ],
                "description": "Role assigned to this directory",
                "title": "Role",
                "required": true
            }
        },
        "title": "FolderRule"
    }
};
export const annotationPolicyParameter = {
    "type": "object",
    "additionalProperties": false,
    "properties": {
        "policy_id": {
            "type": "string",
            "title": "Policy Id"
        },
        "annotation_role": {
            "type": "string",
            "enum": [
                "REFERENCE",
                "PREDICTION",
                "UNKNOWN"
            ],
            "title": "Annotation Role",
            "default": "UNKNOWN"
        },
        "annotation_coverage": {
            "type": "string",
            "enum": [
                "EXHAUSTIVE",
                "PARTIAL",
                "UNKNOWN"
            ],
            "title": "Annotation Coverage",
            "default": "UNKNOWN"
        },
        "category_mapping": {
            "type": "object",
            "additionalProperties": true,
            "properties": {},
            "title": "Category Mapping"
        }
    },
    "title": "AnnotationPolicy"
};
