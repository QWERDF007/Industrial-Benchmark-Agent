import React from "react";
import type { ExploredDirection, ExplorationSnapshot } from "../../shared/domain.generated.js";
export declare function DirectionDetail({ snapshot, direction, onClose, onGo, }: {
    snapshot: ExplorationSnapshot;
    direction: ExploredDirection;
    onClose(): void;
    onGo?(kind: "normal" | "defect"): void;
}): React.JSX.Element;
//# sourceMappingURL=DirectionDetail.d.ts.map