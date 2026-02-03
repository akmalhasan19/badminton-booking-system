const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(process.cwd(), 'public', 'smash-logo.png');
const outputPath = path.join(process.cwd(), 'public', 'email-logo.png');

async function optimizeLogo() {
    try {
        if (!fs.existsSync(inputPath)) {
            console.error('Error: Source file public/smash-logo.png not found.');
            return;
        }

        // Resize to 200px width (retina ready for 100px display), convert to PNG with good compression
        await sharp(inputPath)
            .resize(200)
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(outputPath);

        console.log(`Successfully created optimized logo at ${outputPath}`);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

optimizeLogo();
