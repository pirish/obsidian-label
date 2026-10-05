import { jsPDF } from 'jspdf';

/**
 * Compiles a rendered canvas image into a universal, printable PDF document.
 * Returns raw binary PDF bytes (Uint8Array).
 */
export function exportCanvasToPDF(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number,
): Uint8Array {
  const orientation = widthMm >= heightMm ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [widthMm, heightMm],
    compress: true,
  });

  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);

  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}
