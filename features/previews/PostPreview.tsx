import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";
import type { DemoMedia } from "../demo/store";
import type { Platform } from "../platforms/types";
import { NetworkMark } from "../platforms/NetworkMark";

export function PostPreview({ platform, text, media }: { platform?: Platform; text: string; media: DemoMedia[] }) {
  return <div className="post-preview"><div className="post-preview-header"><span className="preview-person">S</span><div><strong>Your workspace</strong><small>Just now · Demo preview</small></div>{platform && <NetworkMark id={platform.id} />}</div><p className="post-preview-text">{text || "Your words will appear here as you write."}</p>{media.length ? <div className="post-preview-media">{media[0].kind === "image" || media[0].url.endsWith(".svg") ? <img src={media[0].url} alt={media[0].name} /> : media[0].kind === "video" ? <video src={media[0].url} controls aria-label={media[0].name} /> : <div className="preview-pdf">PDF · {media[0].name}</div>}{media.length > 1 && <span className="media-count">+{media.length - 1}</span>}</div> : <div className="post-preview-placeholder"><span>SHARE<br />THE<br /><em>THOUGHT.</em></span><span>SPREADNOTES / DEMO</span></div>}<div className="post-preview-social"><Heart size={17} /><MessageCircle size={17} /><Repeat2 size={17} /><Send size={17} /></div></div>;
}
