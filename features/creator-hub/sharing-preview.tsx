"use client";

import { type FormEvent, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Link2, LockKeyhole, RotateCcw, X } from "lucide-react";

function newKey() { return crypto.randomUUID().replaceAll("-", "").slice(0, 16); }

export function SharingPreview({ file, fileUrl, title }: { file: File; fileUrl: string; title: string }) {
  const [access, setAccess] = useState<"restricted" | "link">("restricted");
  const [id] = useState(newKey);
  const [token, setToken] = useState(newKey);
  const [downloads, setDownloads] = useState(true);
  const [viewers, setViewers] = useState<string[]>([]);
  const [viewerDraft, setViewerDraft] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<"watch" | "embed">("watch");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isImage = file.type === "image/webp";
  const link = `https://app.spreadnotes.example/watch/${id}?key=${token}`;
  const embed = `<iframe src="https://app.spreadnotes.example/embed/${id}?key=${token}" title="${title.replace(/[&<>"']/g, "") || "SpreadNotes video"}" width="640" height="360" allowfullscreen loading="lazy"></iframe>`;

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setMessage(`${label} copied`); }
    catch { setMessage("Copy was blocked by your browser. Select the text instead."); }
  }
  function openPreview(mode: "watch" | "embed") { setPreview(mode); dialogRef.current?.showModal(); }
  function changeAccess(next: "restricted" | "link") { setAccess(next); if (next === "link" && access !== "link") setToken(newKey()); setMessage(""); }
  function rotate() { setToken(newKey()); setMessage("New example link generated"); }
  function revoke() { setAccess("restricted"); setToken(newKey()); setMessage("Link access turned off"); }
  function addViewer(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const email = viewerDraft.trim().toLowerCase(); if (!email || viewers.includes(email)) return; setViewers((current) => [...current, email]); setViewerDraft(""); setMessage("Viewer added to this preview"); }

  return <section className="panel-card padded creator-sharing"><div className="panel-heading"><div><span className="eyebrow">03 / SHARE</span><h3>Choose how people can watch.</h3><p>Set viewing access, preview the player, and prepare a link or website embed.</p></div></div>
    <div className="creator-access-options" role="group" aria-label="Viewing access"><button type="button" className={access === "restricted" ? "selected" : ""} aria-pressed={access === "restricted"} onClick={() => changeAccess("restricted")}><LockKeyhole size={18} /><span><strong>Restricted</strong><small>Only you and invited members</small></span>{access === "restricted" && <Check size={17} />}</button><button type="button" className={access === "link" ? "selected" : ""} aria-pressed={access === "link"} onClick={() => changeAccess("link")}><Link2 size={18} /><span><strong>Anyone with the link</strong><small>View without signing in</small></span>{access === "link" && <Check size={17} />}</button></div>
    {access === "restricted" && <div className="creator-viewers"><strong>People with access</strong><p>You have owner access. Add viewers for this video.</p><form onSubmit={addViewer}><input type="email" aria-label="Viewer email" placeholder="name@example.com" value={viewerDraft} onChange={(event) => setViewerDraft(event.target.value)} required /><button className="button button-outline" type="submit">Add viewer</button></form>{viewers.length > 0 && <ul>{viewers.map((email) => <li key={email}><span>{email}</span><button className="icon-only" aria-label={`Remove ${email}`} onClick={() => setViewers((current) => current.filter((item) => item !== email))}><X size={15} /></button></li>)}</ul>}</div>}
    <label className="creator-download-toggle"><input type="checkbox" checked={downloads} onChange={(event) => setDownloads(event.target.checked)} /> Allow viewers to download</label>
    <div className="creator-share-fields"><label>Viewing link<input readOnly value={access === "link" ? link : "Enable link access to generate a link"} onFocus={(event) => event.currentTarget.select()} /></label><button className="button button-outline" disabled={access !== "link"} onClick={() => copy(link, "Example link")}><Copy size={16} /> Copy link</button></div>
    <div className="creator-share-fields"><label>Website embed code<textarea readOnly rows={2} value={access === "link" ? embed : "Enable link access to generate embed code"} onFocus={(event) => event.currentTarget.select()} /></label><button className="button button-outline" disabled={access !== "link"} onClick={() => copy(embed, "Example embed code")}><Copy size={16} /> Copy code</button></div>
    <div className="creator-actions"><button className="button button-outline" onClick={() => openPreview("watch")}><ExternalLink size={16} /> Preview watch page</button><button className="button button-outline" disabled={access !== "link"} onClick={() => openPreview("embed")}>Preview embed</button>{access === "link" && <><button className="button button-quiet" onClick={rotate}><RotateCcw size={16} /> Regenerate link</button><button className="button button-quiet" onClick={revoke}>Revoke link</button></>}</div>
    {message && <p className="field-hint" role="status">{message}</p>}
    <p className="field-hint">Links and embed code use the reserved .example domain. Player previews work here; invites are not sent and hosted access needs the backend.</p>
    <dialog ref={dialogRef} className="creator-share-dialog" aria-label={preview === "watch" ? "Watch page preview" : "Embed preview"}><div className="creator-share-dialog-head"><strong>{preview === "watch" ? "Watch page" : "Website embed"} · {title || file.name}</strong><form method="dialog"><button className="icon-only" aria-label="Close preview"><X size={18} /></button></form></div>{preview === "watch" ? <div className="creator-watch-preview">{isImage ? <img src={fileUrl} alt={title} /> : <video src={fileUrl || undefined} controls playsInline />}{downloads && <span>Viewer download enabled</span>}</div> : <iframe title="Website embed preview" srcDoc={`<style>body{margin:0;background:#17151d;display:grid;place-items:center;height:100vh}video,img{max-width:100%;max-height:100%;width:100%;height:100%;object-fit:contain}</style>${isImage ? `<img src="${fileUrl}" alt="Video preview">` : `<video src="${fileUrl}" controls playsinline></video>`}`} allowFullScreen />}</dialog>
  </section>;
}
