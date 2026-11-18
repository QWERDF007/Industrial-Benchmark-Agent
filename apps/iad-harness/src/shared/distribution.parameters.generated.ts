/* Generated from Python audit distribution models. */
export const auditDistributionParameters = {
  "dataset_id": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Dataset Id"
  },
  "category": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "null"
      }
    ],
    "title": "Category"
  },
  "scoring": {
    "type": "boolean",
    "title": "Scoring",
    "default": false
  }
} as const;
