# genie-plugin-firefox

A Firefox extension that records, transcribes and proofreads voice, pasting it to clipboard or browser-based editors.

## Development Resources

Check out our research and planning documents:
- [Firefox Extension Automation Plan](rnd/firefox_extension_automation.md)
- [Firefox to Chrome Migration Research](rnd/firefox_to_chrome_migration.md)
- [Recorder Latency Investigation](rnd/recorder_latency_research.md)
- [Recorder2 Optimized Implementation](rnd/recorder2_implementation_research.md)

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

## Testing the New Recorder

To test the optimized recorder with reduced latency:
1. Navigate to `html/recorder2.html` instead of the default recorder
2. The new implementation starts initialization immediately and begins recording as soon as possible