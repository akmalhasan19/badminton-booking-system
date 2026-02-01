const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const files = [
    'design-2d-raket-badminton.svg',
    'design-2d-sepatu-badminton.svg',
    'design-2d-tas-badminton.svg'
];

async function convert() {
    console.log('Starting conversion...');
    for (const file of files) {
        const inputPath = path.join(__dirname, '../public', file);
        const outputPath = path.join(__dirname, '../public', file.replace('.svg', '.webp'));

        if (!fs.existsSync(inputPath)) {
            console.warn(`Input file not found: ${inputPath}`);
            continue;
        }

        try {
            console.log(`Converting ${file} to WebP...`);
            // Convert to WebP. Resize logic can be added if needed, but let's just convert format first.
            // SVGs are vector, so they will be rasterized. Default density is 72dpi, might need higher for crispness.
            // Increasing density (DPI) to 300 for high quality.
            await sharp(inputPath, { density: 300 })
                .resize(500) // Resize to reasonable max width to ensure performance
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`Success: ${outputPath}`);
        } catch (error) {
            console.error(`Failed to convert ${file}:`, error);
        }
    }
}

convert();
