import React, { useState } from "react";
import type { VisualEvidence } from "../../shared/domain.generated.js";
import { Modal } from "./Modal.js";
import {
  ImageCanvas,
  type ImageNavigation,
  type ImageSource,
} from "./ImageCanvas.js";
import { MediaImage, MediaLoad } from "./MediaLoad.js";
export { AnnotatedImage } from "./ImageCanvas.js";
export type { ImageSource, ImageNavigation } from "./ImageCanvas.js";

export interface EvidenceCollection {
  title: string;
  instruction: string;
  images: { image: ImageSource; label: string; id: string; group: string; originalSize:VisualEvidence["original_size"] }[];
  index: number;
}

export function ImageViewer({
  image,
  onClose,
  navigation,
  collection,
}: {
  image: ImageSource;
  onClose(): void;
  navigation?: ImageNavigation;
  collection?: EvidenceCollection;
}) {
  const [index, setIndex] = useState(collection?.index || 0);
  const current = collection?.images[index];
  const context = collection && (
    <aside className="iad-viewer-context">
      <h3>当前方向</h3>
      <p>{collection.title}</p>
      <p>{collection.instruction}</p>
      <section>
        <h3>图像证据 · {collection.images.length}</h3>
        {[...new Set(collection.images.map((item) => item.group))].map(
          (group) => (
            <div key={group} className="iad-viewer-evidence-group">
              <h4>
                {group} ·{" "}
                {
                  collection.images.filter((item) => item.group === group)
                    .length
                }
              </h4>
              <MediaLoad className="iad-viewer-thumbnails">
                {collection.images
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const position = collection.images.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        aria-label={`切换证据 ${item.label}`}
                        aria-current={index === position}
                        onClick={() => setIndex(position)}
                      >
                        <MediaImage
                          src={item.image.src}
                          alt={item.label}
                          loading="lazy"
                        />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </MediaLoad>
            </div>
          ),
        )}
      </section>
      <details>
        <summary>图像信息</summary>
        <dl>
          <dt>文件名</dt>
          <dd>{current?.image.title}</dd>
          <dt>证据 ID</dt>
          <dd>{current?.id}</dd>
          <dt>原始尺寸</dt>
          <dd>
            {current?.originalSize[0]} × {current?.originalSize[1]}
          </dd>
        </dl>
      </details>
    </aside>
  );
  const scopedNavigation = collection
    ? {
        previous: index > 0,
        next: index < collection.images.length - 1,
        busy: false,
        error: "",
        move: (offset: -1 | 1) => setIndex((value) => value + offset),
      }
    : navigation;
  return (
    <Modal
      title="原图检视器"
      className="iad-viewer-dialog"
      header={false}
      onClose={onClose}
    >
      <ImageCanvas
        image={
          current
            ? {
                ...current.image,
                caption: `${current.label} · ${index + 1} / ${collection!.images.length}`,
              }
            : image
        }
        onClose={onClose}
        navigation={scopedNavigation}
        context={context}
        closeLabel={collection ? "返回方向详情" : undefined}
      />
    </Modal>
  );
}
