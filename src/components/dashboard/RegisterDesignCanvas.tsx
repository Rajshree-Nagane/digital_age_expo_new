"use client";

import { useEffect, useRef, useState } from "react";
import axios, { isAxiosError } from "axios";
import { Check, Move, RotateCcw, Save, AlertTriangle } from "lucide-react";
import {
  DEFAULT_FORM_BORDER_COLOR,
  DEFAULT_FORM_TEXT_COLOR,
  safeCssColor,
} from "@/lib/validations/eventConfiguration";
import type { PreviewField } from "@/lib/services/eventConfigurations";

/**
 * Port of legacy members/event_configurations.tpl — drag the register/login form
 * over the event's registration background and save where it sits.
 *
 * Implemented with native pointer events rather than the interact.js the legacy
 * template pulled from a CDN: it's ~30 lines, removes a third-party runtime
 * dependency from an authenticated admin screen, and works with touch and mouse
 * through the same handlers.
 *
 * The legacy version also had two real problems this one avoids:
 *
 *  - it mixed CSS `left/top` percentages with a `transform: translate(px)` and
 *    reconciled the two only at save time, so what you saw during a drag and the
 *    number that got stored could disagree. Here the percentage IS the state.
 *  - `restrictRect` kept the box's top-left inside the parent, which let you
 *    drag most of the form off the right/bottom edge. The clamp below accounts
 *    for the box's own size, so it can't leave the canvas.
 */

interface Props {
  eventId: number;
  backgroundImage: string | null;
  initialX: number;
  initialY: number;
  textColor: string | null;
  borderColor: string | null;
  fields: PreviewField[];
}

export function RegisterDesignCanvas({
  eventId,
  backgroundImage,
  initialX,
  initialY,
  textColor,
  borderColor,
  fields,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  /** Pointer offset within the box at grab time, so it doesn't jump to the cursor. */
  const grabOffset = useRef<{ dx: number; dy: number } | null>(null);

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedText = safeCssColor(textColor, DEFAULT_FORM_TEXT_COLOR);
  const resolvedBorder = safeCssColor(borderColor, DEFAULT_FORM_BORDER_COLOR);

  const dirty =
    Math.abs(position.x - initialX) > 0.01 || Math.abs(position.y - initialY) > 0.01;

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(timer);
  }, [saved]);

  function onPointerDown(e: React.PointerEvent) {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    grabOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !grabOffset.current) return;
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;

    const canvasRect = canvas.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    const left = e.clientX - canvasRect.left - grabOffset.current.dx;
    const top = e.clientY - canvasRect.top - grabOffset.current.dy;

    // Clamp using the box's own size so it can never be dragged off the canvas —
    // the legacy restrictRect only constrained the top-left corner.
    const maxLeft = Math.max(0, canvasRect.width - boxRect.width);
    const maxTop = Math.max(0, canvasRect.height - boxRect.height);

    const clampedLeft = Math.min(Math.max(0, left), maxLeft);
    const clampedTop = Math.min(Math.max(0, top), maxTop);

    setPosition({
      x: (clampedLeft * 100) / canvasRect.width,
      y: (clampedTop * 100) / canvasRect.height,
    });
  }

  function endDrag() {
    setDragging(false);
    grabOffset.current = null;
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await axios.put(`/api/members/event-configurations?event_id=${eventId}`, {
        register_form_x_position: Number(position.x.toFixed(3)),
        register_form_y_position: Number(position.y.toFixed(3)),
      });
      setSaved(true);
    } catch (err) {
      setError(
        isAxiosError(err) && typeof err.response?.data?.error === "string"
          ? err.response.data.error
          : "Could not save the form position.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-zinc-400">
          <Move className="h-4 w-4 text-brand-pink" />
          Drag the form onto the background, then save. The login form uses the same position.
        </p>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-zinc-300">
            x {position.x.toFixed(1)}% · y {position.y.toFixed(1)}%
          </span>
          <button
            type="button"
            onClick={() => setPosition({ x: initialX, y: initialY })}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2 text-[11px] font-bold uppercase text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="btn-brand-gradient inline-flex items-center gap-2 rounded-xl px-5 py-2 text-[11px] font-black uppercase tracking-wider disabled:opacity-60"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : saved ? "Saved" : "Save Position"}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-bold text-red-300"
        >
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Canvas — the registration background at its real aspect */}
      <div
        ref={canvasRef}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="relative aspect-video w-full select-none overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
        style={
          backgroundImage
            ? {
                backgroundImage: `url('${backgroundImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!backgroundImage && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs text-zinc-500">
            No registration background set for this event. Upload one as the event&apos;s
            &ldquo;Register Page Image&rdquo; — the form can still be positioned without it.
          </p>
        )}

        {/* The draggable register/login form */}
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            borderColor: resolvedBorder,
            color: resolvedText,
          }}
          className={`absolute w-[min(360px,60%)] rounded-lg border-2 bg-black/40 p-4 shadow-[3px_3px_10px_rgba(0,0,0,0.6)] backdrop-blur-[2px] ${
            dragging ? "cursor-grabbing ring-2 ring-brand-pink" : "cursor-grab"
          }`}
        >
          <h3
            className="mb-3 text-center text-sm font-black uppercase"
            style={{ color: resolvedText }}
          >
            Login / Register Form
          </h3>

          <div className="space-y-2">
            {fields.length === 0 ? (
              <p className="text-center text-[11px] opacity-70">
                No active registration fields. Enable some on Manage Registration.
              </p>
            ) : (
              fields.slice(0, 8).map((field) => (
                <div
                  key={field.fieldVariable}
                  style={{ borderColor: resolvedBorder, color: resolvedText }}
                  className="truncate rounded-md border bg-white/5 px-2.5 py-1.5 text-[11px] shadow-[0_0_7px_rgba(255,255,255,0.25)_inset]"
                >
                  {field.fieldName}
                  {field.isRequired ? " *" : ""}
                </div>
              ))
            )}
            {fields.length > 8 && (
              <p className="text-center text-[10px] opacity-60">
                + {fields.length - 8} more field(s)
              </p>
            )}
          </div>

          <div
            style={{ borderColor: resolvedBorder, color: resolvedText }}
            className="mx-auto mt-3 w-[130px] rounded-md border-2 py-1.5 text-center text-[11px] font-extrabold shadow-[0_0_7px_rgba(255,255,255,0.25)_inset]"
          >
            Register
          </div>
        </div>
      </div>
    </div>
  );
}
