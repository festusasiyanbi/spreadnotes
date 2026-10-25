import type { AdNetworkId, PlatformId } from "./types";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaThreads, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { SiMeta } from "react-icons/si";

const icons = {
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  threads: FaThreads,
  x: FaXTwitter,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  meta: SiMeta,
};

export function NetworkMark({ id, size = "normal" }: { id: PlatformId | AdNetworkId; size?: "normal" | "large" }) {
  const Icon = icons[id];
  return <span className={`network-mark network-${id} ${size === "large" ? "network-mark-large" : ""}`} aria-hidden="true"><Icon size={size === "large" ? 21 : 16} /></span>;
}
