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
  "evidence_role": {
    "type": "string",
    "enum": [
      "support",
      "counter"
    ],
    "title": "Evidence Role"
  },
  "section": {
    "type": "string",
    "enum": [
      "checks",
      "discovery",
      "evidence"
    ],
    "title": "Section",
    "default": "checks"
  },
  "evidence_ids": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "title": "Evidence Ids"
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
  },
  "review_status": {
    "type": "string",
    "enum": [
      "all",
      "pending",
      "confirmed",
      "rejected",
      "conflict"
    ],
    "title": "Review Status",
    "default": "all"
  }
} as const;
