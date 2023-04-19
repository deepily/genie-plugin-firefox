// import "genie-utils.js"

const ttsServer = "http://127.0.0.1:5002";
const genieInTheBoxServer = "http://127.0.0.1:7999";

let titleMode = "Transcription"

// Set focus after the DOM is loaded.
window.addEventListener( "DOMContentLoaded", (event) => {

    console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );

    document.getElementById( "transcription" ).focus();

    console.log( "Loading content script..." );
    browser.tabs.executeScript( {file: "../js/content.js" } )
    .then( () => { console.log( "Loading content script... done!" ) } )
    .catch(reportExecuteScriptError);

    document.addEventListener( "keypress", (event) => {

        console.log( "key pressed: " + event.key );

        if (event.key === "ArrowDown" ) {

            console.log( "ArrowDown" )
            // currentFocus = document.activeElement;
            // for ( button in buttons ) {
            //     if ( button === currentFocus ) {
            //         console.log( "button has focus: " + button )
            //         break;
            //     }
            // }
        } else if (event.key === "ArrowUp" ) {
            console.log( "ArrowUp" )
        }
    } );
} );

function reportExecuteScriptError( error) {
    console.error(`Failed to execute content script: ${error.message}`);
}
// capture key events

async function sendMessage( command ) {

    await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        let tab = tabs[0];
        await browser.tabs.sendMessage( tab.id, {
            command: command
        } );
        return true;
    } );
}
document.addEventListener( "click", async (e) => {

    console.log( "click detected: " + e.target.id);
    // e.preventDefault()

    if ( e.target.id === "transcription" ) {

        // await doTextToSpeech( "Transcription mode" )
        popupRecorder( mode="transcription" );

    } else if ( e.target.id === "transcription-debug" ) {

        // await doTextToSpeech( "Debug mode" )
        popupRecorder( mode="transcription", debug=true );

    } else if ( e.target.id === "command-cut" || e.target.id === "command-copy" || e.target.id === "command-paste" || e.target.id === "command-delete" ) {

        response = await sendMessage( e.target.id )

    } else if ( e.target.id === "command-mode" ) {

        // await doTextToSpeech( "Command mode" )
        popupRecorder( mode="command", prefix="multimodal editor", command="mode" );

    } else if ( e.target.id === "command-open-new-tab" ) {

        // await doTextToSpeech( "Command mode" )
        console.log( "command-new-tab" );
        popupRecorder( mode="command", prefix="multimodal editor", command="open new tab" );
        // browser.tabs.create()
        // sendMessage( e.target.id )

    } else if ( e.target.id === "command-search-duck-duck-go" ) {

        // await doTextToSpeech( "Command mode" )
        popupRecorder( mode="command", prefix="multimodal editor", command="search duck duck go" );

    } else if ( e.target.id === "command-search-google" ) {

        // await doTextToSpeech( "Command mode" )
        popupRecorder( mode="command", prefix="multimodal editor", command="search google" );

    } else if ( e.target.id === "command-proofread" ) {

        response = await sendMessage( e.target.id )
        // popupRecorder( "multimodal editor proofread" );

    } else if ( e.target.id === "command-whats-this" ) {

        doTextToSpeech( "TODO: Implement what's this?" )
        // fetchWhatsThisMean();
        //
        // browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        //     let tab = tabs[0];
        //     browser.tabs.sendMessage(tab.id, {
        //         command: e.target.id
        //     } );
        // } );
    } else {
        console.log( "Unknown button clicked: " + e.target.id);
    }
    e.preventDefault()
} );
async function popupRecorder(mode = "transcription", prefix = "", command = "", debug = false) {

    console.log(`popupRecorder() Mode [${mode}], prefix [${prefix}], command [${command}], debug [${debug}]...`)

    const result = updateLocalStorage( mode, prefix, command, debug );
    console.log( "result: " + result );

    console.log( "popupRecorder() titleMode [" + titleMode + "]" );

    let createData = {
        url: "../html/recorder.html",
        type: "popup",
        height: 320,
        width: 256,
        allowScriptsToClose: true,
        type: "panel"
    };
    let creating = browser.windows.create(createData);
}
// TODO: Command should be renamed transcription!
async function updateLocalStorage( mode, prefix, command, debug ) {

    await browser.storage.local.set( {
           "mode": mode,
         "prefix": prefix,
        // TODO: Command should be renamed transcription!
        "command": command,
          "debug": debug
    } );
    return true;
}

// console.log( "Loading content script..." );
// browser.tabs.executeScript( {file: "../js/content.js" } )
// .then( () => { console.log( "Loading content script... done!" ) } )
// .catch(reportExecuteScriptError);
//
// function reportExecuteScriptError( error) {
//     console.error(`Failed to execute content script: ${error.message}`);
// }

fetchWhatsThisMean = async () => {

    console.log( "fetchWhatsThisMean() called..." )

    const clipboardText = await navigator.clipboard.readText();

    let url = genieInTheBoxServer + "/api/ask-ai-text?question=" + clipboardText
    const encodedUrl = encodeURI(url);
    console.log( "encoded: " + encodedUrl);

    await fetch(url, {
        method: 'GET',
        headers: {'Access-Control-Allow-Origin': '*'}
    } ).then( async (response) => {
        console.log( "response.status: " + response.status);
        if ( response.status !== 200) {
            return Promise.reject( "Server error: " + response.status);
        } else {
            await response.text().then( async respText => {
                console.log( "respText: " + respText);
                await doTextToSpeech( respText )
            } )
        }
    } )
}

doTextToSpeech = async (text) => {

    console.log( "doTextToSpeech() called..." )

    let url = ttsServer + "/api/tts?text=" + text
    const encodedUrl = encodeURI(url);
    console.log( "encoded: " + encodedUrl);

    const audio = new Audio( encodedUrl);
    await audio.play();

    console.log( "doTextToSpeech() called... done!" )
}