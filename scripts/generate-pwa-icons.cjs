const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

function createMalyIcon(size, outputPath) {
  const png = new PNG({ width: size, height: size });
  
  // Fill with black background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx] = 0;     // R
      png.data[idx + 1] = 0; // G
      png.data[idx + 2] = 0; // B
      png.data[idx + 3] = 255; // A
    }
  }
  
  // Draw white Ā character (A with macron)
  const scale = size / 256; // Base calculations on 256px, scale up/down
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Macron (horizontal line on top)
  const macronY = Math.round(centerY - 65 * scale);
  const macronHeight = Math.round(12 * scale);
  const macronWidth = Math.round(70 * scale);
  const macronLeft = Math.round(centerX - macronWidth / 2);
  
  // A letter dimensions
  const aTop = Math.round(centerY - 40 * scale);
  const aBottom = Math.round(centerY + 80 * scale);
  const aWidth = Math.round(100 * scale);
  const strokeWidth = Math.round(20 * scale);
  
  // Helper to draw a filled rectangle
  function fillRect(x, y, w, h) {
    for (let py = Math.max(0, y); py < Math.min(size, y + h); py++) {
      for (let px = Math.max(0, x); px < Math.min(size, x + w); px++) {
        const idx = (size * py + px) << 2;
        png.data[idx] = 255;     // R
        png.data[idx + 1] = 255; // G
        png.data[idx + 2] = 255; // B
        png.data[idx + 3] = 255; // A
      }
    }
  }
  
  // Helper to draw a thick line
  function drawLine(x1, y1, x2, y2, thickness) {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    for (let i = 0; i <= length; i++) {
      const x = x1 + Math.cos(angle) * i;
      const y = y1 + Math.sin(angle) * i;
      
      for (let dy = -thickness / 2; dy < thickness / 2; dy++) {
        for (let dx = -thickness / 2; dx < thickness / 2; dx++) {
          const px = Math.round(x + dx);
          const py = Math.round(y + dy);
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (size * py + px) << 2;
            png.data[idx] = 255;
            png.data[idx + 1] = 255;
            png.data[idx + 2] = 255;
            png.data[idx + 3] = 255;
          }
        }
      }
    }
  }
  
  // Draw macron (horizontal line)
  fillRect(macronLeft, macronY, macronWidth, macronHeight);
  
  // Draw A letter
  // Left stroke of A
  const leftX = centerX - aWidth / 2;
  drawLine(leftX, aBottom, centerX, aTop, strokeWidth);
  
  // Right stroke of A
  const rightX = centerX + aWidth / 2;
  drawLine(centerX, aTop, rightX, aBottom, strokeWidth);
  
  // Horizontal bar of A
  const barY = Math.round(centerY + 20 * scale);
  const barLeft = Math.round(centerX - aWidth / 2 + strokeWidth);
  const barRight = Math.round(centerX + aWidth / 2 - strokeWidth);
  fillRect(barLeft, barY, barRight - barLeft, strokeWidth);
  
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
  createMalyIcon(size, path.join(publicDir, name));
});

console.log('All PWA icons generated successfully!');
