import Link from "next/link";
import type { MouseEvent } from "react";

export function Brand({ href = "/", compact = false, onClick }: { href?: string; compact?: boolean; onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return <Link className={compact ? "brand brand-compact" : "brand"} href={href} aria-label="SpreadNotes home" onClick={onClick}>
    <span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span>
    <span>SpreadNotes<span className="brand-period">.</span></span>
  </Link>;
}
