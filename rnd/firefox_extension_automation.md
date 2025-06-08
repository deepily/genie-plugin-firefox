# Firefox Extension Automation Plan

This document outlines a comprehensive plan for automating the building, testing, signing, and publishing process for the Genie in the Box Firefox extension.

## Current Workflow Challenges

- Manual version incrementation in manifest.json
- No automated testing
- Manual signing and submission to Mozilla Add-ons
- No continuous integration/deployment pipeline

## Proposed Automation Solution

### 1. Package Management Setup

While not currently used, introducing basic npm packaging will enable automation:

```json
{
  "name": "genie-plugin-firefox",
  "version": "0.8.5",
  "scripts": {
    "lint": "web-ext lint",
    "build": "web-ext build --overwrite-dest",
    "start": "web-ext run",
    "sign": "web-ext sign --api-key=$AMO_JWT_ISSUER --api-secret=$AMO_JWT_SECRET",
    "test": "jest",
    "version": "node scripts/update-version.js"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "web-ext": "^7.6.0"
  }
}
```

### 2. Version Management

Create a script to automate version updates (`scripts/update-version.js`):

```javascript
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
```

### 3. GitHub Actions CI/CD Workflow

Create `.github/workflows/build-test-publish.yml`:

```yaml
name: Build, Test and Publish

on:
  push:
    branches: [ main ]
    tags:
      - 'v*.*.*'
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Lint extension
        run: npm run lint
        
      - name: Run tests
        run: npm run test
        
      - name: Build extension
        run: npm run build
        
      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: extension-build
          path: web-ext-artifacts/*.zip
          
  publish:
    needs: build-and-test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Download build artifact
        uses: actions/download-artifact@v3
        with:
          name: extension-build
          path: web-ext-artifacts
          
      - name: Sign and publish extension
        run: npm run sign
        env:
          AMO_JWT_ISSUER: ${{ secrets.AMO_JWT_ISSUER }}
          AMO_JWT_SECRET: ${{ secrets.AMO_JWT_SECRET }}
          
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: web-ext-artifacts/*.xpi
```

### 4. Testing Framework Setup

Create basic test structure:

```
/__tests__
  /unit
    constants.test.js
  /integration
    extension.test.js
  /e2e
    commands.test.js
```

Sample unit test (`/__tests__/unit/constants.test.js`):

```javascript
// Simple test to verify constants are correctly defined
import * as constants from '../../js/constants.js';

describe('Constants', () => {
  test('TTS server address should be defined', () => {
    expect(constants.TTS_SERVER_ADDRESS).toBeDefined();
    expect(constants.TTS_SERVER_ADDRESS).toContain('http://');
  });
  
  test('GIB server address should be defined', () => {
    expect(constants.GIB_SERVER_ADDRESS).toBeDefined();
    expect(constants.GIB_SERVER_ADDRESS).toContain('http://');
  });
});
```

### 5. Release Process

1. **Manual Process**:
   - Update `package.json` version
   - Run `npm version` script to update manifest
   - Commit changes
   - Create tag (e.g., `git tag v0.8.6`)
   - Push changes and tags (`git push && git push --tags`)

2. **GitHub Actions**:
   - Triggered by tag push
   - Runs tests
   - Builds extension
   - Signs using Mozilla API credentials
   - Creates GitHub release with artifacts
   - Publishes to Mozilla Add-ons

### 6. Mozilla Add-ons API Setup

1. Create API credentials:
   - Visit https://addons.mozilla.org/en-US/developers/addon/api/key/
   - Generate JWT credentials
   
2. Store in GitHub Secrets:
   - Add `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` to repository secrets

### 7. Additional Automation Ideas

- **Automated Changelogs**: Use conventional commits and generate changelogs automatically
- **Scheduled Testing**: Run daily tests against latest Firefox versions
- **Version Bumping**: Automate version bumping with GitHub Actions
- **Release Notes Generator**: Auto-generate release notes from commit messages

## Implementation Timeline

1. **Week 1**: Set up package.json and web-ext tooling
2. **Week 2**: Implement version management scripts
3. **Week 3**: Configure GitHub Actions workflows
4. **Week 4**: Set up basic testing framework
5. **Week 5**: Configure Mozilla Add-ons API integration

## Prerequisites

- Mozilla Add-ons Developer Account
- GitHub repository setup
- GitHub Actions enabled
- API credentials from Mozilla Add-ons