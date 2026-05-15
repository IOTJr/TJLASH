const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const assetsToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'animations.js',
  'config.js',
  'utils.js'
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const targetPath = path.join(distDir, relativePath);
  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(relativePath) {
  const sourceDir = path.join(projectRoot, relativePath);
  const targetDir = path.join(distDir, relativePath);
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const entrySourcePath = path.join(sourceDir, entry.name);
    const entryTargetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(path.join(relativePath, entry.name));
    } else {
      fs.copyFileSync(entrySourcePath, entryTargetPath);
    }
  }
}

fs.rmSync(distDir, { recursive: true, force: true });
ensureDir(distDir);

for (const asset of assetsToCopy) {
  copyFile(asset);
}

copyDirectory('images');

console.log('Static frontend built in dist/');