# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands
- To run the extension locally in Firefox: `web-ext run`
- To build the extension package: `web-ext build`
- Testing: Manual testing through Firefox browser

## Code Style Guidelines
- Import organization: Group imports by source, with internal imports (/js/*.js) separated from external
- Constants: Use UPPER_SNAKE_CASE for exported constants
- Variables: Use camelCase for variables and functions
- Error handling: Use try/catch blocks with appropriate error logging to console
- Prefer async/await pattern for asynchronous operations
- Include console.log statements for debugging at start/end of functions
- End-of-file console.log statements to confirm file loading
- Browser API: Use Firefox browser extensions API conventions
- Comments: Use TODO comments for work-in-progress areas
- Use ES6 features (arrow functions, destructuring, template literals)
- String format: Use double quotes for strings
- Mark browser.runtime.lastError as void when creating context menu items

## Current Project Status (2025-04-27)
We are implementing build automation for the Firefox extension. Current progress:

1. ✅ Created package.json with scripts for linting, building, running, and signing
2. ✅ Implemented version management script (scripts/update-version.js)
3. ✅ Set up GitHub Actions workflow (.github/workflows/build-test-publish.yml)
4. ✅ Created basic testing framework with Jest
5. ✅ Added documentation for Mozilla Add-ons API setup
6. ✅ Updated README with automation instructions

### Current Branch
Working on feature branch: `wip-deepily-build-automation-2025.04.27`

### Next Steps
1. Obtain Mozilla Add-ons API credentials following the guide in rnd/mozilla-addon-credentials.md
2. Store credentials in GitHub repository secrets
3. Test the workflow by creating a new release
4. Potentially integrate with web-ext-submit for direct submission to AMO
5. Explore automated version bumping for releases