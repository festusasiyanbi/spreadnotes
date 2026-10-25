"use client";

import type { AgeTarget } from "../simulation/store";
import type { AdNetworkId } from "../platforms/types";

const groups = {
  linkedin: [["AGE_18_24", "18–24"], ["AGE_25_34", "25–34"], ["AGE_35_54", "35–54"], ["AGE_55_PLUS", "55+"]],
  tiktok: [["AGE_18_24", "18–24"], ["AGE_25_34", "25–34"], ["AGE_35_44", "35–44"], ["AGE_45_54", "45–54"], ["AGE_55_100", "55+"]],
} as const;

export function AgeSelector({ network, value, onChange }: { network: AdNetworkId; value?: AgeTarget; onChange: (value: AgeTarget) => void }) {
  if (network === "meta") return <div className="age-selector"><strong>Age range · Meta</strong><div className="age-range"><label>Minimum age<select value={value?.min ?? 18} onChange={(event) => onChange({ ...value, min: Number(event.target.value) })}>{Array.from({ length: 48 }, (_, index) => index + 18).map((age) => <option key={age} value={age}>{age}</option>)}</select></label><label>Maximum age<select value={value?.max ?? 65} onChange={(event) => onChange({ ...value, max: Number(event.target.value) })}>{Array.from({ length: 48 }, (_, index) => index + 18).map((age) => <option key={age} value={age}>{age === 65 ? "65+" : age}</option>)}</select></label></div></div>;
  return <fieldset className="age-selector"><legend>Age groups · {network === "linkedin" ? "LinkedIn" : "TikTok"}</legend><div className="age-groups">{groups[network].map(([code, label]) => <label key={code}><input type="checkbox" checked={value?.groups?.includes(code) ?? false} onChange={(event) => onChange({ groups: event.target.checked ? [...(value?.groups ?? []), code] : (value?.groups ?? []).filter((item) => item !== code) })} />{label}</label>)}</div><small>Leave all unchecked to apply no age filter. Account rules may still restrict delivery.</small></fieldset>;
}

export function ageDescription(network: AdNetworkId, value?: AgeTarget) {
  if (network === "meta") return `${value?.min ?? 18}–${(value?.max ?? 65) === 65 ? "65+" : value?.max}`;
  return value?.groups?.length ? groups[network].filter(([id]) => value.groups?.includes(id)).map(([, label]) => label).join(", ") : "No age filter";
}
