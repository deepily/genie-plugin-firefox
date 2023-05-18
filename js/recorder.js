import {
    VOX_CMD_SEARCH_DDG,
    VOX_CMD_SEARCH_GOOGLE,
    VOX_CMD_OPEN_NEW_TAB,
    // VOX_CMD_CUT, VOX_CMD_COPY, VOX_CMD_PASTE, VOX_CMD_DELETE, VOX_CMD_SELECT_ALL,
    VOX_EDIT_COMMANDS,
    VOX_CMD_PROOFREAD,
    STEM_MULTIMODAL_EDITOR,
    MODE_COMMAND, MODE_TRANSCRIPTION,
    TTS_SERVER_ADDRESS, GIB_SERVER_ADDRESS,
    // VOX_CMD_TAB_CLOSE, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD,
    VOX_TAB_COMMANDS,
    EDITOR_URL,
    VOX_CMD_OPEN_EDITOR,
    VOX_CMD_SEARCH_CLIPBOARD_DDG, VOX_CMD_SEARCH_CLIPBOARD_GOOGLE, VOX_CMD_SEARCH_GOOGLE_SCHOLAR,
    SEARCH_URL_DDG, SEARCH_URL_GOOGLE, CONSTANTS_URL, SEARCH_URL_GOOGLE_SCHOLAR,
    STEM_MULTIMODAL_AI_FETCH,
    VOX_CMD_VIEW_CONSTANTS,
    VOX_CMD_PROOFREAD_STEM,
    VOX_CMD_MODE_RESET, VOX_CMD_MODE_EXIT,
    VOX_CMD_ZOOM_RESET, VOX_CMD_ZOOM_OUT, VOX_CMD_ZOOM_IN,
    VOX_CMD_OPEN_URL_BUCKET, BUCKET_URL,
    VOX_CMD_SET_LINK_MODE, LINK_MODE_DRILL_DOWN, LINK_MODE_NEW_TAB,
    VOX_CMD_SET_PROMPT_MODE, PROMPT_MODE_VERBOSE, PROMPT_MODE_QUIET, PROMPT_MODE_DEFAULT, STEM_MULTIMODAL_RUN_PROMPT
} from "/js/constants.js";
import {
    sendMessageToBackgroundScripts,
    readFromLocalStorage,
    queuePasteCommandInLocalStorage,
    queueNewTabCommandInLocalStorage, queueHtmlInsertInLocalStorage
} from "/js/util.js";

console.log( "recorder.js loading..." );

let debug         = false;
var refreshWindow = false;
var mode          = "";
var currentMode   = "";
var prefix        = "";
var transcription = "";
var results        = [];
var titleMode     = "Transcription";

async function initializeStartupParameters() {

    console.log( "initializeStartupParameters()..." );
    
    currentMode   = await readFromLocalStorage( "mode", MODE_TRANSCRIPTION );
    prefix        = await readFromLocalStorage( "prefix", "" );
    // TODO: Command should be renamed transcription!
    transcription = await readFromLocalStorage( "transcription", "" );
    debug         = await readFromLocalStorage( "debug", false );
    titleMode     = currentMode[ 0 ].toUpperCase() + currentMode.slice( 1 );

    dumpStartupParameters();
}
async function dumpStartupParameters() {

    console.log( "  currentMode [" + currentMode + "]" );
    console.log( "       prefix [" + prefix + "]" );
    console.log( "transcription [" + transcription + "]" );
    console.log( "        debug [" + debug + "]" );
}
function updateLastKnownRecorderState( currentMode, prefix, transcription, debug ) {

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

   console.log( "DOM fully loaded and parsed, Getting startup parameters...." );
    await initializeStartupParameters();

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
    console.log( "window.parent.location: " + window.parent.location );
    console.log( "window.parent.location.href: " + window.parent.location.href );

    console.log( "DOM fully loaded and parsed. Checking permissions...." );

    // Only hide if we're not in debug mode
    document.getElementById( "play" ).hidden = !debug;

    if ( currentMode === "transcription"  || transcription === "" ) { // || currentMode == "multimodal editor" ) {

        document.getElementById( "record" ).click()

        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then((stream) => {
                    console.log( "Microphone available" )
                },
                e => {
                    console.log( "Microphone NOT available" )
                } );
    } else {
        // Skip recording mode and jump right into handling commands.
        document.getElementById( "stop" ).focus();
        document.getElementById( "recorder-body" ).className = "thinking";
        handleCommand( prefix, transcription )
    }
    console.log( "DOM fully loaded and parsed. Checking permissions.... Done!" );
} );
window.addEventListener( "keydown", function (event) {

    console.log( "event [" + event + "]" );
    console.log( "event.key [" + event.key + "]" );
    if ( event.key == "Escape" ) {
        console.log( "Escape pressed" );
        window.setTimeout( () => {
            window.close();
        }, 250 );
    }
} );

const recordAudio = () =>
    new Promise(async resolve => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true } );
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

      mediaRecorder.addEventListener( "dataavailable", event => {
        audioChunks.push(event.data);
      } );

      const start = () => {
        audioChunks = [];
        mediaRecorder.start();
        document.getElementById( "record" ).hidden = true;
        const btnStop = document.getElementById( "stop" );
        btnStop.focus();
        btnStop.className = "";
      };

      const stop = () =>
        new Promise(resolve => {
          mediaRecorder.addEventListener( "stop", () => {
            document.getElementById( "stop" ).className = "disabled";
            document.getElementById( "save" ).className = "";
            const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" } );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            const play = () => audio.play();
            resolve({ audioChunks, audioBlob, audioUrl, play } );
          } );

          mediaRecorder.stop();
        } );

      resolve({ start, stop } );
    } );

// const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const recordButton = document.querySelector( "#record" );
const stopButton   = document.querySelector( "#stop" );
const playButton   = document.querySelector( "#play" );
const saveButton   = document.querySelector( "#save" );
const modeImage    = document.querySelector( "#mode-img" );

let recorder;
let audio;

modeImage.addEventListener( "click", async () => {

    if ( currentMode == MODE_COMMAND ) {
        mode = MODE_TRANSCRIPTION;
        modeImage.src = "../icons/mode-transcription-24.png";
        modeImage.title = "Mode: " + MODE_TRANSCRIPTION[ 0 ].toUpperCase() + MODE_TRANSCRIPTION.slice( 1 );
        transcription = "exit";
        handleCommand( prefix, transcription )
    }
} );
recordButton.addEventListener( "click", async () => {

    recordButton.setAttribute( "disabled", true);
    stopButton.removeAttribute( "disabled" );
    stopButton.focus();
    playButton.setAttribute( "disabled", true);
    saveButton.setAttribute( "disabled", true);
    if (!recorder) {
      recorder = await recordAudio();
    }
    recorder.start();
} );

stopButton.addEventListener( "click", async () => {

    document.body.className = "recording-disabled";
    recordButton.removeAttribute( "disabled" );
    stopButton.setAttribute( "disabled", true);
    playButton.removeAttribute( "disabled" );
    saveButton.removeAttribute( "disabled" );
    saveButton.focus();
    audio = await recorder.stop();
} );

playButton.addEventListener( "click", () => {
    audio.play();
} );

saveButton.addEventListener( "click", async () => {

    const promptVerbose = await browser.storage.local.get( "promptMode" ).then( ( result ) => {
        return result.promptMode;
    } );
    // const promptVerbose = await readFromLocalStorageWithDefault( "promptMode", "verbose" )

    const url = GIB_SERVER_ADDRESS + "/api/upload-and-transcribe-mp3?prompt_key=generic&prefix=" + prefix + "&prompt_feedback=" + promptVerbose;
    console.log( "Attempting to upload and transcribe to url [" + url + "]" )

    try {
        const result = await readBlobAsDataURL( audio.audioBlob )
        console.log( "result [" + typeof result + "]" );
        console.log( "result.split( "," )[0] [" + result.split( "," )[0] + "]" );

        const audioMessage = result.split( "," )[1];
        const mimeType = result.split( "," )[0];

        document.getElementById( "recorder-body" ).className = "thinking";

        const response = await fetch( url, {
            method: "POST",
            headers: {"Content-Type": mimeType},
            body: audioMessage
        } );
        document.getElementById( "recorder-body" ).className = "thinking-disabled"
        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const transcriptionJson = await response.json();
        // console.log( "transcriptionJson [" + JSON.stringify( transcriptionJson ) + "]..." );
        let transcription = transcriptionJson[ "transcription" ];
        let prefix        = transcriptionJson[ "prefix" ];
        let results       = transcriptionJson[ "results" ];

        // are we in command mode?
        if ( prefix.startsWith( STEM_MULTIMODAL_EDITOR ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR ) ) {

            handleCommand( prefix, transcription );

        } else if ( prefix.startsWith( STEM_MULTIMODAL_EDITOR ) || transcriptionJson[ "mode" ].startsWith( STEM_MULTIMODAL_AI_FETCH ) ) {

            handleAiFetch( results );

        } else if ( prefix.startsWith( STEM_MULTIMODAL_RUN_PROMPT ) || transcriptionJson[ "mode" ].startsWith( STEM_MULTIMODAL_RUN_PROMPT ) ) {


        } else {

            // console.log( "Pushing 'transcription' part of this response object to clipboard [" + JSON.stringify( transcriptionJson ) + "]..." );
            console.log( "Pushing 'transcription' to clipboard [" + transcriptionJson[ "transcription" ] + "]" );

            updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

            const writeCmd = await navigator.clipboard.writeText( transcription )
            queuePasteCommandInLocalStorage( Date.now() );

            if ( debug ) { console.log( "Success!" ); }
            closeWindow();
        }
    } catch ( e ) {
        console.log( "Error processing audio file [" + e.stack + "]" );
    }
} );

function handleAiFetch( results ) {

    console.log( "Processing multimodal AI fetch results..." )

    let idx = 1;
    let urlChunks = "<ul>";
    for ( const result of results ){
        let urlChunk = `<li>${idx}) <a href="${result[ 'href' ]}">${result[ 'title' ]}</a></li>`;
        console.log( "urlChunk [" + urlChunk + "]" );
        urlChunks += urlChunk;
        idx++;
    }
    urlChunks += "</ul>";

    console.log( "urlTags [" + urlChunks + "]" );
    // const writeCmd = await navigator.clipboard.writeText( urlChunks )
    queueHtmlInsertInLocalStorage( urlChunks );

    console.log( "Done!" );
    closeWindow();
}

async function handleCommand( prefix, transcription ) {

    console.log( "handleCommands( transcription ) called with prefix [" + prefix + "] transcription [" + transcription + "]" );

    if ( ( prefix == STEM_MULTIMODAL_EDITOR && ( transcription === "mode" || transcription === "help" )  ) ||
         ( prefix == "" && transcription === STEM_MULTIMODAL_EDITOR ) ) {

        // Remove whatever commands were sent.
        transcription = "";
        prefix        = STEM_MULTIMODAL_EDITOR;
        currentMode   = MODE_COMMAND;
        document.getElementById( "stop" ).className = "disabled";

        const modeImg = document.getElementById( "mode-img" )
        modeImg.title = "Mode: Command";
        modeImg.src   = "../icons/mode-command-24.png";

        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );
        window.location.reload();

    } else if ( transcription.startsWith( VOX_CMD_PROOFREAD_STEM ) || transcription == VOX_CMD_PROOFREAD ) {

        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        await proofreadFromClipboard();
        // closeWindow(); // Why does this not work?
        window.close();

    } else if ( VOX_TAB_COMMANDS.includes( transcription ) ) {

        console.log( "Editing command found: " + transcription );
        sendMessageToBackgroundScripts( transcription );
        closeWindow();

    // } else if ( transcription == VOX_CMD_TAB_BACK ) {
    //
    //     // This fails: ncaught (in promise) Error: Incorrect argument types for tabs.sendMessage
    //     // let tabId = readFromLocalStorage( "lastTabId", "-1" );
    //     // browser.tabs.sendMessage( tabId, {
    //     //     command: "tab-back"
    //     // } );
    //     sendMessageToBackgroundScripts( transcription );
    //     closeWindow();
    } else if ( transcription === VOX_CMD_OPEN_EDITOR ) {

        queueNewTabCommandInLocalStorage(EDITOR_URL)
        closeWindow();

    } else if ( transcription === VOX_CMD_OPEN_URL_BUCKET ) {

        queueNewTabCommandInLocalStorage( BUCKET_URL )
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_SET_LINK_MODE ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SET_LINK_MODE ) ) {

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
        closeWindow( 1000 );

    } else if ( transcription.startsWith( VOX_CMD_SET_PROMPT_MODE ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SET_PROMPT_MODE ) ) {

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
        closeWindow( 1000 );

    } else if ( transcription === VOX_CMD_MODE_RESET || transcription === VOX_CMD_MODE_EXIT || transcription === MODE_TRANSCRIPTION  ) {

        currentMode   = MODE_TRANSCRIPTION;
               prefix = "";
        transcription = "";
        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

        await doTextToSpeech( "Switching to " + currentMode + " mode", refreshWindow=true);

    } else if ( transcription == VOX_CMD_OPEN_NEW_TAB || transcription == VOX_CMD_SEARCH_GOOGLE || transcription == VOX_CMD_SEARCH_DDG ) {

        // Push transcription into the prefix so that we can capture where we want to go/do in the next conditional blocks below.
        prefix = prefix + " " + transcription;
        transcription = "";

        console.log(transcription)
        console.log("We know what you want (a new tab/search), but we don't know where you want to go or what you want to search.")
        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        window.location.reload();

    } else if ( transcription.startsWith( VOX_CMD_VIEW_CONSTANTS ) ) {

        queueNewTabCommandInLocalStorage( CONSTANTS_URL )
        closeWindow();

    } else if ( transcription === VOX_CMD_SEARCH_CLIPBOARD_DDG ) {

        const clipboardText = await navigator.clipboard.readText()
        queueNewTabCommandInLocalStorage( SEARCH_URL_DDG, "&q=" + clipboardText )
        closeWindow();

    } else if ( transcription === VOX_CMD_SEARCH_CLIPBOARD_GOOGLE ) {

        const clipboardText = await navigator.clipboard.readText()
        queueNewTabCommandInLocalStorage( SEARCH_URL_GOOGLE, "&q=" + clipboardText )
        closeWindow();

    } else if ( VOX_EDIT_COMMANDS.includes( transcription ) ) {

        console.log( "Editing command found: " + transcription );
        sendMessageToBackgroundScripts( transcription );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_OPEN_NEW_TAB ) || prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_OPEN_NEW_TAB ) {

        let url = "";
        if ( prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_OPEN_NEW_TAB ) {
            url = "https://" + transcription
        } else {
            url = "https://" + transcription.replace( VOX_CMD_OPEN_NEW_TAB, "" ).trim()
        }

        console.log( "Updating lastUrl to [" + url + "]" );
        queueNewTabCommandInLocalStorage( url );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_SEARCH_GOOGLE_SCHOLAR ) || prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_GOOGLE_SCHOLAR ) {

        let searchTerms = "";

        if ( prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_GOOGLE_SCHOLAR ) {
            searchTerms = transcription;
        } else {
            searchTerms = transcription.replace( VOX_CMD_SEARCH_GOOGLE_SCHOLAR, "" ).trim()
        }
        // TODO/KLUDGE: Replace "this information" with "disinformation"
        searchTerms = searchTerms.replace( "this information", "disinformation" )
        queueNewTabCommandInLocalStorage( SEARCH_URL_GOOGLE_SCHOLAR, "&q=" + searchTerms )
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_SEARCH_GOOGLE ) || prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_GOOGLE ) {

        let searchTerms = "";

        if ( prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_GOOGLE ) {
            searchTerms = transcription;
        } else {
            searchTerms = transcription.replace( VOX_CMD_SEARCH_GOOGLE, "" ).trim()
        }
        queueNewTabCommandInLocalStorage( SEARCH_URL_GOOGLE, "&q=" + searchTerms )
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_SEARCH_DDG ) || prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_DDG ) {

        let searchTerms = "";

        if ( prefix === STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_SEARCH_DDG ) {
            searchTerms = transcription;
        } else {
            searchTerms = transcription.replace( VOX_CMD_SEARCH_DDG, "" ).trim()
        }
        const url = "https://www.duckduckgo.com/";

        console.log( "Updating lastUrl to [" + url + "]" );
        queueNewTabCommandInLocalStorage( url, "&q=" + searchTerms )
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_RESET ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_ZOOM_RESET ) ) {

        console.log( "Zoom reset..." );
        updateLocalStorageLastZoom( 0 );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_OUT ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_ZOOM_OUT ) ) {

        console.log( "Zooming out..." );
        let zoomCount = ( transcription.split( "zoom out" ).length - 1 ) * -1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount );
        closeWindow();

    } else if ( transcription.startsWith( VOX_CMD_ZOOM_IN ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_ZOOM_IN ) ) {

        console.log( "Zooming in..." );
        let zoomCount = transcription.split( "zoom" ).length - 1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount );
        closeWindow();

    } else {
        console.log( "Unknown command [" + transcription + "]" );
        await doTextToSpeech( "Unknown command " + transcription, refreshWindow=true );
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

        if (!response.ok) {
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

function closeWindow( timeout=250 ) {
    window.setTimeout( () => {
        window.close();
    }, 250 );
}

async function readBlobAsDataURL( file ) {

    // From: https://errorsandanswers.com/read-a-file-synchronously-in-javascript/
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = (e) => resolve(fileReader.result);
        fileReader.readAsDataURL( file );
    } );
    console.log(result_base64.split( "," )[ 0 ]);

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
                window.location.reload();
            }
        } );
        resolve( true );
    } );
    console.log( "audioResult [" + audioResult + "]" );

    console.log( "doTextToSpeech() called... done!" )
}

function reportExecuteScriptError( error) {
    console.error( `Failed to execute content script: ${error.message}` );
}

// async function sendMessage( command, url="" ) {
//
//     await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
//         let tab = tabs[0];
//         await browser.tabs.sendMessage( tab.id, {
//             command: command,
//                 url: url
//         } );
//         return true;
//     } );
// }
console.log( "recorder.js loaded" );
