import {
    CMD_SEARCH_DDG,
    CMD_SEARCH_GOOGLE,
    CMD_OPEN_NEW_TAB,
    CMD_CUT,
    CMD_COPY,
    CMD_PASTE,
    CMD_DELETE,
    CMD_SELECT_ALL,
    EDIT_COMMANDS,
    MULTIMODAL_EDITOR,
    COMMAND_MODE,
    TRANSCRIPTION_MODE,
    TTS_SERVER,
    GIB_SERVER
} from "/js/constants.js";
import {
    updateLocalStorageLastPaste,
    readLocalStorage,
    sendMessageToBackgroundScripts
} from "/js/util.js";

console.log( "recorder.js loading..." );

let debug               = false;
var refreshWindow       = false;
var mode                = "";
var currentMode         = "";
var prefix              = "";
var transcription       = "";
var titleMode           = "Transcription";

async function initializeStartupParameters() {

    console.log( "initializeStartupParameters()..." );
    
    currentMode   = await readLocalStorage( "mode", TRANSCRIPTION_MODE );
    prefix        = await readLocalStorage( "prefix", "" );
    // TODO: Command should be renamed transcription!
    transcription = await readLocalStorage( "command", "" );
    debug         = await readLocalStorage( "debug", false );
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
        "command": transcription,
          "debug": debug
    } );
    console.log( "updateLastKnownRecorderState()... Done!" );
}
function updateLocalStorageLastUrl( url ) {

    console.log( "updateLocalStorageLastUrl()..." + url  );
    browser.storage.local.set( {
        "lastUrl": url
    } );
    return true;
}
function updateLocalStorageLastZoom( value ) {

    console.log( "updateLocalStorageLastZoom()... " + value );
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

    // parent.postMessage( { "type": "recorder", "mode": currentMode, "prefix": prefix, "transcription": transcription, "debug": debug }, "*" );
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

    if ( currentMode == COMMAND_MODE ) {
        mode = TRANSCRIPTION_MODE;
        modeImage.src = "../icons/mode-transcription-24.png";
        modeImage.title = "Mode: " + TRANSCRIPTION_MODE[ 0 ].toUpperCase() + TRANSCRIPTION_MODE.slice( 1 );
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

    const url = GIB_SERVER + "/api/upload-and-transcribe-mp3?prefix=" + prefix;
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
        console.log( "transcriptionJson [" + JSON.stringify( transcriptionJson ) + "]..." );
        let transcription = transcriptionJson[ "transcription" ]
        let prefix        = transcriptionJson[ "prefix" ]

        // are we in command mode?
        if ( prefix.startsWith( MULTIMODAL_EDITOR) || transcription.startsWith( MULTIMODAL_EDITOR ) ) {

            handleCommand( prefix, transcription );

        } else {
            console.log( "Pushing 'transcription' part of this response object to clipboard [" + JSON.stringify( transcriptionJson ) + "]..." );
            console.log( "transcription [" + transcriptionJson[ "transcription" ] + "]" );

            updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

            const writeCmd = navigator.clipboard.writeText( transcription )
            updateLocalStorageLastPaste( Date.now() );

            if ( debug ) { console.log( "Success!" ); }
            window.setTimeout( () => {
                window.close();
            }, 250 );
        }
    } catch (e) {
        console.log( "Error reading audio file [" + e + "]" );
    }
} );

async function handleCommand( prefix, transcription ) {

    console.log( "handleCommands( transcription ) called with prefix [" + prefix + "] transcription [" + transcription + "]" );

    if ( ( prefix == MULTIMODAL_EDITOR && ( transcription === "mode" || transcription === "help" )  ) ||
         ( prefix == "" && transcription === MULTIMODAL_EDITOR ) ) {

        // Remove whatever commands were sent.
        transcription = "";
        prefix        = MULTIMODAL_EDITOR;
        currentMode   = COMMAND_MODE;
        document.getElementById( "stop" ).className = "disabled";

        const modeImg     = document.getElementById( "mode-img" )
        modeImg.title     = "Mode: Command";
        modeImg.src       = "../icons/mode-command-24.png";
        // modeImg.className = "image-strober";

        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );
        doTextToSpeech( "Command", closeWindow=false, refreshWindow=true );

    } else if ( transcription.startsWith( "proof" ) ) {

        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );
        proofreadFromClipboard();

    } else if ( transcription === "toggle" || transcription === "reset" || transcription === TRANSCRIPTION_MODE || transcription === "exit" ) {

        currentMode   = TRANSCRIPTION_MODE;
               prefix = "";
        transcription = "";
        updateLastKnownRecorderState( currentMode, prefix, transcription, debug );

        await doTextToSpeech( "Switching to " + currentMode + " mode", closeWindow = false, refreshWindow = true);

    } else if ( transcription == CMD_OPEN_NEW_TAB || transcription == CMD_SEARCH_GOOGLE || transcription == CMD_SEARCH_DDG ) {

        // Push transcription into the prefix so that we can capture where we want to go/do in the next conditional blocks below.
        prefix = prefix + " " + transcription;
        transcription = "";

        // await doTextToSpeech( "Url or search terms", closeWindow=false, refreshWindow=false );

        console.log(transcription)
        console.log("We know what you want (a new tab/search), but we don't know where you want to go or what you want to search.")
        updateLastKnownRecorderState(currentMode, prefix, transcription, debug);
        window.location.reload();

    } else if ( EDIT_COMMANDS.includes( transcription ) ) {

        console.log( "Editing command found: " + transcription );
        sendMessageToBackgroundScripts( transcription );
        closeWindow();

    } else if ( transcription.startsWith( CMD_OPEN_NEW_TAB ) || prefix === MULTIMODAL_EDITOR + " " + CMD_OPEN_NEW_TAB ) {

        let url = "";
        if ( prefix === MULTIMODAL_EDITOR + " " + CMD_OPEN_NEW_TAB ) {
            url = "https://" + transcription + "?ts=" + Date.now();
        } else {
            url = "https://" + transcription.replace( CMD_OPEN_NEW_TAB, "" ).trim() + "?ts=" + Date.now();
        }

        console.log( "Updating lastUrl to [" + url + "]" );
        updateLocalStorageLastUrl( url );
        closeWindow();

    } else if ( transcription.startsWith( CMD_SEARCH_GOOGLE ) || prefix === MULTIMODAL_EDITOR + " " + CMD_SEARCH_GOOGLE ) {

        let searchTerms = "";

        if ( prefix === MULTIMODAL_EDITOR + " " + CMD_SEARCH_GOOGLE ) {
            searchTerms = transcription;
        } else {
            searchTerms = transcription.replace( CMD_SEARCH_GOOGLE, "" ).trim()
        }
        const url = "https://www.google.com/search?q=" + searchTerms + "&ts=" + Date.now();

        console.log( "Updating lastUrl to [" + url + "]" );
        updateLocalStorageLastUrl( url )
        closeWindow();

    } else if ( transcription.startsWith( CMD_SEARCH_DDG ) || prefix === MULTIMODAL_EDITOR + " " + CMD_SEARCH_DDG ) {

        let searchTerms = "";

        if ( prefix === MULTIMODAL_EDITOR + " " + CMD_SEARCH_DDG ) {
            searchTerms = transcription;
        } else {
            searchTerms = transcription.replace( CMD_SEARCH_DDG, "" ).trim()
        }
        const url = "https://www.duckduckgo.com/?q=" + searchTerms + "&ts=" + Date.now();

        console.log( "Updating lastUrl to [" + url + "]" );
        updateLocalStorageLastUrl( url )
        closeWindow();

    } else if ( transcription.startsWith( "zoom reset" ) || transcription.startsWith( MULTIMODAL_EDITOR + " zoom reset" ) ) {

        console.log( "Zoom reset..." );
        updateLocalStorageLastZoom( "0?ts=" + Date.now() );
        closeWindow();

    } else if ( transcription.startsWith( "zoom out" ) || transcription.startsWith( MULTIMODAL_EDITOR + " zoom out" ) ) {

        console.log( "Zooming out..." );
        let zoomCount = ( transcription.split( "zoom out" ).length - 1 ) * -1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount + "?ts=" + Date.now() );
        closeWindow();

    } else if ( transcription.startsWith( "zoom" ) || transcription.startsWith( MULTIMODAL_EDITOR + " zoom" ) ) {

        console.log( "Zooming in..." );
        let zoomCount = transcription.split( "zoom" ).length - 1;
        console.log( "zoom [" + zoomCount + "]" );
        updateLocalStorageLastZoom( zoomCount + "?ts=" + Date.now() );
        closeWindow();

    } else {
        console.log( "Unknown command [" + transcription + "]" );
        await doTextToSpeech( "Unknown command " + transcription + ", please try again", closeWindow=false, refreshWindow=true );
    }
}
async function proofreadFromClipboard() {

    try {

        doTextToSpeech( "Proofreading...", closeWindow=false, refreshWindow=false )

        const rawText = await navigator.clipboard.readText()
        console.log( "rawText [" + rawText + "]" );

        let url = GIB_SERVER + "/api/proofread?question=" + rawText
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

        doTextToSpeech( "Done!", closeWindow=true, refreshWindow=false );

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

async function doTextToSpeech( text, closeWindow=true, refreshWindow=false ) {

    console.log( "doTextToSpeech() called..." )

    let url = TTS_SERVER + "/api/tts?text=" + text
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

// let pushToClipboardAndClose = ( text ) => {
//
//     console.log( "pushToClipboard( text ) [" + text + "]" );
//     navigator.clipboard.writeText( text ).then(() => {
//         console.log( "Success! updating last paste..." );
//         updateLocalStorageLastPaste( Date.now() );
//     }, () => {
//         console.log( "Failed to write to clipboard!" );
//     }).then( () => {
//         window.setTimeout( () => {
//             window.close();
//         }, 250 );
//     } );
// }

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
