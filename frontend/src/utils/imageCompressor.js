/**
 * Fast client-side image compression utility using HTML5 Canvas.
 * Dramatically accelerates mobile evidence uploads by downsizing high-res camera photos
 * (e.g. 5-15 MB raw mobile captures) down to ~120-250 KB with high visual clarity.
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.82) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // If already under 250 KB and JPEG/WEBP, skip re-compression
  if (file.size < 250 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => resolve(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => resolve(file);
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                return resolve(file);
              }
              const cleanName = (file.name || 'image').replace(/\.[^.]+$/, '') + '.jpg';
              const compressedFile = new File([blob], cleanName, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } catch (_) {
      resolve(file);
    }
  });
}
