import {
    VOX_CMD_SEARCH_DDG_NEW_TAB,
    VOX_CMD_SEARCH_GOOGLE_NEW_TAB,
    VOX_CMD_LOAD_NEW_TAB,
    // VOX_CMD_CUT, VOX_CMD_COPY, VOX_CMD_PASTE, VOX_CMD_DELETE, VOX_CMD_SELECT_ALL,
    VOX_EDIT_COMMANDS,
    VOX_CMD_PROOFREAD,
    STEM_MULTIMODAL_BROWSER,
    MODE_COMMAND,
    MODE_TRANSCRIPTION,
    TTS_SERVER_ADDRESS,
    GIB_SERVER_ADDRESS,
    // VOX_CMD_TAB_CLOSE, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD,
    VOX_TAB_COMMANDS,
    EDITOR_URL,
    VOX_CMD_OPEN_EDITOR,
    VOX_CMD_SEARCH_CLIPBOARD_DDG_NEW_TAB,
    VOX_CMD_SEARCH_CLIPBOARD_GOOGLE_NEW_TAB,
    VOX_CMD_SEARCH_GOOGLE_SCHOLAR_NEW_TAB,
    SEARCH_URL_DDG,
    SEARCH_URL_GOOGLE,
    SEARCH_URL_GOOGLE_SCHOLAR,
    SEARCH_URL_PERPLEXITY,
    SEARCH_URL_PHIND,
    CONSTANTS_URL,
    STEM_MULTIMODAL_SERVER_SEARCH,
    VOX_CMD_VIEW_CONSTANTS,
    VOX_CMD_PROOFREAD_STEM,
    VOX_CMD_MODE_RESET,
    VOX_CMD_MODE_EXIT,
    VOX_CMD_ZOOM_RESET,
    VOX_CMD_ZOOM_OUT,
    VOX_CMD_ZOOM_IN,
    VOX_CMD_OPEN_URL_BUCKET,
    BUCKET_URL,
    VOX_CMD_SET_LINK_MODE,
    LINK_MODE_DRILL_DOWN,
    LINK_MODE_NEW_TAB,
    VOX_CMD_SET_PROMPT_MODE,
    PROMPT_MODE_VERBOSE,
    PROMPT_MODE_QUIET,
    PROMPT_MODE_DEFAULT,
    VOX_CMD_RUN_PROMPT,
    VOX_CMD_SUFFIX_FROM_CLIPBOARD,
    VOX_CMD_SUFFIX_FROM_FILE,
    VOX_CMD_SAVE_FROM_CLIPBOARD,
    MULTIMODAL_CONTACT_INFO,
    VOX_CMD_OPEN_FILE, STEM_MULTIMODAL_AGENT, VOX_CMD_VIEW_JOB_QUEUE, VOX_CMD_PROOFREAD_SQL, VOX_CMD_PROOFREAD_PYTHON
} from "/js/constants.js";
import {
    sendMessageToBackgroundScripts,
    readFromLocalStorage,
    queuePasteCommandInLocalStorage,
    queueNewTabCommandInLocalStorage,
    queueHtmlInsertInLocalStorage,
    queueCurrentTabCommandInLocalStorage
} from "/js/util.js";

// ============================================================================
// POPUP AUDIO RECORDING INTERFACE
// ============================================================================
// This module provides the UI for audio recording, leveraging the background
// script for optimized stream management and recording processing.
//
// Key Optimization: Uses cached MediaStream from background to reduce latency 
// from ~2000ms to ~3ms on subsequent recordings (99.84% improvement).
// ============================================================================

// Performance monitoring - only track essential stream acquisition timing
const STREAM_PERFORMANCE_MONITORING = true;
const VERBOSE_DEBUGGING = false; // Set to true for detailed debugging

/**
 * Logs essential stream acquisition timing for performance monitoring
 * 
 * Contract:
 * - PRECONDITION: STREAM_PERFORMANCE_MONITORING must be boolean
 * - POSTCONDITION: Logs timing message if monitoring enabled
 * - SIDE EFFECTS: Console output when enabled
 * - ERROR HANDLING: None needed (guard clause protects execution)
 * 
 * @param {string} message - Description of timing event
 * @param {number|null} startTime - Optional start time for elapsed calculation
 * @returns {number} Current performance.now() timestamp
 */
function streamTimingLog(message, startTime = null) {
    if (STREAM_PERFORMANCE_MONITORING) {
        const now = performance.now();
        if (startTime) {
            console.log(`[STREAM TIMING] ${message}: ${(now - startTime).toFixed(2)}ms`);
        } else {
            console.log(`[STREAM TIMING] ${message} started`);
        }
        return now;
    }
}

/**
 * Verbose debugging helper for development
 * 
 * Contract:
 * - PRECONDITION: VERBOSE_DEBUGGING must be boolean
 * - POSTCONDITION: Logs debug message if enabled
 * - SIDE EFFECTS: Console output when enabled
 * - ERROR HANDLING: None needed (guard clause protects execution)
 * 
 * @param {string} message - Debug message
 * @param {any} data - Optional data object to log
 */
function debugLog(message, data = null) {
    if (VERBOSE_DEBUGGING) {
        const timestamp = performance.now().toFixed(2);
        if (data) {
            console.log(`[RECORDER DEBUG ${timestamp}ms] ${message}`, data);
        } else {
            console.log(`[RECORDER DEBUG ${timestamp}ms] ${message}`);
        }
    }
}

/**
 * General timing helper for detailed performance analysis
 * 
 * Contract:
 * - PRECONDITION: VERBOSE_DEBUGGING must be boolean
 * - POSTCONDITION: Logs timing message if enabled
 * - SIDE EFFECTS: Console output when enabled
 * - ERROR HANDLING: None needed (guard clause protects execution)
 * 
 * @param {string} message - Description of timing event
 * @param {number|null} startTime - Optional start time for elapsed calculation
 * @returns {number} Current performance.now() timestamp
 */
function timingLog(message, startTime = null) {
    if (VERBOSE_DEBUGGING) {
        const now = performance.now();
        if (startTime) {
            console.log(`[TIMING] ${message}: ${(now - startTime).toFixed(2)}ms elapsed`);
        } else {
            console.log(`[TIMING] ${message} at ${now.toFixed(2)}ms`);
        }
        return now;
    }
}

console.log( "RECORDER.js loading..." );
debugLog("Script started loading");

let debug         = false;
var refreshWindow = false;
var mode            = "";
var currentMode     = "";
var prefix          = "";
var transcription   = "";
var titleMode       = "Transcription";
// var results         = [];

async function initializeStartupParameters() {
    const startTime = timingLog("initializeStartupParameters() started");
    console.log( "initializeStartupParameters()..." );

    debugLog("Reading localStorage values");
    currentMode   = await readFromLocalStorage( "mode", MODE_TRANSCRIPTION );
    prefix        = await readFromLocalStorage( "prefix", "" );
    transcription = await readFromLocalStorage( "transcription", "" );
    debug         = await readFromLocalStorage( "debug", false );
    titleMode     = currentMode[ 0 ].toUpperCase() + currentMode.slice( 1 );

    timingLog("initializeStartupParameters() completed", startTime);
    dumpStartupParameters();
}
async function dumpStartupParameters() {

    console.log( "  currentMode [" + currentMode + "]" );
    console.log( "       prefix [" + prefix + "]" );
    console.log( "transcription [" + transcription + "]" );
    console.log( "        debug [" + debug + "]" );
}
function updateLastKnownRecorderState( currentMode, prefix, transcription, debug ) {
    const startTime = timingLog("updateLastKnownRecorderState() started");
    console.log( "updateLastKnownRecorderState()..." );

    // dumpStartupParameters()
    console.log( "  currentMode [" + currentMode + "]" );
    console.log( "       prefix [" + prefix + "]" );
    console.log( "transcription [" + transcription + "]" );
    console.log( "        debug [" + debug + "]" );

    browser.storage.local.set( {
                 "mode": currentMode,
               "prefix": prefix,
        "transcription": transcription,
                "debug": debug
    } );
    timingLog("updateLastKnownRecorderState() completed", startTime);
    console.log( "updateLastKnownRecorderState()... Done!" );
}

function updateLocalStorageLastZoom( value ) {

    console.log( "updateLocalStorageLastZoom()... " + value );
    value = value + "?ts=" + Date.now();
    browser.storage.local.set( {
        "lastZoom": value
    } );
    return true;
}

window.addEventListener( "DOMContentLoaded", async (event) => {
    const domStartTime = timingLog("DOMContentLoaded event fired");

    // Test background page access
    debugLog("Testing background page access");
    try {
        const backgroundPage = await browser.runtime.getBackgroundPage();
        if (backgroundPage && backgroundPage.foo) {
            const result = backgroundPage.foo();
            debugLog("Background page foo() result:", result);
        } else {
            debugLog("Background page or foo() method not found");
        }
    } catch (error) {
        debugLog("Error accessing background page:", error);
    }

    console.log( "DOM fully loaded and parsed, Getting startup parameters...." );
    await initializeStartupParameters();

    // Initialize status indicator based on stream availability
    debugLog("Checking initial stream status");
    try {
        const backgroundPage = await browser.runtime.getBackgroundPage();
        const needsNew = backgroundPage.needsNewStream();
        if (needsNew) {
            setStatusWaiting();
            debugLog("Initial status: waiting (no cached stream)");
        } else {
            setStatusReady();
            playReadySound(); // Play sound if stream is already cached
            debugLog("Initial status: ready (cached stream available)");
        }
    } catch (error) {
        setStatusWaiting();
        debugLog("Initial status: waiting (error checking stream)");
    }

    const modeImg = document.getElementById( "mode-img" )
    modeImg.title = "Mode: " + titleMode;
    if ( titleMode == "Transcription" ) {
        modeImg.src = "../icons/mode-transcription-24.png";
    } else {
        modeImg.src = "../icons/mode-command-24.png";
    }

    document.getElementById( "record" ).hidden = true;
    document.getElementById( "stop" ).focus();

    // console.log( "window.opener.location" + window.opener.location );
    // console.log( "window.parent.location: " + window.parent.location );
    // console.log( "window.parent.location.href: " + window.parent.location.href );

    console.log( "DOM fully loaded and parsed. Checking permissions...." );

    // Only hide if we're not in debug mode
    document.getElementById( "play" ).hidden = !debug;

    debugLog("Checking if should auto-start recording", {
        currentMode,
        transcription,
        condition: currentMode === "transcription" || transcription === ""
    });

    if ( currentMode === "transcription"  || transcription === "" ) {
        debugLog("Auto-starting recording in transcription mode");
        console.log( "Microphone will be requested when recording starts" );
        debugLog("Auto-clicking record button");
        document.getElementById( "record" ).click();
    } else {
        // Skip recording mode and jump right into handling commands.
        debugLog("Entering command mode instead of recording");
        document.getElementById( "stop" ).focus();
        document.getElementById( "recorder-body" ).className = "thinking";
        handleCommand( prefix, transcription )
    }
    timingLog("DOMContentLoaded processing completed", domStartTime);
    console.log( "DOM fully loaded and parsed. Checking permissions.... Done!" );
} );
window.addEventListener( "keydown", function (event) {

    if ( event.key == "Escape" || event.key == "Backspace" ) {
        console.log( "Escape/Backspace pressed, closing window" );
        window.setTimeout( () => {
            window.close();
        }, 250 );
    }
} );

// Note: recordAudio function removed - all recording now handled by background.js

const recordButton = document.querySelector( "#record" );
const stopButton   = document.querySelector( "#stop" );
const playButton   = document.querySelector( "#play" );
const saveButton   = document.querySelector( "#save" );
const modeImage    = document.querySelector( "#mode-img" );
const statusIndicator = document.querySelector( "#status-indicator" );

let recorder;
let audio;
// Note: All recording is now handled via background.js messaging

// Audio feedback for stream ready
let audioContext = null;

/**
 * Play a "ding" sound when microphone stream becomes ready
 * Uses Web Audio API to generate a 800Hz sine wave
 */
function playReadySound() {
    try {
        // Lazy initialize AudioContext to avoid unnecessary overhead
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.frequency.value = 800; // Classic ding frequency
        osc.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.5);
        
        debugLog("Ready sound played");
    } catch (error) {
        debugLog("Error playing ready sound:", error);
        // Non-critical error - continue without sound
    }
}

/**
 * Status Indicator Management Functions
 * 
 * Updates the visual status indicator to show microphone readiness
 */
function setStatusWaiting() {
    statusIndicator.className = 'status-indicator waiting';
    statusIndicator.title = 'Waiting for microphone...';
    debugLog("Status indicator set to waiting");
}

function setStatusReady() {
    statusIndicator.className = 'status-indicator ready';
    statusIndicator.title = 'Ready to record';
    debugLog("Status indicator set to ready");
}

function setStatusRecording() {
    statusIndicator.className = 'status-indicator recording';
    statusIndicator.title = 'Recording...';
    debugLog("Status indicator set to recording");
}

modeImage.addEventListener( "click", async () => {

    if ( currentMode == MODE_COMMAND ) {
        mode = MODE_TRANSCRIPTION;
        modeImage.src = "../icons/mode-transcription-24.png";
        modeImage.title = "Mode: " + MODE_TRANSCRIPTION[ 0 ].toUpperCase() + MODE_TRANSCRIPTION.slice( 1 );
        transcription = "exit";
        handleCommand( prefix, transcription )
    }
} );
/**
 * Record button click handler - optimized for background stream caching
 * 
 * Contract:
 * - PRECONDITION: Browser runtime and background page must be accessible
 * - POSTCONDITION: Recording starts using cached or newly acquired MediaStream
 * - SIDE EFFECTS: Updates button states, may request getUserMedia, sends messages to background
 * - ERROR HANDLING: Resets button states on failure, logs errors
 * 
 * Performance Optimization: Uses background.needsNewStream() to determine if
 * getUserMedia() call is needed. On subsequent recordings, uses cached stream
 * achieving ~99.84% latency reduction (from ~2000ms to ~3ms).
 * 
 * Architecture: Popup handles getUserMedia (user context required), background
 * manages MediaRecorder (persistent context preferred).
 */
recordButton.addEventListener( "click", async () => {
    const buttonClickTime = timingLog("Record button clicked");

    debugLog("Setting button states for recording");
    recordButton.setAttribute( "disabled", true );
    stopButton.removeAttribute( "disabled" );
    stopButton.focus();
    playButton.setAttribute( "disabled", true );
    saveButton.setAttribute( "disabled", true );
    setStatusWaiting();

    // Check if background needs a new stream
    debugLog("Checking if background needs new stream");
    try {
        const backgroundPage = await browser.runtime.getBackgroundPage();
        const needsNew = backgroundPage.needsNewStream();

        if (needsNew) {
            debugLog("Background needs new stream, acquiring getUserMedia");
            const streamStartTime = streamTimingLog("getUserMedia request");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            backgroundPage.setCachedStream(stream);
            streamTimingLog("getUserMedia completed, stream cached", streamStartTime);
            debugLog("New stream sent to background");
        } else {
            debugLog("Background already has active stream");
            if (STREAM_PERFORMANCE_MONITORING) {
                console.log("[STREAM TIMING] Using cached stream - no delay");
            }
        }

        // Brief ready state before recording starts
        setStatusReady();
        playReadySound(); // Play the ding sound when stream is ready
        setTimeout(() => {
            setStatusRecording();
            debugLog("Sending start-recording command to background");
            browser.runtime.sendMessage({ command: "start-recording" });
        }, 200); // 200ms flash of ready state

    } catch (error) {
        debugLog("Error setting up stream:", error);
        // Reset button states
        recordButton.removeAttribute( "disabled" );
        stopButton.setAttribute( "disabled", true );
        setStatusWaiting(); // Reset to waiting state on error
    }

    timingLog("Record button handling completed", buttonClickTime);
} );

/**
 * Stop button click handler - sends stop command to background MediaRecorder
 * 
 * Contract:
 * - PRECONDITION: Recording must be in progress (background MediaRecorder active)
 * - POSTCONDITION: UI updated to recording-disabled state, background stops recording
 * - SIDE EFFECTS: Updates button states and body class, sends message to background
 * - ERROR HANDLING: None needed (message sending is fire-and-forget)
 * 
 * Performance Note: Background MediaRecorder handles stop event and audio processing
 * asynchronously, then sends recording-complete message back to popup.
 */
stopButton.addEventListener( "click", async () => {
    const stopClickTime = timingLog("Stop button clicked");
    debugLog("Stop button clicked, updating UI and sending stop command");

    document.body.className = "recording-disabled";
    recordButton.removeAttribute( "disabled" );
    stopButton.setAttribute( "disabled", true);
    playButton.removeAttribute( "disabled" );
    saveButton.removeAttribute( "disabled" );
    saveButton.focus();
    setStatusReady(); // Return to ready state after recording

    debugLog("Sending stop-recording command to background");
    browser.runtime.sendMessage({ command: "stop-recording" });

    timingLog("Stop button handling completed", stopClickTime);
} );

playButton.addEventListener( "click", () => {
    debugLog("Play button clicked");
    if (audio && audio.play) {
        audio.play();
    } else {
        debugLog("No audio available to play");
    }
} );

saveButton.addEventListener( "click", async () => {
    const saveClickTime = timingLog("Save button clicked - starting transcription process");
    debugLog("Save button clicked, starting transcription process");

    if (!audio || !audio.audioBlob) {
        debugLog("No audio available for transcription");
        return;
    }

    // Reset status to waiting while processing
    setStatusWaiting();

    const promptFeedback = await getPromptFeedbackMode();

    const url = GIB_SERVER_ADDRESS + "/api/upload-and-transcribe-mp3?prompt_key=generic&prefix=" + prefix + "&prompt_feedback=" + promptFeedback;
    console.log( "Upload and transcribing to url [" + url + "]" )

    try {
        debugLog("Converting audio blob to data URL");
        const blobStartTime = timingLog("readBlobAsDataURL started");
        const result = await readBlobAsDataURL(audio.audioBlob)
        timingLog("readBlobAsDataURL completed", blobStartTime);
        console.log("Mime type [" + result.split(",")[0] + "]");

        const audioMessage = result.split(",")[1];
        const mimeType = result.split(",")[0];

        document.getElementById("recorder-body").className = "thinking";

        debugLog("Sending transcription request to server");
        const fetchStartTime = timingLog("Fetch request to transcription server started");
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": mimeType},
            body: audioMessage
        });
        timingLog("Fetch request completed", fetchStartTime);
        document.getElementById("recorder-body").className = "thinking-disabled"
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        debugLog("Parsing transcription response");
        const jsonStartTime = timingLog("JSON parsing started");
        const transcriptionJson = await response.json();
        timingLog("JSON parsing completed", jsonStartTime);
        console.log( "transcriptionJson [" + JSON.stringify( transcriptionJson ) + "]" );
        let transcription = transcriptionJson[ "transcription" ];
        let prefix        = transcriptionJson[ "prefix" ];
        let results       = transcriptionJson[ "results" ];

        debugLog("Processing transcription results", { transcription, prefix, results });

        if ( results[ "command" ] != undefined ) {

            if ( results[ "command" ].startsWith( "search " ) ) {
                handleSearchCommands( results );
            } else if ( results[ "command" ].startsWith( "go to " ) ) {
                handleLoadCommands( results );
            } else if ( results[ "match_type" ].startsWith( "string_matching_" ) ) {
                console.log( "handling string_matching_*" )
                if ( results[ "args" ][ 0 ] != undefined ) {
                    console.log( "TODO: Finish refactoring! " );
                    // For now, stitch command and arguments back together and ship them off
                    handleCommand( STEM_MULTIMODAL_BROWSER, ( results[ "command" ] + " " + results[ "args" ][ 0 ] ).trim() );
                } else {
                    handleCommand( STEM_MULTIMODAL_BROWSER, results[ "command" ] );
                }
            }
        } else if ( prefix.startsWith( STEM_MULTIMODAL_AGENT ) || transcription.startsWith( STEM_MULTIMODAL_AGENT ) ) {

            console.log( "Multimodal agent call received, closing" );
            // bring q viewer to the foreground if it's in the background, or display if it's not displayed
            sendMessageToBackgroundScripts( VOX_CMD_VIEW_JOB_QUEUE );
            closeWindow();

        } else if ( prefix.startsWith( STEM_MULTIMODAL_BROWSER ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER ) ) {

            handleCommand( prefix, transcription );

        } else if ( transcriptionJson[ "mode" ].startsWith( MULTIMODAL_CONTACT_INFO ) ) {

            console.log( " contact info: " + results )
            console.log( "transcription: " + transcription )
            const writeCmd = await navigator.clipboard.writeText( results )
            queuePasteCommandInLocalStorage( Date.now() );
            closeWindow();

        } else if ( transcriptionJson[ "mode" ].startsWith( STEM_MULTIMODAL_SERVER_SEARCH ) ) {

            console.log( "  mode: " + transcriptionJson[ "mode" ] )
            handleServerSearchResults( results );

        } else if ( prefix.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_RUN_PROMPT ) || transcriptionJson[ "mode" ].startsWith( VOX_CMD_RUN_PROMPT ) ) {

            console.log( "prefix: " + prefix )
            console.log( "  mode: " + transcriptionJson[ "mode" ] )
            handleServerPromptResults( results );

        } else {

            // console.log( "Pushing 'transcription' part of this response object to clipboard [" + JSON.stringify( transcriptionJson ) + "]..." );
            console.log( "Pushing 'transcription' to clipboard [" + transcriptionJson[ "transcription" ] + "]" );

            updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

            const writeCmd = await navigator.clipboard.writeText( transcription )
            queuePasteCommandInLocalStorage( Date.now() );

            if ( debug ) { console.log( "Success!" ); }
            closeWindow();
        }
        timingLog("Save button handling completed", saveClickTime);
    } catch ( e ) {
        console.log( "Error processing audio file [" + e.stack + "]" );
        console.trace() ;
        
        // Resize window to accommodate error dialog
        const currentWindow = await browser.windows.get(browser.windows.WINDOW_ID_CURRENT);
        browser.windows.update(browser.windows.WINDOW_ID_CURRENT, {
            width: currentWindow.width * 2,
            height: currentWindow.height
        });
        
        // Show user-friendly error message
        alert("Server error occurred while processing audio. Please try again.");
        
        // Reset status before closing
        setStatusWaiting();
        
        // Close the popup window
        closeWindow();
    }
} );

function handleServerSearchResults( results ) {

    console.log( "Processing multimodal server search results..." )

    let idx = 1;
    let urlChunks = "<ul>";
    for ( const result of results ){
        let urlChunk = `<li>${idx}) <a href="${result[ 'href' ]}">${result[ 'title' ]}</a></li>`;
        console.log( "urlChunk [" + urlChunk + "]" );
        urlChunks += urlChunk;
        idx++;
    }
    urlChunks += "</ul>";

    // const writeCmd = await navigator.clipboard.writeText( urlChunks )
    queueHtmlInsertInLocalStorage( urlChunks );

    console.log( "Done!" );
    closeWindow();
}

function handleServerPromptResults( results ) {

    console.log( "TODO: Processing multimodal server prompt results..." )
    console.log( "results [" + JSON.stringify( results ) + "]" )

    console.log( "Done!" );
    closeWindow();
}

async function handleSearchCommands( results ) {

    console.log( "handleSearchCommands( results ) called..." );

    let command = results[ "command" ];

    const isGoogle     = command.includes( " google" );
    const isScholar    = command.includes( " scholar" );
    const isPhind      = command.includes( " phind" );
    const isPerplexity = command.includes( " perplexity" );

    const isNewTab     = command.includes( " new tab" );
    const useClipboard = command.includes( " clipboard" );
    const isDuckDuckGo = !isGoogle && !isScholar && !isPhind && !isPerplexity;
    // const isCurrentTab = !isNewTab;
    let args    = results[ "args" ];

    // get search terms from clipboard, if requested
    if ( useClipboard ) {
        args[ 0 ] = encodeURIComponent( await navigator.clipboard.readText() );
        console.log( "using clipboard content [" + args[ 0 ] + "]" );
    }

    // Test for valid arguments
    // Log to console.
    console.log( "args [" + args[ 0 ] + "]" );
    if ( args[ 0 ] == "no_search_terms" || args[ 0 ] == "" ) {
        // TODO: why is text to speech not blocking?
        await doTextToSpeech( "No search terms found. Try again?", refreshWindow=true );
        window.location.reload();
        return;
    }
    // Get URL
    let url = "";
    if ( isGoogle ) {
        if ( isScholar ) {
            url = SEARCH_URL_GOOGLE_SCHOLAR;
        } else {
            url = SEARCH_URL_GOOGLE;
        }
    } else if ( isDuckDuckGo ) {
        url = SEARCH_URL_DDG;
    } else if ( isPhind ) {
        url = SEARCH_URL_PHIND;
    } else if ( isPerplexity ) {
        url = SEARCH_URL_PERPLEXITY;
    }

    if ( isNewTab ) {
        queueNewTabCommandInLocalStorage( url, "&q=" + args[ 0 ] )
    } else {
        queueCurrentTabCommandInLocalStorage( url, "&q=" + args[ 0 ] )
    }
    closeWindow();
}

async function handleLoadCommands( results ) {

    console.log( "handleLoadCommands( resultsJson ) called... " + JSON.stringify( results ) );

    // Test for valid arguments
    const args = results[ "args" ]
    if ( args[ 0 ] == "no_search_terms" || args[ 0 ].length == 0 ) {
        // TODO: why is text to speech not blocking?
        await doTextToSpeech( "No domain name found. Try again?", refreshWindow=true );
        window.location.reload();
        return;
    }
    const command = results[ "command" ];
    console.log( "command [" + command + "]" );

    // squeeze out any blank chars that may have crept in
    let url = "https://" + args[ 0 ].replace( " ", "" );
    console.log( "url [" + url + "]" );

    if ( command == VOX_CMD_LOAD_NEW_TAB ) {
        queueNewTabCommandInLocalStorage( url );
    } else {
        // Default to opening in the current tab
        queueCurrentTabCommandInLocalStorage( url )
    }
    closeWindow();
}
async function handleCommand( prefix, transcription ) {
    const handleCommandStartTime = timingLog("handleCommand started");
    debugLog("handleCommand called", { prefix, transcription });
    console.log( "handleCommands( transcription ) called with prefix [" + prefix + "] transcription [" + transcription + "]" );

    if ( ( prefix == STEM_MULTIMODAL_BROWSER && ( transcription === "mode" || transcription === "help" )  ) ||
         ( prefix == "" && transcription === STEM_MULTIMODAL_BROWSER ) ) {

        // Remove whatever commands were sent.
        transcription = "";
        prefix        = STEM_MULTIMODAL_BROWSER;
        currentMode   = MODE_COMMAND;
        document.getElementById( "stop" ).className = "disabled";

        const modeImg = document.getElementById( "mode-img" )
        modeImg.title = "Mode: Command";
        modeImg.src   = "../icons/mode-command-24.png";

        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );
        window.location.reload();

    } else if ( transcription.startsWith( VOX_CMD_PROOFREAD_PYTHON ) ) {

        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        await proofreadPythonFromClipboard();
        // closeWindow(); // Why does this not work?
        window.close();

    } else if ( transcription.startsWith( VOX_CMD_PROOFREAD_SQL ) ) {

        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        await proofreadSqlFromClipboard();
        // closeWindow(); // Why does this not work?
        window.close();

    } else if ( transcription.startsWith( VOX_CMD_PROOFREAD_STEM ) || transcription == VOX_CMD_PROOFREAD ) {

        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        await proofreadFromClipboard();
        // closeWindow(); // Why does this not work?
        window.close();

    } else if ( VOX_TAB_COMMANDS.includes( transcription ) ) {

        console.log( "Editing command found: " + transcription );
        sendMessageToBackgroundScripts( transcription );
        closeWindow();

    } else if ( transcription === VOX_CMD_VIEW_JOB_QUEUE ) {

        sendMessageToBackgroundScripts( VOX_CMD_VIEW_JOB_QUEUE );
        closeWindow();

    } else if ( transcription === VOX_CMD_OPEN_EDITOR ) {

        queueNewTabCommandInLocalStorage( EDITOR_URL )
        closeWindow();

    } else if ( transcription === VOX_CMD_OPEN_URL_BUCKET ) {

        queueNewTabCommandInLocalStorage(BUCKET_URL)
        closeWindow();

    } else if ( transcription === VOX_CMD_SAVE_FROM_CLIPBOARD ) {

        // FROM: https://stackoverflow.com/questions/40269862/save-data-uri-as-file-using-downloads-download-api
        var blob = new Blob([ await navigator.clipboard.readText() ], { type: "text/plain;charset=utf-8" } )
        var downloading = browser.downloads.download( {
            url: URL.createObjectURL(blob),
            saveAs: true,
            filename: "prompt-0000000.txt",
            conflictAction: 'uniquify'
        }).then(function (downloadId) {
            console.log( "Download started with ID [" + downloadId + "]" );
        });
        closeWindow();

    } else if ( transcription === VOX_CMD_OPEN_FILE ) {

        console.log( "Opening file..." )
        await doTextToSpeech( "Firefox has a weird bug. You need to click on the open file button manually." );
        // await sendMessageToBackgroundScripts( VOX_CMD_OPEN_FILE );
        // closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_RUN_PROMPT ) ) {

        if ( transcription.endsWith( VOX_CMD_SUFFIX_FROM_CLIPBOARD ) ) {
            runPromptFromClipboard();
        } else if ( transcription.endsWith( VOX_CMD_SUFFIX_FROM_FILE ) ) {
            doTextToSpeech( "TODO: implement run prompt from file" );
        } else {
            doTextToSpeech( "I don't understand prompt command suffix " + transcription.replace( VOX_CMD_RUN_PROMPT, "" ) );
        }

    } else if ( transcription.startsWith( VOX_CMD_SET_LINK_MODE ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_SET_LINK_MODE ) ) {

        if ( transcription.endsWith( LINK_MODE_DRILL_DOWN ) ) {
            await browser.storage.local.set( { "linkMode": LINK_MODE_DRILL_DOWN } );
            await doTextToSpeech( LINK_MODE_DRILL_DOWN )
        } else if ( transcription.endsWith( LINK_MODE_NEW_TAB ) ) {
            await browser.storage.local.set( { "linkMode": LINK_MODE_NEW_TAB } );
            await doTextToSpeech( LINK_MODE_NEW_TAB )
        } else {
            await browser.storage.local.set( { "linkMode": LINK_MODE_DEFAULT } );
            await doTextToSpeech( LINK_MODE_DEFAULT )
        }
        await closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_SET_PROMPT_MODE ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_SET_PROMPT_MODE ) ) {

        if ( transcription.endsWith( PROMPT_MODE_VERBOSE ) ) {
            await browser.storage.local.set( { "promptMode": PROMPT_MODE_VERBOSE } );
            await doTextToSpeech( PROMPT_MODE_VERBOSE )
        } else if ( transcription.endsWith( PROMPT_MODE_QUIET ) ) {
            await browser.storage.local.set( { "promptMode": PROMPT_MODE_QUIET } );
            await doTextToSpeech( PROMPT_MODE_QUIET )
        } else {
            await browser.storage.local.set( { "promptMode": PROMPT_MODE_DEFAULT } );
            await doTextToSpeech( PROMPT_MODE_DEFAULT )
        }
        await closeWindow();

    } else if ( transcription === VOX_CMD_MODE_RESET || transcription === VOX_CMD_MODE_EXIT || transcription === MODE_TRANSCRIPTION  ) {

        currentMode   = MODE_TRANSCRIPTION;
               prefix = "";
        transcription = "";
        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

        await doTextToSpeech( "Switching to " + currentMode + " mode", refreshWindow=true);

    } else if ( transcription.startsWith( VOX_CMD_VIEW_CONSTANTS ) ) {

        queueNewTabCommandInLocalStorage( CONSTANTS_URL )
        closeWindow();

    } else if ( VOX_EDIT_COMMANDS.includes( transcription ) ) {

        console.log( "Editing command found: " + transcription );
        sendMessageToBackgroundScripts( transcription );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_RESET ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_ZOOM_RESET ) ) {

        console.log( "Zoom reset..." );
        updateLocalStorageLastZoom( 0 );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_OUT ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_ZOOM_OUT ) ) {

        console.log( "Zooming out..." );
        let zoomCount = ( transcription.split( "zoom out" ).length - 1 ) * -1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_IN ) || transcription.startsWith( STEM_MULTIMODAL_BROWSER + " " + VOX_CMD_ZOOM_IN ) ) {

        console.log( "Zooming in..." );
        let zoomCount = transcription.split( "zoom" ).length - 1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount );
        closeWindow();

    } else {
        console.log( "Unknown command [" + transcription + "]" );
        await doTextToSpeech( "Unknown command " + transcription, refreshWindow=true );
    }
    timingLog("handleCommand completed", handleCommandStartTime);
}
function getPromptFeedbackMode() {

    const promptFeedback = browser.storage.local.get( "promptMode" ).then( ( result ) => {
        return result.promptMode;
    });
    return promptFeedback;
}
async function runPromptFromClipboard() {

    try {

        document.getElementById( "recorder-body" ).className = "thinking";
        await doTextToSpeech( "Processing prompt", refreshWindow=false )

        const promptFeedback = await getPromptFeedbackMode();
        console.log( "promptFeedback [" + promptFeedback + "]" )

        const rawPrompt = await navigator.clipboard.readText()
        console.log( "rawPrompt [" + rawPrompt + "]" );
        let url = GIB_SERVER_ADDRESS + "/api/run-raw-prompt-text?prompt_feedback=" + promptFeedback + "&prompt_and_content=" + rawPrompt
        const response = await fetch( url, {
            method: "GET",
            headers: {"Access-Control-Allow-Origin": "*"}
        } );
        console.log( "response.status [" + response.status + "]" );

        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const promptResponse = await response.text();
        console.log( "promptResponse [" + promptResponse + "]" );

        console.log( "Pushing promptResponse to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( promptResponse );

        // Doing HTML insert op another div instead of a verbatim copy & paste.
        // queuePasteCommandInLocalStorage( Date.now() );
        console.log( "Appending promptResponse to current active document dom..." );
        queueHtmlInsertInLocalStorage( promptResponse );

        closeWindow();

    } catch ( error ) {
        console.error( error );
    }
}
async function proofreadFromClipboard() {

    try {

        doTextToSpeech( "Proofreading...", refreshWindow=false )

        const rawText = await navigator.clipboard.readText()
        console.log( "rawText [" + rawText + "]" );

        let url = GIB_SERVER_ADDRESS + "/api/proofread?question=" + rawText
        const response = await fetch( url, {
            method: "GET",
            headers: {"Access-Control-Allow-Origin": "*"}
        } );
        console.log( "response.status [" + response.status + "]" );

        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const proofreadText = await response.text();
        console.log( "proofreadText [" + proofreadText + "]" );

        console.log( "Pushing proofreadText [" + proofreadText + "] to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( proofreadText );
        queuePasteCommandInLocalStorage( Date.now() );

        doTextToSpeech( "Done!", refreshWindow=false );

    } catch ( e ) {
        console.log( "Error: " + e );
    }
}
async function proofreadSqlFromClipboard() {

    try {

        doTextToSpeech( "Proofreading SQL...", refreshWindow=false )

        const rawText = await navigator.clipboard.readText()
        console.log( "rawText [" + rawText + "]" );

        let url = GIB_SERVER_ADDRESS + "/api/proofread-sql?question=" + rawText
        const response = await fetch( url, {
            method: "GET",
            headers: {"Access-Control-Allow-Origin": "*"}
        } );
        console.log( "response.status [" + response.status + "]" );

        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const proofreadText = await response.text();
        console.log( "proofreadText [" + proofreadText + "]" );

        console.log( "Pushing proofreadText [" + proofreadText + "] to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( proofreadText );
        queuePasteCommandInLocalStorage( Date.now() );

        doTextToSpeech( "Done!", refreshWindow=false );

    } catch ( e ) {
        console.log( "Error: " + e );
    }
}

async function proofreadPythonFromClipboard() {

    try {

        doTextToSpeech( "Proofreading Python...", refreshWindow=false )

        const rawText = await navigator.clipboard.readText()
        console.log( "rawText [" + rawText + "]" );

        let url = GIB_SERVER_ADDRESS + "/api/proofread-python?question=" + rawText
        const response = await fetch( url, {
            method: "GET",
            headers: {"Access-Control-Allow-Origin": "*"}
        } );
        console.log( "response.status [" + response.status + "]" );

        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const proofreadText = await response.text();
        console.log( "proofreadText [" + proofreadText + "]" );

        console.log( "Pushing proofreadText [" + proofreadText + "] to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( proofreadText );
        queuePasteCommandInLocalStorage( Date.now() );

        doTextToSpeech( "Done!", refreshWindow=false );

    } catch ( e ) {
        console.log( "Error: " + e );
    }
}

async function closeWindow(timeout = 250) {
    await window.setTimeout(() => {
        window.close();
    }, 250);
}

async function readBlobAsDataURL( file ) {
    const readBlobStartTime = timingLog("readBlobAsDataURL started");
    debugLog("Starting FileReader operation");

    // From: https://errorsandanswers.com/read-a-file-synchronously-in-javascript/
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = (e) => resolve(fileReader.result);
        fileReader.readAsDataURL( file );
    } );
    console.log(result_base64.split( "," )[ 0 ]);
    timingLog("readBlobAsDataURL completed", readBlobStartTime);

    return result_base64;
}

async function doTextToSpeech( text, refreshWindow=false ) {

    console.log( "doTextToSpeech() called..." )

    let url = TTS_SERVER_ADDRESS + "/api/tts?text=" + text
    const encodedUrl = encodeURI( url );
    console.log( "encoded: " + encodedUrl );

    let audioResult = await new Promise((resolve) => {
        let audio = new Audio(encodedUrl);
        audio.onload = (e) => resolve( audio.result );
        audio.play();
        audio.addEventListener( "ended", () => {
            if ( refreshWindow ) {
                window.setTimeout(() => {
                    window.location.reload();
                }, 250);
            }
        } );
        resolve( true );
    } );
    console.log( "audioResult [" + audioResult + "]" );

    console.log( "doTextToSpeech() called... done!" )
}

/**
 * Message listener for background-to-popup communication
 * 
 * Contract:
 * - PRECONDITION: Browser runtime messaging system must be functional
 * - POSTCONDITION: Processes recording-complete messages, creates audio objects
 * - SIDE EFFECTS: Updates global audio variable, creates object URLs
 * - ERROR HANDLING: Uses default mimeType fallback, relies on dataURLtoBlob validation
 * 
 * Performance Note: Receives base64 audio data from background MediaRecorder processing,
 * converts to Blob and creates object URL for immediate play/save functionality.
 */
browser.runtime.onMessage.addListener((message) => {
    debugLog("Message received from background", message);

    if (message.command === "recording-complete") {
        debugLog("Recording complete, received audio data");

        // Create audio object from base64 data
        const mimeType = message.mimeType || "audio/mpeg";
        const audioDataUrl = `data:${mimeType};base64,${message.audioData}`;
        const audioBlob = dataURLtoBlob(audioDataUrl);
        const audioUrl = URL.createObjectURL(audioBlob);

        // Store audio for play and save functionality
        audio = {
            audioBlob: audioBlob,
            audioUrl: audioUrl,
            play: () => {
                const audioElement = new Audio(audioUrl);
                audioElement.play();
            }
        };

        debugLog("Audio object created, ready for play/save");
    }
});

/**
 * Converts data URL to Blob object for audio processing
 * 
 * Contract:
 * - PRECONDITION: dataURL must be valid data URL with format "data:mime;base64,data"
 * - POSTCONDITION: Returns Blob object with correct MIME type
 * - SIDE EFFECTS: None (pure function)
 * - ERROR HANDLING: Regex parsing may throw if dataURL format invalid
 * 
 * @param {string} dataURL - Data URL string from background message
 * @returns {Blob} Audio blob ready for URL.createObjectURL()
 */
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type: mime});
}

console.log( "RECORDER.js loaded" );