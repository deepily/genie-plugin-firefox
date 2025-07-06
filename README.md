# genie-plugin-firefox

A Firefox extension that records, transcribes and proofreads voice, pasting it to clipboard or browser-based editors.

## Repository Relationship

This Firefox extension is part of the larger **Lupin** (formerly "Genie-in-the-Box") project ecosystem:

- **Parent Repository**: `genie-in-the-box` - Contains the FastAPI server, CoSA (Collection of Small Agents) framework, and WebSocket TTS system
- **This Repository**: `genie-plugin-firefox` - Browser extension client that communicates with the parent server
- **Location**: Embedded within the parent repo at `src/genie-plugin-firefox/`
- **Independence**: While contained within the parent repo, this has its own package.json, build process, and release cycle

### Architecture Integration

The Firefox extension integrates with the parent Lupin system as follows:

1. **Audio Processing**: Records audio and sends base64-encoded MP3 to `/api/upload-and-transcribe-mp3`
2. **Agent Communication**: Sends "multimodal agent" prefixed commands that get queued in the CoSA system
3. **Authentication**: Expected to provide session/websocket IDs for job tracking
4. **Response Handling**: Expects specific JSON response format with `results`, `mode`, `prefix`, and `transcription` fields

### Server Dependencies

- **FastAPI Server**: Runs on port 7999 (configurable via `GIB_SERVER_ADDRESS`)
- **WebSocket System**: For real-time job status and audio streaming
- **CoSA Framework**: Processes agent requests through TodoFifoQueue system
- **Authentication**: Mock token system for development

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