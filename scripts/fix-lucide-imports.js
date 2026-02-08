/**
 * Script to convert lucide-react barrel imports to direct imports
 * Following Vercel React Best Practices: bundle-barrel-imports
 * 
 * This reduces bundle size by enabling tree-shaking of unused icons
 * Expected savings: 100-300KB
 */

const fs = require('fs');
const path = require('path');

// Icon name to kebab-case mapping
function toKebabCase(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}

// Process a single file
function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Find lucide-react import statements
    const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*["']lucide-react["']/g;

    let match;
    let newContent = content;
    const replacements = [];

    while ((match = importRegex.exec(content)) !== null) {
        const fullImport = match[0];
        const iconsString = match[1];

        // Parse individual icons
        const icons = iconsString
            .split(',')
            .map(icon => icon.trim())
            .filter(icon => icon.length > 0)
            .map(icon => {
                // Handle "Icon as Alias" syntax
                const parts = icon.split(/\s+as\s+/);
                return {
                    original: parts[0].trim(),
                    alias: parts[1]?.trim()
                };
            });

        // Generate direct imports
        const directImports = icons.map(({ original, alias }) => {
            const kebab = toKebabCase(original);
            const importName = alias ? `${original} as ${alias}` : original;
            return `import { ${importName} } from "lucide-react/dist/esm/icons/${kebab}"`;
        }).join('\n');

        replacements.push({
            original: fullImport,
            replacement: directImports
        });
    }

    // Apply replacements
    for (const { original, replacement } of replacements) {
        newContent = newContent.replace(original, replacement);
    }

    // Only write if changed
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log(`✅ Fixed: ${filePath}`);
        return true;
    }

    return false;
}

// Recursively find all .ts and .tsx files
function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, .next, etc.
            if (!['node_modules', '.next', '.git', 'dist'].includes(file)) {
                findFiles(filePath, fileList);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
console.log('🔍 Scanning for lucide-react imports...\n');

const files = findFiles(srcDir);
let fixedCount = 0;

files.forEach(file => {
    if (processFile(file)) {
        fixedCount++;
    }
});

console.log(`\n✨ Done! Fixed ${fixedCount} files.`);
console.log('📦 Expected bundle size reduction: 100-300KB');
console.log('\n⚠️  Next steps:');
console.log('1. Run: npm run build');
console.log('2. Compare .next/static size before/after');
console.log('3. Test all icons display correctly');
