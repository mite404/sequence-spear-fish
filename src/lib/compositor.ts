export type Mask = {
  shape: 'rectangle' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  feather: number;
  invert: boolean;
};

export type ClipSettings = {
  blend: 'normal' | 'difference';
  opacity: number;
  mask: Mask | null;
};

type Layer = ClipSettings & { source: CanvasImageSource };

// Mask coordinates are percentages of the frame, feather is an inward ramp.
function maskCoverage(x: number, y: number, mask: Mask): number {
  const dx = Math.abs(x - mask.x);
  const dy = Math.abs(y - mask.y);
  const rx = mask.width / 2;
  const ry = mask.height / 2;
  const distance =
    mask.shape === 'rectangle'
      ? Math.min(rx - dx, ry - dy)
      : (1 - Math.hypot(dx / rx, dy / ry)) * Math.min(rx, ry);
  const coverage =
    mask.feather === 0 ? Number(distance >= 0) : Math.max(0, Math.min(1, distance / mask.feather));
  return mask.invert ? 1 - coverage : coverage;
}

/**
 * Paint bottom-to-top layers in Canvas2D's sRGB space, preserving source alpha.
 * Masks multiply source alpha before opacity and blend mode are applied.
 * @throws If Canvas2D is unavailable or a source is not origin-clean.
 */
export function composite(canvas: HTMLCanvasElement, layers: Layer[]): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This preview needs Canvas2D support.');
  const frame = document.createElement('canvas');
  frame.width = canvas.width;
  frame.height = canvas.height;
  const frameCtx = frame.getContext('2d');
  if (!frameCtx) throw new Error('This preview needs Canvas2D support.');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const layer of layers) {
    frameCtx.clearRect(0, 0, frame.width, frame.height);
    // ponytail: stretch stills to the fixed preview; add fit modes with video support.
    frameCtx.drawImage(layer.source, 0, 0, frame.width, frame.height);
    if (layer.mask) {
      // ponytail: CPU masks for two stills; move to GPU only for measured playback needs.
      const pixels = frameCtx.getImageData(0, 0, frame.width, frame.height);
      for (let y = 0; y < frame.height; y++) {
        for (let x = 0; x < frame.width; x++) {
          const alpha = (y * frame.width + x) * 4 + 3;
          pixels.data[alpha] *= maskCoverage(
            ((x + 0.5) / frame.width) * 100,
            ((y + 0.5) / frame.height) * 100,
            layer.mask,
          );
        }
      }
      frameCtx.putImageData(pixels, 0, 0);
    }
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blend === 'difference' ? 'difference' : 'source-over';
    ctx.drawImage(frame, 0, 0);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
