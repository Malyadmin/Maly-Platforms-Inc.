const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

function createGradientIcon(size, outputPath) {
  const png = new PNG({ width: size, height: size });
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      const gradientFactor = (x + y) / (size * 2);
      
      const startColor = { r: 139, g: 92, b: 246 };
      const endColor = { r: 236, g: 72, b: 153 };
      
      png.data[idx] = Math.round(startColor.r + (endColor.r - startColor.r) * gradientFactor);
      png.data[idx + 1] = Math.round(startColor.g + (endColor.g - startColor.g) * gradientFactor);
      png.data[idx + 2] = Math.round(startColor.b + (endColor.b - startColor.b) * gradientFactor);
      png.data[idx + 3] = 255;
    }
  }
  
  png.pack().pipe(fs.createWriteStream(outputPath));
  console.log(`Generated ${outputPath}`);
}

const publicDir = path.join(__dirname, '..', 'client', 'public');

const sizes = [
  { size: 180, name: 'apple-touch-icon-180.png' },
  { size: 152, name: 'apple-touch-icon-152.png' },
  { size: 167, name: 'apple-touch-icon-167.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

sizes.forEach(({ size, name }) => {
  createGradientIcon(size, path.join(publicDir, name));
});

console.log('All PWA icons generated successfully!');
