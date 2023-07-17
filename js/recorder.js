import {
    VOX_CMD_SEARCH_DDG,
    VOX_CMD_SEARCH_GOOGLE,
    VOX_CMD_LOAD_NEW_TAB,
    // VOX_CMD_CUT, VOX_CMD_COPY, VOX_CMD_PASTE, VOX_CMD_DELETE, VOX_CMD_SELECT_ALL,
    VOX_EDIT_COMMANDS,
    VOX_CMD_PROOFREAD,
    STEM_MULTIMODAL_EDITOR,
    MODE_COMMAND,
    MODE_TRANSCRIPTION,
    TTS_SERVER_ADDRESS,
    GIB_SERVER_ADDRESS,
    // VOX_CMD_TAB_CLOSE, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD,
    VOX_TAB_COMMANDS,
    EDITOR_URL,
    VOX_CMD_OPEN_EDITOR,
    VOX_CMD_SEARCH_CLIPBOARD_DDG,
    VOX_CMD_SEARCH_CLIPBOARD_GOOGLE,
    VOX_CMD_SEARCH_GOOGLE_SCHOLAR,
    SEARCH_URL_DDG,
    SEARCH_URL_GOOGLE,
    CONSTANTS_URL,
    SEARCH_URL_GOOGLE_SCHOLAR,
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
    VOX_CMD_OPEN_FILE
} from "/js/constants.js";
import {
    sendMessageToBackgroundScripts,
    readFromLocalStorage,
    queuePasteCommandInLocalStorage,
    queueNewTabCommandInLocalStorage,
    queueHtmlInsertInLocalStorage,
    queueCurrentTabCommandInLocalStorage
} from "/js/util.js";

console.log( "recorder.js loading..." );

let debug         = false;
var refreshWindow = false;
var mode            = "";
var currentMode     = "";
var prefix          = "";
var transcription   = "";
var titleMode       = "Transcription";
// var results         = [];

async function initializeStartupParameters() {

    console.log( "initializeStartupParameters()..." );

    currentMode   = await readFromLocalStorage( "mode", MODE_TRANSCRIPTION );
    prefix        = await readFromLocalStorage( "prefix", "" );
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
    // console.log( "window.parent.location: " + window.parent.location );
    // console.log( "window.parent.location.href: " + window.parent.location.href );

    console.log( "DOM fully loaded and parsed. Checking permissions...." );

    // Only hide if we're not in debug mode
    document.getElementById( "play" ).hidden = !debug;

    if ( currentMode === "transcription"  || transcription === "" ) { // || currentMode == "multimodal editor" ) {

        document.getElementById( "record" ).click()

        navigator.mediaDevices.getUserMedia( {audio: true, video: false})
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
      const stream = await navigator.mediaDevices.getUserMedia( { audio: true } );
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
            resolve( { audioChunks, audioBlob, audioUrl, play } );
          } );

          mediaRecorder.stop();
        } );

      resolve( { start, stop } );
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

    const promptFeedback = await getPromptFeedbackMode();

    const url = GIB_SERVER_ADDRESS + "/api/upload-and-transcribe-mp3?prompt_key=generic&prefix=" + prefix + "&prompt_feedback=" + promptFeedback;
    console.log( "Upload and transcribing to url [" + url + "]" )

    try {
        const result = await readBlobAsDataURL(audio.audioBlob)
        console.log("Mime type [" + result.split(",")[0] + "]");

        const audioMessage = result.split(",")[1];
        const mimeType = result.split(",")[0];

        document.getElementById("recorder-body").className = "thinking";

        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": mimeType},
            body: audioMessage
        });
        document.getElementById("recorder-body").className = "thinking-disabled"
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const transcriptionJson = await response.json();
        console.log( "transcriptionJson [" + JSON.stringify( transcriptionJson ) + "]..." );
        let transcription = transcriptionJson[ "transcription" ];
        let prefix        = transcriptionJson[ "prefix" ];
        let results       = transcriptionJson[ "results" ];

        if ( results[ "command" ].startsWith( "search " ) ) {

            handleSearchCommands( results );

        } else if ( results[ "command" ].startsWith( "load " ) ) {

            handleLoadCommands( results );

        // Are other commands being interpreted by AI?
        } else if ( results[ "match_type" ] == "ai_matching" ) {

            console.log( "handling AI match" )
            // For now, comma, stitch command and arguments back together and ship them off
            handleCommand( STEM_MULTIMODAL_EDITOR, results[ "command" ] + " " + results[ "args" ][ 0 ] );

        } else if ( prefix.startsWith( STEM_MULTIMODAL_EDITOR ) || transcription.startsWith( STEM_MULTIMODAL_EDITOR ) ) {

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

        } else if ( prefix.startsWith( STEM_MULTIMODAL_EDITOR + " " + VOX_CMD_RUN_PROMPT ) || transcriptionJson[ "mode" ].startsWith( VOX_CMD_RUN_PROMPT ) ) {

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
    } catch ( e ) {
        console.log( "Error processing audio file [" + e.stack + "]" );
        console.trace() ;
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

    // let idx = 1;
    // let urlChunks = "<ul>";
    // for ( const result of results ){
    //     let urlChunk = `<li>${idx}) <a href="${result[ 'href' ]}">${result[ 'title' ]}</a></li>`;
    //     console.log( "urlChunk [" + urlChunk + "]" );
    //     urlChunks += urlChunk;
    //     idx++;
    // }
    // urlChunks += "</ul>";
    //
    // // console.log( "urlTags [" + urlChunks + "]" );
    // // const writeCmd = await navigator.clipboard.writeText( urlChunks )
    // queueHtmlInsertInLocalStorage( urlChunks );

    console.log( "Done!" );
    closeWindow();
}

async function handleSearchCommands( resultsJson ) {

    console.log( "handleSearchCommands( resultsJson ) called..." );

    const command = resultsJson[ "command" ];

    const isGoogle     = command.includes( " google" );
    const isScholar    = command.includes( " scholar" );
    const isNewTab     = command.includes( " new tab" );
    const useClipboard = command.includes( " clipboard" );
    const isDuckDuckGo = !isGoogle;
    const isCurrentTab = !isNewTab;

    // get search terms
    let args = resultsJson[ "args" ];
    if ( useClipboard ) {
        args[ 0 ] = await navigator.clipboard.readText();
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
    }
    if ( isCurrentTab ) {
        queueCurrentTabCommandInLocalStorage( url, "&q=" + args[ 0 ] )
    } else {
        queueNewTabCommandInLocalStorage( url, "&q=" + args[ 0 ] )
    }
    closeWindow();
}

async function handleLoadCommands( results ) {

    console.log( "handleLoadCommands( resultsJson ) called... " + JSON.stringify( results ) );

    const command = results[ "command" ];
    console.log( "command [" + command + "]" );

    let url = "https://" + results[ "args" ][ 0 ]
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
        await closeWindow();

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

async function closeWindow(timeout = 250) {
    await window.setTimeout(() => {
        window.close();
    }, 250);
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

// function reportExecuteScriptError( error) {
//     console.error( `Failed to execute content script: ${error.message}` );
// }
console.log( "recorder.js loaded" );
