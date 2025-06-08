# Firefox to Chrome Extension Migration Research

This document explores strategies for creating a Chrome version of the Genie in the Box Firefox extension, with a focus on code sharing and maintainability.

## Current Codebase Analysis

The Genie in the Box Firefox extension uses:
- Manifest V2 format
- Firefox-specific browser APIs
- Standard JavaScript for core functionality
- No complex build system or dependencies

Key Firefox-specific elements identified:
- `browser.runtime` API namespace (Chrome uses `chrome`)
- `browser_action` in manifest.json (Chrome uses `action` in Manifest V3)
- `sidebar_action` (Chrome has no direct equivalent)
- Firefox-specific permissions model

## Migration Approaches

### 1. Platform-Neutral Shared Codebase

**Description**: Maintain a single codebase that works on both Firefox and Chrome through abstraction and conditional logic.

**Implementation**:
- Create browser API abstraction layer
- Use polyfills for Firefox-specific features
- Conditional manifest generation
- Build process that outputs browser-specific packages

**Example Abstraction Layer**:
```javascript
// browser-polyfill.js
const browserAPI = (function() {
  return typeof chrome !== 'undefined' ? chrome : browser;
})();

// Usage throughout codebase
browserAPI.runtime.sendMessage(...);
```

**Pros**:
- Single codebase to maintain
- Changes automatically apply to both platforms
- Easier to ensure feature parity
- Simpler testing (test once, works everywhere)

**Cons**:
- Complexity in handling browser differences
- May require compromises in functionality
- More complex build process
- Some Firefox features may be impossible to replicate exactly

### 2. Shared Library + Browser-Specific Implementations

**Description**: Create a shared core library with browser-specific implementations in separate directories.

**Implementation**:
```
/
├── lib/              # Shared core functionality
│   ├── constants.js
│   ├── genie-utils.js
│   └── ...
├── firefox/          # Firefox-specific code
│   ├── manifest.json
│   ├── background.js
│   └── ...
└── chrome/           # Chrome-specific code
    ├── manifest.json
    ├── background.js
    └── ...
```

**Pros**:
- Clear separation of shared vs. browser-specific code
- Ability to optimize for each browser's capabilities
- Can leverage unique features of each browser
- Easier to maintain than completely separate codebases

**Cons**:
- Duplication of browser-specific code
- Need to maintain feature parity manually
- Changes to shared code could break browser-specific implementations
- More complex directory structure

### 3. Separate Standalone Repositories

**Description**: Maintain completely separate codebases for Firefox and Chrome extensions.

**Implementation**:
- Keep current Firefox repository as-is
- Create new Chrome repository with similar structure
- No direct code sharing, only manual synchronization

**Pros**:
- Complete freedom to optimize for each browser
- No cross-browser compatibility concerns
- Simpler codebase organization within each repo
- Can utilize browser-specific features without compromise

**Cons**:
- Duplicate maintenance effort
- Features must be implemented twice
- Bug fixes don't automatically propagate
- Higher risk of feature/behavior divergence over time

## Industry Practices & Web Research

Based on research of developer discussions and articles:

1. **Mozilla WebExtension Polyfill** is widely recommended for cross-browser extension development:
   - Provides a compatibility layer that makes Chrome extensions work in Firefox
   - Addresses the browser/chrome namespace difference
   - [GitHub: mozilla/webextension-polyfill](https://github.com/mozilla/webextension-polyfill)

2. **Community consensus** from Stack Overflow and Mozilla forums suggests:
   - Approach #2 (shared library) is most common for complex extensions
   - Smaller extensions often use Approach #1 with polyfills
   - Separate repos (Approach #3) typically results from team organization rather than technical benefits

3. **Key migration challenges** identified in developer discussions:
   - Manifest V2 to V3 migration (Firefox still supports V2 but Chrome requires V3)
   - Sidebar functionality in Firefox has no Chrome equivalent
   - Background page vs. service worker model differences
   - Context menu implementation differences

4. **Build tools** commonly used for cross-browser extension development:
   - Webpack with multiple entry points and outputs
   - Rollup for code bundling
   - Gulp/Grunt for task automation
   - Browser-specific manifest merging from a base manifest

## Major Differences to Address

### Manifest Differences
- Firefox uses `browser_action`, Chrome uses `action` (V3)
- Firefox supports `sidebar_action`, Chrome has no equivalent
- Firefox uses `page` for background, Chrome V3 uses `service_worker`

### API Differences
- Firefox: `browser.xyz()`
- Chrome: `chrome.xyz()`
- Firefox promises vs. Chrome callbacks

### Feature Differences
- Firefox sidebar (would need alternative UI in Chrome)
- Chrome's stricter CSP requirements
- Firefox's more extensive permissions model

## Recommendation

**Based on the research, the most effective approach for this project is Approach #2: Shared Library + Browser-Specific Implementations.**

Rationale:
1. The extension has medium complexity with specific Firefox features (sidebar)
2. The core functionality (voice recording, transcription) can be shared
3. UI components need browser-specific implementations
4. This approach offers the best balance of code reuse and browser optimization

Implementation Plan:
1. Restructure repository to create `/lib`, `/firefox`, and `/chrome` directories
2. Move core functionality to `/lib`
3. Create Chrome-specific implementation in `/chrome`
4. Implement alternative for Firefox sidebar functionality in Chrome
5. Set up build process to generate browser-specific extensions

Tools to consider:
- Mozilla's WebExtension Polyfill for API compatibility
- Webpack for bundling and building different targets
- Jest for cross-browser testing

This approach will minimize duplication while allowing for browser-specific optimizations where needed.

## Resources

- [Mozilla WebExtension Polyfill](https://github.com/mozilla/webextension-polyfill)
- [Chrome Extensions Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/)
- [Browser Extension Development Tools](https://extensionworkshop.com/documentation/develop/browser-extension-development-tools/)
- [Cross-browser Extension Boilerplate](https://github.com/crimx/neutrino-webextension)