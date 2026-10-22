import React, { useEffect, useState } from "react";
import { Modal } from "./Modal.js";

export function ReviewWorkspace({ sampleId, queue, filters, image, decision, information }: {
  sampleId: string; queue: React.ReactNode; filters: React.ReactNode; image: React.ReactNode; decision: React.ReactNode; information: React.ReactNode;
}) {
  const [panel, setPanel] = useState<"queue" | "decision" | null>(null);
  useEffect(() => setPanel(null), [sampleId]);
  return <section className="iad-review-focused" aria-label="专注复核">
    {filters}<div className="iad-review-tools"><button className="iad-queue-trigger" onClick={() => setPanel("queue")}>打开复核队列</button><button className="iad-decision-trigger" onClick={() => setPanel("decision")}>打开人工裁决</button></div>
    <div className="iad-review-columns">
      <aside className="iad-review-queue-slot" aria-label="待复核样本">{panel !== "queue" && queue}</aside>
      <div className="iad-review-center">{image}<details className="iad-review-information"><summary>样本信息与模型观察</summary>{information}</details></div>
      <aside className="iad-review-decision-slot" aria-label="人工裁决面板">{panel !== "decision" && decision}</aside>
    </div>
    {panel && <Modal title={panel === "queue" ? "复核队列" : "人工裁决"} className="iad-review-drawer" onClose={() => setPanel(null)}>{panel === "queue" ? queue : decision}</Modal>}
  </section>;
}
