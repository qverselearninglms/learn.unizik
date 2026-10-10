/**
 * Loads an image URL and returns a normalised JPEG data URL suitable for jsPDF
 * (jsPDF cannot embed WebP/AVIF, and transparent PNGs would render with black backgrounds).
 * Returns null when the image can't be read (e.g. blocked by CORS) — callers draw a placeholder.
 */

interface Frame {
    width: number;
    height: number;
}

async function blobToBitmapSource(blob: Blob): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
    if (typeof createImageBitmap === 'function') {
        const bmp = await createImageBitmap(blob);
        return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    }
    const url = URL.createObjectURL(blob);
    const img = await loadImg(url);
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

function loadImg(src: string, crossOrigin = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = src;
    });
}

function drawCover(source: CanvasImageSource, sw: number, sh: number, frame: Frame): string {
    const canvas = document.createElement('canvas');
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, frame.width, frame.height);

    // "cover": fill the frame, centre-crop the overflow.
    const scale = Math.max(frame.width / sw, frame.height / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(source, (frame.width - dw) / 2, (frame.height - dh) / 2, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.92);
}

export async function loadImageAsJpeg(src: string | undefined, frame: Frame): Promise<string | null> {
    if (!src || typeof window === 'undefined') return null;

    // 1) fetch → blob (works for same-origin and CORS-enabled hosts, supports Authorization-free URLs)
    try {
        const res = await fetch(src, { credentials: 'omit' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { source, width, height, close } = await blobToBitmapSource(await res.blob());
        try {
            return drawCover(source, width, height, frame);
        } finally {
            close();
        }
    } catch {
        /* fall through */
    }

    // 2) <img crossOrigin="anonymous"> — succeeds when the host sends CORS headers for images only
    try {
        const img = await loadImg(src, true);
        return drawCover(img, img.naturalWidth, img.naturalHeight, frame);
    } catch {
        return null;
    }
}
