const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Read manifest.json
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Update manifest version from package.json
manifestJson.version = packageJson.version;

// Write updated manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2));

console.log(`Updated manifest.json to version ${packageJson.version}`);