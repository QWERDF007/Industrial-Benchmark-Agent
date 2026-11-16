import React from "react";

export function ReviewWorkspace({ queue, filters, image, decision, information }: {
  queue: React.ReactNode; filters: React.ReactNode; image: React.ReactNode; decision: React.ReactNode; information: React.ReactNode;
}) {
  return <section className="iad-review-focused" aria-label="专注复核">
    {filters}
    <div className="iad-review-columns">
      <aside className="iad-review-queue-slot" aria-label="待复核样本">{queue}</aside>
      <div className="iad-review-center">{image}<details className="iad-review-information"><summary>样本信息与模型观察</summary>{information}</details></div>
      <aside className="iad-review-decision-slot" aria-label="人工裁决面板">{decision}</aside>
    </div>
  </section>;
}
