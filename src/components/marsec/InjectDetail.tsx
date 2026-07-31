import { useState } from "react";
import type { Inject } from "@/data/marsecTypes";

interface Props {
  inject: Inject;
  index: number;
  alt: boolean;
  onChange: (patch: Partial<Inject>) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}

const label = "text-[10px] uppercase tracking-[0.18em] text-[#0B2239]/45";
const input = "mt-1 w-full px-3 py-2 rounded-lg border border-[#0B2239]/20 text-sm bg-white";

export default function InjectDetail({ inject, index, alt, onChange, onRegenerate, regenerating }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = [
      `${inject.id} · ${inject.time} · ${inject.channel}`,
      inject.title,
      "",
      inject.content,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className={`border-b border-[#0B2239]/10 last:border-b-0 ${alt ? "bg-[#F5F7FA]" : "bg-white"}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-3 py-2.5 flex items-start gap-3">
        <span className="font-mono text-xs text-[#0B2239]/60 w-14 shrink-0 pt-0.5">{inject.id}</span>
        <span className="text-xs w-24 sm:w-28 shrink-0 pt-0.5">{inject.time}</span>
        <span className="flex-1 text-sm font-medium">
          {inject.title}
          {inject.mandatory && <span className="ml-2 text-[10px] uppercase tracking-[0.14em] text-[#D6003C]">mandatory</span>}
        </span>
        <span className="hidden sm:block text-xs text-[#0B2239]/55 w-40 shrink-0">{inject.topicTag}</span>
        <span className="text-[#0B2239]/40 text-xs pt-0.5">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className={label}>Time</span>
              <input className={input} value={inject.time} onChange={(e) => onChange({ time: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Channel</span>
              <input className={input} value={inject.channel} onChange={(e) => onChange({ channel: e.target.value })} />
            </label>
            <label className="block">
              <span className={label}>Follows on from</span>
              <input className={input} value={inject.dependsOn ?? ""} onChange={(e) => onChange({ dependsOn: e.target.value })} />
            </label>
          </div>

          <label className="block">
            <span className={label}>Title</span>
            <input className={input} value={inject.title} onChange={(e) => onChange({ title: e.target.value })} />
          </label>

          <label className="block">
            <span className={label}>Content (delivered verbatim)</span>
            <textarea rows={5} className={input} value={inject.content} onChange={(e) => onChange({ content: e.target.value })} />
          </label>

          <label className="block">
            <span className={label}>Expected response</span>
            <textarea rows={3} className={input} value={inject.expectedResponse} onChange={(e) => onChange({ expectedResponse: e.target.value })} />
          </label>

          <div className="rounded-xl border border-[#0B2239]/10 bg-white p-3 space-y-2 text-[13px]">
            <p><span className={label}>Facilitator note</span><br />{inject.facilitatorNote}</p>
            {(inject.discussionPrompts ?? []).length > 0 && (
              <div>
                <span className={label}>Discussion prompts</span>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {inject.discussionPrompts.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {(inject.clarifications ?? []).length > 0 && (
              <div>
                <span className={label}>Clarifications</span>
                <ul className="mt-1 space-y-1">
                  {inject.clarifications.map((c, i) => (
                    <li key={i}><strong>{c.question}</strong> — {c.answer}</li>
                  ))}
                </ul>
              </div>
            )}
            {inject.observationFocus && (
              <p className="italic text-[#0B2239]/65">Observation focus: {inject.observationFocus}</p>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={copy} className="px-3 py-1.5 rounded-full border border-[#0B2239]/20 text-xs hover:bg-[#0B2239]/5">
              {copied ? "Copied" : "Copy inject"}
            </button>
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="px-3 py-1.5 rounded-full border border-[#D6003C]/40 text-[#D6003C] text-xs hover:bg-[#D6003C]/5 disabled:opacity-40"
            >
              {regenerating ? "Regenerating …" : "Regenerate this inject"}
            </button>
            <span className="text-[11px] text-[#0B2239]/45 self-center">#{index + 1} · {inject.phase}</span>
          </div>
        </div>
      )}
    </div>
  );
}
