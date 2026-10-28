import React, { createContext, useContext, useState } from "react";

const RetryContext = createContext(0);

export function MediaLoad({ children, className = "", primarySource }: { children: React.ReactNode; className?: string; primarySource?: string }) {
  const [attempt, setAttempt] = useState(0);
  const [failures, setFailures] = useState<Map<string, string>>(new Map());
  const [settledSource, setSettledSource] = useState("");
  const loading = !!primarySource && primarySource !== settledSource;
  function capture(event: React.SyntheticEvent) {
    const target = event.target as Element;
    const source = target.getAttribute?.("data-media-source");
    if (!source) return;
    if (source === primarySource) setSettledSource(source);
    setFailures(previous => {
      const next = new Map(previous);
      if (event.type === "error") next.set(source, target.getAttribute("data-media-label") || target.getAttribute("alt") || "图像");
      else next.delete(source);
      return next;
    });
  }
  return <RetryContext.Provider value={attempt}><div className={`iad-media-load ${className}`} aria-busy={primarySource ? loading : undefined} onErrorCapture={capture} onLoadCapture={capture}>
    {children}
    {loading && <div className="iad-media-loading" role="status">正在加载图像…</div>}
    {!!failures.size && <div className="iad-media-error" role="alert">
      {[...new Set(failures.values())].map(label => <span key={label}>{label}无法加载，请检查资源是否存在或完整。</span>)}
      <button type="button" aria-label="重新加载图像" onClick={() => { setSettledSource(""); setFailures(new Map()); setAttempt(previous => previous + 1); }}>重新加载</button>
    </div>}
  </div></RetryContext.Provider>;
}

function useRetryUrl(source: string) {
  const attempt = useContext(RetryContext);
  if (!attempt) return source;
  const url = new URL(source, window.location.href);
  url.searchParams.set("_retry", String(attempt));
  return url.href;
}

export function MediaImage({ src = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img {...props} src={useRetryUrl(src)} data-media-source={src} />;
}

export function MediaMask({ href = "", ...props }: React.SVGProps<SVGImageElement>) {
  return <image {...props} href={useRetryUrl(href)} data-media-source={href} data-media-label="标注像素" />;
}
