import { Bookmark, Heart, MessageCircle, MoreHorizontal, Repeat2, Send, Share2, ThumbsUp } from "lucide-react";
import type { SimulationMedia, SocialProfile } from "../simulation/store";
import type { Platform, PlatformId } from "../platforms/types";
import { MediaGallery } from "./media-gallery";

const actions = {
  linkedin: [{ label: "Like", icon: ThumbsUp }, { label: "Comment", icon: MessageCircle }, { label: "Repost", icon: Repeat2 }, { label: "Send", icon: Send }],
  instagram: [{ label: "Like", icon: Heart }, { label: "Comment", icon: MessageCircle }, { label: "Share", icon: Send }, { label: "Save", icon: Bookmark }],
  facebook: [{ label: "Like", icon: ThumbsUp }, { label: "Comment", icon: MessageCircle }, { label: "Share", icon: Share2 }],
  threads: [{ label: "Like", icon: Heart }, { label: "Reply", icon: MessageCircle }, { label: "Repost", icon: Repeat2 }, { label: "Share", icon: Send }],
  x: [{ label: "Reply", icon: MessageCircle }, { label: "Repost", icon: Repeat2 }, { label: "Like", icon: Heart }, { label: "Share", icon: Share2 }],
  tiktok: [{ label: "Like", icon: Heart }, { label: "Comment", icon: MessageCircle }, { label: "Share", icon: Share2 }],
  youtube: [{ label: "Like", icon: ThumbsUp }, { label: "Comment", icon: MessageCircle }, { label: "Share", icon: Share2 }],
} satisfies Record<PlatformId, { label: string; icon: typeof Heart }[]>;

export function PostPreview({ platform, text, media, youtubeTitle, profile }: { platform?: Platform; text: string; media: SimulationMedia[]; youtubeTitle?: string; profile?: SocialProfile }) {
  const id = platform?.id ?? "linkedin";
  const name = profile?.name.trim() || `Your ${platform?.name ?? "social"} profile`;
  const username = profile?.username.trim() || `@your${id}`;
  const mediaFirst = id === "instagram" || id === "tiktok" || id === "youtube";
  const images = media.filter((item) => item.kind === "image").length;
  const format = images > 1 ? id === "linkedin" ? "MULTI-IMAGE POST" : id === "tiktok" ? "PHOTO POST" : id === "x" || id === "facebook" ? "MULTI-PHOTO POST" : "CAROUSEL POST" : media[0]?.kind === "video" ? "VIDEO POST" : media[0]?.kind === "document" ? "DOCUMENT POST" : media.length ? "IMAGE POST" : "TEXT POST";
  const copy = <>{id === "youtube" && <strong className="youtube-preview-title">{youtubeTitle || "Your video title"}</strong>}<p className="post-preview-text">{text || "Your words will appear here as you write."}</p></>;
  const visual = media.length ? <div className="post-preview-media"><MediaGallery key={`${id}-${media.map((item) => item.id).join("-")}`} media={media} label={platform?.name ?? "Post"} /></div> : <div className="post-preview-placeholder"><span>SHARE<br />THE<br /><em>THOUGHT.</em></span><span>SPREADNOTES / SAMPLE</span></div>;

  return <div className={`post-preview post-preview-${id}`}>
    <div className="post-preview-header"><span className="preview-person">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{username} · just now</small></div><MoreHorizontal size={18} aria-hidden="true" /></div>
    <span className="post-preview-format">{format}{media.length > 1 ? ` · ${media.length} ITEMS` : ""}</span>
    {mediaFirst ? <>{visual}{copy}</> : <>{copy}{visual}</>}
    <div className="post-preview-social">{actions[id].map(({ label, icon: Icon }) => <span key={label} aria-label={label}><Icon size={16} /><small>{label}</small></span>)}</div>
  </div>;
}
