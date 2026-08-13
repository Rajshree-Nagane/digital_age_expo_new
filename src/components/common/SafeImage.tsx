"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

import { PLACEHOLDER_IMAGE, assetUrl } from "@/lib/assets";

/**
 * ---------------------------------------------------------------------------
 * Fallback-aware image components.
 * ---------------------------------------------------------------------------
 *
 * Every uploaded asset is now served from this app's own `public/` folder, so a
 * missing file is a 404 rather than a third-party outage — but a 404 still
 * renders as the browser's broken-image glyph, which looks like the bug we just
 * fixed. These components swap in `/images/image-placeholder.png` instead.
 *
 * IMPORTANT: this hides the SYMPTOM in the UI only. It deliberately does not
 * hide the migration failure itself — anything that could not be mirrored is
 * still listed in `reports/failed-image-downloads.json`, and (in development)
 * logged to the console the first time it fails to load.
 */

function useFallback(src: string | null | undefined) {
  const resolved = assetUrl(src);
  const [current, setCurrent] = useState<string>(resolved ?? PLACEHOLDER_IMAGE);

  useEffect(() => {
    setCurrent(resolved ?? PLACEHOLDER_IMAGE);
  }, [resolved]);

  const onError = () => {
    if (current === PLACEHOLDER_IMAGE) return;
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[SafeImage] missing asset: ${current}` +
          (resolved !== src ? ` (from stored value "${src}")` : "") +
          " — check reports/failed-image-downloads.json",
      );
    }
    setCurrent(PLACEHOLDER_IMAGE);
  };

  return { src: current, onError, isPlaceholder: current === PLACEHOLDER_IMAGE };
}

type SafeImageProps = Omit<ImageProps, "src"> & {
  /** Raw stored value — a legacy URL, a bare filename or an already-local path. */
  src: string | null | undefined;
};

/**
 * `next/image` with automatic `assetUrl()` resolution and placeholder fallback.
 * Use this for normal content images where you know the intrinsic dimensions
 * (or can use `fill`).
 */
export function SafeImage({ src, alt, ...rest }: SafeImageProps) {
  const { src: current, onError } = useFallback(src);
  return <Image {...rest} src={current} alt={alt} onError={onError} />;
}

type SafeImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

/**
 * Plain `<img>` variant, for the cases where `next/image` is not appropriate:
 * unknown intrinsic dimensions, SVG logos, `object-contain` inside a flexible
 * box, or CMS-driven markup where a layout shift would be worse than an
 * unoptimised request.
 */
export function SafeImg({ src, alt = "", ...rest }: SafeImgProps) {
  const { src: current, onError } = useFallback(src);
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} src={current} alt={alt} onError={onError} />;
}

export { PLACEHOLDER_IMAGE };
