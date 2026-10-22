import { themeStyles } from "./theme.js";
import { controlStyles } from "./controls.js";
import { modelsStyles } from "./styles/models.js";
import { explorationStyles } from "./styles/exploration.js";
import { baseStyles } from "./styles/base.js";
import { collectionsStyles } from "./styles/collections.js";
import { jobsStyles } from "./styles/jobs.js";
import { overlaysStyles } from "./styles/overlays.js";
import { formsStyles } from "./styles/forms.js";
import { reviewStyles } from "./styles/review.js";
import { knowledgeStyles } from "./styles/knowledge.js";
import { setupStyles } from "./styles/setup.js";

export const workbenchStyles = themeStyles + controlStyles
  + modelsStyles
  + explorationStyles
  + baseStyles
  + collectionsStyles
  + jobsStyles
  + overlaysStyles
  + formsStyles
  + reviewStyles
  + knowledgeStyles
  + setupStyles
;
