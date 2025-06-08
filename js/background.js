import {
    ZOOM_INCREMENT,
    ZOOM_MAX,
    ZOOM_MIN,
    ZOOM_DEFAULT,
    TTS_SERVER_ADDRESS,
    GIB_SERVER_ADDRESS,
    MODE_TRANSCRIPTION,
    MODE_COMMAND,
    VOX_EDIT_COMMANDS,
    VOX_CMD_TAB_CLOSE,
    VOX_CMD_TAB_REFRESH,
    VOX_CMD_TAB_BACK,
    VOX_CMD_TAB_FORWARD,
    VOX_CMD_PASTE,
    VOX_CMD_OPEN_FILE,
    STEM_MULTIMODAL_BROWSER, MODE_AGENT, STEM_MULTIMODAL_AGENT, VOX_CMD_VIEW_JOB_QUEUE
} from "/js/constants.js";
import {
    displayQueue,
    displayRecorder
} from "/js/menu-and-side-bar.js";
import {
    callOnActiveTab,
    getCurrentTab,
    loadContentScript,
    readFromLocalStorage,
    queuePasteCommandInLocalStorage,
    queueNewTabCommandInLocalStorage,
    sendMessageToContentScripts,
    sendMessageToOneContentScript, handleOneFile
} from "/js/util.js";

let lastPaste         = "";
let lastUrlNewTab     = "";
let lastUrlCurrentTab = "";
let lastZoom          = "";
let lastTabId       = -1;
let lastHtmlToInsert  = "";

var mode      = "";
var prefix    = "";
var command   = "";

console.log( "background.js loading..." );

let titleMode = "Transcription"

window.addEventListener( "DOMContentLoaded", async (event) => {

    console.log( "DOM fully loaded and parsed, initializing global values..." );
    lastUrlNewTab = await readFromLocalStorage( "lastUrlNewTab", "" ).then( (value) => {
        return value;
    } );
    console.log( "lastUrlNewTab [" + lastUrlNewTab + "]" );

    titleMode = await readFromLocalStorage( "mode", "Transcription" ).then( (value) => {
        return value;
    } );
    titleMode = titleMode[ 0 ].toUpperCase() + titleMode.slice( 1 );
    console.log( "titleMode [" + titleMode + "]" );

    return true;
} );

console.log( "browser.commands.onCommand.addListener ..." )
browser.commands.onCommand.addListener( ( command) => {

    if ( command === "popup-vox-to-text" ) {
        displayRecorder( mode = "transcription" );
    }
});
console.log( "browser.commands.onCommand.addListener ... Done?" )

browser.contextMenus.create( {
        id: "transcribe–and–paste",
        title: "Transcribe 'n' Paste",
        contexts: ["all"]
    },
    // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
    // for information on the purpose of this error capture.
    () => void browser.runtime.lastError,
);

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "whats-this-mean" ) {

        console.log( "whats-this-mean clicked [" + info.selectionText + "]" );
        console.log( "info: " + JSON.stringify(info) );

        console.log( "calling fetchWhatsThisMean()..." )
        new Promise(function (resolve, reject) {

            fetchWhatsThisMean(info).then((explanation) => {
                console.log( "calling fetchWhatsThisMean()... done!" )
            });
        });
    } else if ( info.menuItemId === "proofread" ) {

        proofread( info.selectionText );

    } else if ( info.menuItemId === "transcribe–and–paste" ) {
        console.log( "transcribe-and-paste clicked [" + JSON.stringify( info ) + "]" );
        displayRecorder( mode=MODE_TRANSCRIPTION );
    }
});

async function proofread( rawText ) {

    console.log( "proofread() rawText [" + rawText + "]" );
    try {
        await doTextToSpeech( "Proofreading..." )
        let url = GIB_SERVER_ADDRESS + "/api/proofread?question=" + rawText

        console.log( "Calling GIB_SERVER_ADDRESS [" + GIB_SERVER_ADDRESS + "]..." );

        const response = await fetch( url, {
            method: 'GET',
            headers: {'Access-Control-Allow-Origin': '*'}
        } );
        console.log( "response.status [" + response.status + "]" );

        if (!response.ok) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const proofreadText = await response.text();
        console.log( "proofreadText [" + proofreadText + "]" );

        console.log( "Pushing proofreadText to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( proofreadText );

        doTextToSpeech( "Done!" );
        queuePasteCommandInLocalStorage( Date.now() );

    } catch ( e ) {

        doTextToSpeech( "Unable to proofread that text, please see the error log." );
        console.log( "Error: " + e );
    }
}

let fetchWhatsThisMean = async (info) => {

    console.log( "fetchWhatsThisMean() called..." )

    let url = GIB_SERVER_ADDRESS + "/api/ask-ai-text?question=" + info.selectionText
    const encodedUrl = encodeURI(url);
    console.log( "encoded: " + encodedUrl);

    await fetch(url, {
        method: 'GET',
        headers: {'Access-Control-Allow-Origin': '*'}
    }).then( async (response) => {
        console.log( "response.status: " + response.status);
        if ( response.status !== 200) {
            return Promise.reject( "Server error: " + response.status);
        } else {
            await response.text().then( async respText => {
                console.log( "respText: " + respText);
                await doTextToSpeech( respText )
            })
        }
    })
}

let doTextToSpeech = async (text) => {

    console.log( "doTextToSpeech() called..." )

    let url = TTS_SERVER_ADDRESS + "/api/tts?text=" + text
    const encodedUrl = encodeURI(url);
    console.log( "encoded: " + encodedUrl);

    const audio = new Audio(encodedUrl);
    await audio.play();

    console.log( "doTextToSpeech() called... done!" )
}

function createNewTab( url ) {

    console.log( "createNewTab() called..." )
    browser.tabs.create( { url: url } );
}
browser.storage.onChanged.addListener( async (changes, areaName) => {

    console.log( "background.js: storage.onChanged() called..." )
    console.log( "changes: " + JSON.stringify( changes ) );

    console.log( "areaName: " + areaName );
    console.log( "lastUrlNewTab: " + lastUrlNewTab );
    console.log( "lastZoom: " + lastZoom );
    console.log( "lastTabId: " + lastTabId );
    console.log( "lastPaste: " + lastPaste );
    console.log( "lastUrlCurrentTab: " + lastUrlCurrentTab );

    if ( areaName === "local" ) {

        if ( changes.lastUrlNewTab !== undefined && lastUrlNewTab !== changes.lastUrlNewTab.newValue ) {
            lastUrlNewTab = changes.lastUrlNewTab.newValue;
            openNewTab( changes.lastUrlNewTab.newValue );
        }

        if ( changes.lastUrlCurrentTab !== undefined && lastUrlCurrentTab !== changes.lastUrlCurrentTab.newValue ) {
            lastUrlCurrentTab = changes.lastUrlCurrentTab.newValue;
            sendMessageToOneContentScript( lastTabId, "load-url", lastUrlCurrentTab );
        }

        if ( changes.lastTabId !== undefined && lastTabId !== parseInt(changes.lastTabId.newValue ) ) {
            lastTabId = parseInt( changes.lastTabId.newValue );
        }

        if ( changes.lastZoom !== undefined && lastZoom !== changes.lastZoom.newValue ) {

            lastZoom = changes.lastZoom.newValue;
            // Remove time stamp from URL
            const zoom = lastZoom.split( "?ts=" )[0];
            console.log( "Zoom: " + zoom);
            console.log( "lastTabId: " + lastTabId);
            zoomInOut( lastTabId, zoom );
        }

        if ( changes.lastPaste !== undefined && lastPaste != changes.lastPaste.newValue ) {

            lastPaste = changes.lastPaste.newValue;
            console.log( "lastPaste updated, sending message to paste from clipboard..." );
            sendMessageToOneContentScript( lastTabId, "command-paste" );
        }

        if ( changes.lastHtmlToInsert !== undefined && lastHtmlToInsert != changes.lastHtmlToInsert.newValue ) {

            lastHtmlToInsert = changes.lastHtmlToInsert.newValue;
            console.log( "lastHtmlToInsert updated, sending message to paste html..." );
            sendMessageToOneContentScript( lastTabId, "command-append-html-to-body", lastHtmlToInsert );
        }
    }


    console.log( "lastUrlNewTab: " + lastUrlNewTab );
    console.log( "lastZoom: " + lastZoom );
    console.log( "lastTabId: " + lastTabId );
} );
function openNewTab( url ) {
  console.log( "Opening new tab: " + url );
   browser.tabs.create( {
     "url": url
   });
}

async function sendMessage( command ) {

    console.log( "sendMessage( command: " + command + " ) called..." )

    await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        let tab = tabs[0];
        console.log( "tab.id: " + tab.id );
        await browser.tabs.sendMessage( tab.id, {
            command: command
        } );
        return true;
    } );
}
function zoomInOut( tabId, zoom ) {

    console.log( "zoomInOut( tab.id: " + tabId + ", zoom: " + zoom+ " ) called..." )

    let newZoomFactor = ZOOM_DEFAULT;
    let gettingZoom = browser.tabs.getZoom( tabId );
    gettingZoom.then( ( zoomFactor ) => {

        if ( zoom != 0 ) {
            let incrementing = zoom > 0;
            newZoomFactor    = zoomFactor;

            // If we're zooming out, we need to make the zoom factor negative
            if ( !incrementing ) {
                zoom = zoom * -1;
            }
            for ( let i = 0; i < zoom; i++ ) {

                console.log( "Zooming... " + i );

                if ( newZoomFactor >= ZOOM_MAX || newZoomFactor <= ZOOM_MIN ) {
                    console.log( "Tab zoom factor is already at max/min!" );
                } else {
                    if ( incrementing ) {
                        newZoomFactor += ZOOM_INCREMENT;
                        //if the newZoomFactor is set to higher than the max accepted
                        //it won't change, and will never alert that it's at maximum
                        newZoomFactor = newZoomFactor > ZOOM_MAX ? ZOOM_MAX : newZoomFactor;
                    } else {
                        // We must be decrementing
                        newZoomFactor -= ZOOM_INCREMENT;
                        //if the newZoomFactor is set to lower than the min accepted
                        //it won't change, and will never alert that it's at minimum
                        newZoomFactor = newZoomFactor < ZOOM_MIN ? ZOOM_MIN : newZoomFactor;
                    }
                }
                console.log( "newZoomFactor: " + newZoomFactor )
            }
        }
        console.log( "FINAL newZoomFactor: " + newZoomFactor )
        browser.tabs.setZoom( tabId, newZoomFactor );
    });
}

console.log( "background.js: adding listener for messages..." );
browser.runtime.onMessage.addListener(async ( message) => {

    console.log( "background.js: Message.command received: " + JSON.stringify( message ) );

    if ( message.command === "command-proofread" ) {

        console.log( "background.js: command-proofread received" );
        const rawText = await navigator.clipboard.readText()
        proofread( rawText );

    } else if ( message.command === "command-copy" ) {

        doTextToSpeech( "Copied" );

    } else if ( message.command === "command-open-new-tab" ) {

        console.log( "background.js: command-open-new-tab received" );
        browser.tabs.create( {url: message.url});

    } else if ( message.command === MODE_TRANSCRIPTION ) {

        console.log( "background.js: 'command-transcription' received" );
        displayRecorder( mode=MODE_TRANSCRIPTION );

    } else if ( message.command === MODE_COMMAND ) {

        console.log( `background.js: [${MODE_COMMAND}] received` );;
        displayRecorder(mode=MODE_COMMAND, prefix=STEM_MULTIMODAL_BROWSER, command="" );

    } else if ( message.command === MODE_AGENT ) {

        console.log( `background.js: [${MODE_AGENT}] received` );
        displayRecorder(mode=MODE_AGENT, prefix=STEM_MULTIMODAL_AGENT );

    } else if ( message.command === VOX_CMD_VIEW_JOB_QUEUE ) {

        displayQueue();

    } else if ( message.command === VOX_CMD_PASTE ) {

        console.log( "background.js: 'paste' transcription received" );
        sendMessageToOneContentScript( lastTabId, "command-paste" );

    } else if ( VOX_EDIT_COMMANDS.includes( message.command ) ) {

        // TODO: This is a gigantic hack that needs to be replaced with a transcription to command dictionary
        console.log( `background.js: sending [${message.command}] message to content script in tab [${lastTabId}]` )
        sendMessageToOneContentScript( lastTabId, "command-" + message.command.replaceAll( " ", "-" ) );

    } else if ( message.command === VOX_CMD_TAB_CLOSE ) {

        browser.tabs.remove( lastTabId );

    // TODO: I don't know why the old fangled equals equals (==) needs to be used here. I should be comparing string objects!
    } else if ( message.command == VOX_CMD_TAB_REFRESH ) {

        // TODO: This is a gigantic hack that needs to be replaced with a transcription to command dictionary
        await browser.tabs.sendMessage( lastTabId, {
            command: "tab-refresh"
        });
    } else if ( message.command === VOX_CMD_TAB_BACK ) {

        // TODO: This is a gigantic hack that needs to be replaced with a transcription to command dictionary
        await browser.tabs.sendMessage( lastTabId, {
            command: "tab-back"
        });
        // TODO/KLUDGE!
        loadContentScript();

    } else if ( message.command === VOX_CMD_TAB_FORWARD ) {

        // TODO: This is a gigantic hack that needs to be replaced with a transcription to command dictionary
        await browser.tabs.sendMessage( lastTabId, {
            command: "tab-forward"
        });
        // TODO/KLUDGE!
        loadContentScript();

    } else if ( message.command === VOX_CMD_OPEN_FILE ) {

        console.log( "background.js: '" + VOX_CMD_OPEN_FILE + "' received" );
        let sending = browser.runtime.sendMessage( {
            command: VOX_CMD_OPEN_FILE
        } );

    } else if ( message.command === "check-stream" ) {
        
        console.log("background.js: check-stream command received");
        const needsNew = needsNewStream();
        // Send response back to popup
        browser.runtime.sendMessage({
            command: "stream-status",
            needsNewStream: needsNew
        });
        
    } else if ( message.command === "start-recording" ) {
        
        console.log("background.js: start-recording command received");
        const result = startRecording();
        // Note: Response is sent via the MediaRecorder event handlers
        
    } else if ( message.command === "stop-recording" ) {
        
        console.log("background.js: stop-recording command received");
        const result = stopRecording();
        // Note: Response with audio data is sent via the MediaRecorder stop event
        
    } else{
        console.log( "background.js: command NOT recognized: " + message.command );
    }
} );
console.log( "background.js: adding listener for messages... Done!" );

// Test function for popup access
function foo() {
    console.log("Hello from background.js foo() method!");
    return "Background method called successfully";
}

// ============================================================================
// BACKGROUND AUDIO RECORDING MANAGEMENT
// ============================================================================
// This module manages audio recording in the persistent background context
// to optimize latency by avoiding repeated getUserMedia() calls.
//
// Architecture: Popup handles getUserMedia (user context required), background
// manages MediaRecorder and audio processing (persistent context preferred).
// ============================================================================

// Global variables for stream and recording management
let cachedMediaStream = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

/**
 * Checks if a new MediaStream is needed from the popup
 * 
 * Contract:
 * - PRECONDITION: None (can be called anytime)
 * - POSTCONDITION: Returns boolean indicating if new stream needed
 * - SIDE EFFECTS: May clear dead object references and log to console
 * - ERROR HANDLING: Catches dead object errors, assumes new stream needed
 * 
 * @returns {boolean} true if popup should acquire new MediaStream, false if cached stream is usable
 */
function needsNewStream() {
    try {
        // Check if stream exists and is active
        const needs = !cachedMediaStream || !cachedMediaStream.active;
        console.log("background.js: needsNewStream() - needs new stream:", needs);
        return needs;
    } catch (error) {
        console.log("background.js: needsNewStream() - stream access error, needs new stream:", error);
        // If we can't access the stream, we definitely need a new one
        cachedMediaStream = null;
        mediaRecorder = null;
        return true;
    }
}

/**
 * Caches a MediaStream from popup and sets up cleanup handlers
 * 
 * Contract:
 * - PRECONDITION: stream must be a valid MediaStream object
 * - POSTCONDITION: Stream is cached, track end handlers attached
 * - SIDE EFFECTS: Replaces existing cached stream, logs to console
 * - ERROR HANDLING: Gracefully handles null/undefined streams
 * 
 * @param {MediaStream} stream - Active MediaStream from popup getUserMedia()
 */
function setCachedStream(stream) {
    console.log("background.js: setCachedStream() called, caching stream");
    cachedMediaStream = stream;
    
    // Add event listener to clear cache if stream ends
    if (stream) {
        stream.getTracks().forEach(track => {
            track.addEventListener('ended', () => {
                console.log("background.js: Stream track ended, clearing cache");
                cachedMediaStream = null;
                mediaRecorder = null;
            });
        });
        console.log("background.js: Stream cached successfully");
    }
}

/**
 * Checks if background has a cached MediaStream
 * 
 * Contract:
 * - PRECONDITION: None
 * - POSTCONDITION: Returns boolean indicating cache status
 * - SIDE EFFECTS: Logs result to console
 * - ERROR HANDLING: None needed (simple boolean check)
 * 
 * @returns {boolean} true if MediaStream is cached, false otherwise
 */
function hasCachedStream() {
    const hasStream = !!cachedMediaStream;
    console.log("background.js: hasCachedStream() called, has stream:", hasStream);
    return hasStream;
}

/**
 * Starts audio recording using cached MediaStream
 * 
 * Contract:
 * - PRECONDITION: Valid MediaStream must be cached via setCachedStream()
 * - POSTCONDITION: Recording starts, MediaRecorder created with fresh event handlers
 * - SIDE EFFECTS: Creates MediaRecorder, clears audioChunks, starts recording
 * - ERROR HANDLING: Returns failure result if stream unavailable or dead
 * 
 * Performance Optimization: Creates fresh MediaRecorder instance each time
 * to avoid state conflicts and ensures clean event handler attachment.
 * 
 * @returns {Object} {success: boolean, message: string} - Operation result
 */
function startRecording() {
    try {
        if (cachedMediaStream && cachedMediaStream.active) {
            if (!mediaRecorder || mediaRecorder.state !== 'inactive') {
                console.log("background.js: Creating fresh MediaRecorder");
                // Create a fresh recorder if we've never made one, or after a stop
                mediaRecorder = new MediaRecorder(cachedMediaStream);
            
            // (Re)attach event listeners
            mediaRecorder.addEventListener("dataavailable", event => {
                console.log("background.js: Audio chunk received, size:", event.data.size);
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener("stop", async () => {
                console.log("background.js: Recording stopped, processing audio chunks");
                isRecording = false;
                
                // Create blob and convert to base64
                const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });
                const base64Audio = await blobToBase64(audioBlob);
                
                // Send result back to popup via message
                browser.runtime.sendMessage({
                    command: "recording-complete",
                    audioData: base64Audio,
                    mimeType: "audio/mpeg"
                });
                
                console.log("background.js: Audio processing complete, sent to popup");
            });
        }
        
            console.log("background.js: Starting recording");
            audioChunks = []; // Clear previous recording
            mediaRecorder.start();
            isRecording = true;
            return { success: true, message: "Recording started" };
        } else {
            console.log("background.js: Cannot start recording, no cached stream available or stream inactive");
            return { success: false, message: "No stream available or stream inactive" };
        }
    } catch (error) {
        console.log("background.js: Error in startRecording:", error);
        // Clean up dead references
        cachedMediaStream = null;
        mediaRecorder = null;
        return { success: false, message: "Stream access error: " + error.message };
    }
}

/**
 * Stops active audio recording
 * 
 * Contract:
 * - PRECONDITION: MediaRecorder must be in "recording" state
 * - POSTCONDITION: Recording stops, "stop" event triggers audio processing
 * - SIDE EFFECTS: Calls mediaRecorder.stop(), triggers async audio processing
 * - ERROR HANDLING: Returns failure if not currently recording
 * 
 * @returns {Object} {success: boolean, message: string} - Operation result
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("background.js: Stopping recording");
        mediaRecorder.stop();
        return { success: true, message: "Recording stopped" };
    } else {
        console.log("background.js: Cannot stop recording, mediaRecorder state:", mediaRecorder?.state);
        return { success: false, message: "MediaRecorder not recording" };
    }
}

/**
 * Converts audio Blob to base64 string
 * 
 * Contract:
 * - PRECONDITION: blob must be valid Blob object
 * - POSTCONDITION: Returns base64 string without data URL prefix
 * - SIDE EFFECTS: Uses FileReader, processes asynchronously
 * - ERROR HANDLING: Promise-based, caller should handle rejections
 * 
 * @param {Blob} blob - Audio blob to convert
 * @returns {Promise<string>} Base64 encoded audio data (no prefix)
 */
async function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            // Extract base64 part (remove data:audio/mpeg;base64, prefix)
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.readAsDataURL(blob);
    });
}

// Make functions available globally on the window object
window.foo = foo;
window.needsNewStream = needsNewStream;
window.setCachedStream = setCachedStream;
window.hasCachedStream = hasCachedStream;
window.startRecording = startRecording;
window.stopRecording = stopRecording;

console.log( "background.js loading... Done!" );