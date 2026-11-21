const HASH_SIZE = 32;

export function perceptualHashFromImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    if (!src.startsWith('data:')) image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = HASH_SIZE;
        canvas.height = HASH_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, HASH_SIZE, HASH_SIZE);
        const pixels = context.getImageData(0, 0, HASH_SIZE, HASH_SIZE).data;
        const gray = new Float64Array(HASH_SIZE * HASH_SIZE);
        for (let i = 0; i < gray.length; i += 1) {
          const pixel = i * 4;
          gray[i] = 0.299 * pixels[pixel] + 0.587 * pixels[pixel + 1] + 0.114 * pixels[pixel + 2];
        }

        const coefficients = [];
        for (let v = 0; v < 8; v += 1) {
          for (let u = 0; u < 8; u += 1) {
            let coefficient = 0;
            for (let y = 0; y < HASH_SIZE; y += 1) {
              const cy = Math.cos(((2 * y + 1) * v * Math.PI) / (2 * HASH_SIZE));
              for (let x = 0; x < HASH_SIZE; x += 1) {
                coefficient += gray[y * HASH_SIZE + x]
                  * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * HASH_SIZE)) * cy;
              }
            }
            coefficients.push(coefficient);
          }
        }

        const medianValues = coefficients.slice(1).sort((a, b) => a - b);
        const median = medianValues[Math.floor(medianValues.length / 2)];
        let bits = 0n;
        for (const coefficient of coefficients) bits = (bits << 1n) | (coefficient > median ? 1n : 0n);
        resolve(bits.toString(16).padStart(16, '0'));
      } catch {
        // Cross-origin URLs without image CORS permission simply have no hash.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
