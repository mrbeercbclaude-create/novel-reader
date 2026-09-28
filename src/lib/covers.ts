const colors = ['#cbd8d1', '#ded4c5', '#cbd5dc', '#ddcbc4', '#d5d7ca'];

export function coverColor(id: string) {
  const hash = Array.from(id).reduce((total, char) => total + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export const COVER_MAX_WIDTH = 900;
// Boards carry small handwritten labels, so keep enough pixels to zoom in.
export const BOARD_MAX_WIDTH = 1600;

export function resizeCover(file: File): Promise<Blob> {
  return resizeImage(file, COVER_MAX_WIDTH);
}

export async function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('กรุณาเลือกรูป PNG, JPEG หรือ WebP');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('รูปต้องมีขนาดไม่เกิน 20 MB');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) {
      throw new Error('รูปมีความละเอียดสูงเกินไป กรุณาลดขนาดก่อน');
    }
    const scale = Math.min(1, maxWidth / bitmap.width, 9000 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('อุปกรณ์นี้ไม่รองรับการปรับขนาดรูป');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('ไม่สามารถบันทึกรูปนี้ได้'));
      }, 'image/webp', 0.88);
    });
  } finally {
    bitmap.close();
  }
}

