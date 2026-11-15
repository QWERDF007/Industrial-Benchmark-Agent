import type { JobView as JobSnapshot } from '../../shared/domain.generated.js';
import React from "react";
import type { Dataset, ReviewDecisionRecord } from "../../shared/contracts.js";
import { type ModalPresentation, type ModalProps } from "./Modal.js";
import type { SampleNavigation } from "../useSampleNavigation.js";
export declare function SampleInspector({ dataset, sampleId, mode, revision, onReviewed, jobs, onJobsChanged, navigation, queue, filters, advanceOnSubmit, panel }: {
    panel?: Pick<ModalProps, "onClose" | "restoreFocus"> & {
        presentation: ModalPresentation;
        onOpen(open: boolean): void;
    };
    queue?: React.ReactNode;
    filters?: React.ReactNode;
    advanceOnSubmit?: boolean;
    navigation?: SampleNavigation;
    jobs: JobSnapshot[];
    onJobsChanged(): void;
    dataset: Dataset;
    sampleId: string;
    mode: "model" | "review" | "browse";
    revision: number;
    onReviewed(record: ReviewDecisionRecord, relativePath: string): void;
}): React.JSX.Element;
//# sourceMappingURL=SampleInspector.d.ts.map