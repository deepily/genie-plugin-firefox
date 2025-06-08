# genie-plugin-firefox

A Firefox extension that records, transcribes and proofreads voice, pasting it to clipboard or browser-based editors.

## Development Resources

Check out our research and planning documents:
- [Firefox Extension Automation Plan](rnd/firefox_extension_automation.md)
- [Firefox to Chrome Migration Research](rnd/firefox_to_chrome_migration.md)
- [Mozilla Add-on Credentials Setup](rnd/mozilla-addon-credentials.md)
- [Stream Caching and UI Status Implementation](rnd/stream-caching-and-ui-status-implementation.md)

## Development Setup

### Prerequisites
- Node.js v18+ and npm
- Mozilla Firefox
- web-ext tool (`npm install -g web-ext`)

### Installation
```bash
# Install dependencies
npm install
```

### Running the Extension
```bash
# Run in Firefox development mode
npm start
```

### Building the Extension
```bash
# Build the extension
npm run build
```

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint
```

### Release Process
1. Update version in `package.json`
2. Run `npm run version` to update manifest.json
3. Commit changes
4. Tag the release: `git tag v1.2.3`
5. Push changes: `git push && git push --tags`
6. GitHub Actions will automatically build, test, and publish the extension

## Key Features

### Optimized Audio Recording
- **Stream Caching**: 99.84% reduction in recording latency (from ~2000ms to ~3ms) for subsequent recordings
- **Visual Status Indicator**: Real-time microphone readiness feedback with three states:
  - Waiting (gray): Stream unavailable
  - Ready (green pulse): Ready to record immediately  
  - Recording (red pulse): Actively recording
- **Background Processing**: Persistent stream management for optimal performance

### Voice Processing
- Transcription with multiple AI models
- Voice command processing
- Audio proofreading and editing capabilities