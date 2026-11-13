import type { DinoEncoderEdit } from '../shared/domain.generated.js';
type Patch = Partial<Omit<DinoEncoderEdit, 'expected_revision'>>;
export declare function useImageEncoderSettings(): {
    settings: {
        model_id: import("../shared/domain.generated.js").DinoModelId | null;
        batch_size: number;
        input_size: number;
    } | undefined;
    models: import("../shared/domain.generated.js").Models2;
    save: (patch: Patch) => void;
    retry: () => void;
    loading: boolean;
    saving: boolean;
    saved: boolean;
    error: string;
};
export {};
//# sourceMappingURL=useImageEncoderSettings.d.ts.map