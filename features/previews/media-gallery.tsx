"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Play } from "lucide-react";
import type { SimulationMedia } from "../simulation/store";

export function MediaGallery({ media, label }: { media: SimulationMedia[]; label: string }) {
  const [requestedIndex, setRequestedIndex] = useState(0);
  if (!media.length) return null;
  const index = Math.min(requestedIndex, media.length - 1);
  const current = media[index];
  const multiple = media.length > 1;
  const isPoster = current.kind === "video" && current.url.endsWith(".svg");

  return <div className="media-gallery" aria-label={`${label} media preview`}>
    <div className="media-gallery-stage">
      {current.kind === "image" || isPoster ? <img src={current.url} alt={current.altText || current.name} /> : current.kind === "video" ? <video key={current.id} src={current.url} controls aria-label={current.name} /> : <div className="media-gallery-document"><FileText size={30} /><strong>{current.name}</strong><span>Document preview</span></div>}
      {isPoster && <span className="media-gallery-poster"><Play size={13} /> Video concept</span>}
      {multiple && <><button className="media-gallery-arrow previous" type="button" onClick={() => setRequestedIndex((index - 1 + media.length) % media.length)} aria-label="Previous media"><ChevronLeft size={20} /></button><button className="media-gallery-arrow next" type="button" onClick={() => setRequestedIndex((index + 1) % media.length)} aria-label="Next media"><ChevronRight size={20} /></button><span className="media-gallery-count">{index + 1} / {media.length}</span></>}
    </div>
    {multiple && <div className="media-gallery-thumbs" aria-label="Choose media item">{media.map((item, itemIndex) => <button key={item.id} type="button" className={itemIndex === index ? "active" : ""} onClick={() => setRequestedIndex(itemIndex)} aria-label={`Show media ${itemIndex + 1}: ${item.name}`} aria-current={itemIndex === index ? "true" : undefined}>{item.kind === "image" || item.url.endsWith(".svg") ? <img src={item.url} alt="" /> : item.kind === "video" ? <Play size={16} /> : <FileText size={16} />}</button>)}</div>}
  </div>;
}
