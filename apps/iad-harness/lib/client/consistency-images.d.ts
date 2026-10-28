import type { GalleryImage } from '../shared/domain.generated.js';
import type { EvidenceBundle, RetrievalMember } from '../shared/contracts.js';
import type { ImageSource } from './components/ImageCanvas.js';
export declare function frozenConsistencyImage(bundle: EvidenceBundle, side: 'left' | 'right'): ImageSource;
export declare function frozenConsistencyMember(bundle: EvidenceBundle): RetrievalMember;
export declare const galleryImageUrl: (image: GalleryImage) => string;
//# sourceMappingURL=consistency-images.d.ts.map