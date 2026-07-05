import { useEffect, useState } from 'react';

const cache = new Map<string, string>();

/**
 * Loads an image, removes the connected white background (flood-fill from edges)
 * and returns a data URL with transparency. Falls back to original src on error.
 */
export function useTransparentImage(src: string): string {
  const [result, setResult] = useState(() => cache.get(src) ?? src);

  useEffect(() => {
    if (cache.has(src)) {
      setResult(cache.get(src)!);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no ctx');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;

        const isWhite = (i: number) =>
          data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;

        const visited = new Uint8Array(width * height);
        const stack: number[] = [];

        const tryPush = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= width || y >= height) return;
          const idx = y * width + x;
          if (visited[idx]) return;
          if (!isWhite(idx * 4)) return;
          visited[idx] = 1;
          stack.push(idx);
        };

        for (let x = 0; x < width; x++) {
          tryPush(x, 0);
          tryPush(x, height - 1);
        }
        for (let y = 0; y < height; y++) {
          tryPush(0, y);
          tryPush(width - 1, y);
        }

        while (stack.length) {
          const idx = stack.pop()!;
          const x = idx % width;
          const y = (idx / width) | 0;
          data[idx * 4 + 3] = 0;
          tryPush(x + 1, y);
          tryPush(x - 1, y);
          tryPush(x, y + 1);
          tryPush(x, y - 1);
        }

        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL('image/png');
        cache.set(src, url);
        if (!cancelled) setResult(url);
      } catch {
        if (!cancelled) setResult(src);
      }
    };
    img.onerror = () => {
      if (!cancelled) setResult(src);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return result;
}
