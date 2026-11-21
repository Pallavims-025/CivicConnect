export function normalizePhoto(value) {
  if (typeof value !== 'string') return null;
  const photo = value.trim();
  if (photo.length <= 1000 && /^https?:\/\//i.test(photo)) {
    try {
      const url = new URL(photo);
      url.hash = '';
      return url.toString();
    } catch {
      return null;
    }
  }
  if (photo.length <= 7_000_000 && /^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+=*$/i.test(photo)) return photo;
  return null;
}

export function parseComplaintPhotos(photos) {
  if (!Array.isArray(photos)) return [];
  const unique = new Map();
  for (const item of photos) {
    const imageUrl = normalizePhoto(typeof item === 'string' ? item : item?.imageUrl);
    if (!imageUrl) continue;
    const suppliedHash = typeof item === 'object' && item !== null ? item.perceptualHash : null;
    const perceptualHash = typeof suppliedHash === 'string' && /^[a-f\d]{16}$/i.test(suppliedHash) ? suppliedHash.toLowerCase() : null;
    if (!unique.has(imageUrl)) unique.set(imageUrl, { imageUrl, perceptualHash });
    else if (!unique.get(imageUrl).perceptualHash && perceptualHash) unique.get(imageUrl).perceptualHash = perceptualHash;
  }
  return [...unique.values()].slice(0, 5);
}
