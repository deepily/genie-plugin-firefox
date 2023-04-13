// import "genie-utils.js"

const ttsServer = "http://127.0.0.1:5002";
const genieInTheBoxServer = "http://127.0.0.1:7999";

// Set focus after the DOM is loaded.
window.addEventListener( "DOMContentLoaded", (event) => {
    console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );
    document.getElementById( "transcription" ).focus();
} );
// capture key events
document.addEventListener( "keypress", (event) => {

    console.log( "key pressed: " + event.key );

    // if (event.key === "ArrowDown" ) {
    //
    //     console.log( "ArrowDown" )
    //     currentFocus = document.activeElement;
    //     for ( button in buttons ) {
    //         if ( button === currentFocus ) {
    //             console.log( "button has focus: " + button )
    //             break;
    //         }
    //     }
    // } else if (event.key === "ArrowUp" ) {
    //     console.log( "ArrowUp" )
    // }
} );

async function sendMessage( command ) {

    await browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
        let tab = tabs[0];
        await browser.tabs.sendMessage( tab.id, {
            command: command
        });
        return true;
    });
}
document.addEventListener( "click", async (e) => {

    console.log( "click detected: " + e.target.id);


    if ( e.target.id === "transcription" ) {

        // await doTextToSpeech( "Transcription mode" )
        popupRecorder( "" );

    } else if ( e.target.id === "transcription-debug" ) {

        // await doTextToSpeech( "Debug mode" )
        popupRecorder( "", true);

    } else if ( e.target.id === "command-cut" || e.target.id === "command-copy" || e.target.id === "command-paste" || e.target.id === "command-delete" ) {

        response = await sendMessage( e.target.id )

    } else if ( e.target.id === "command-mode" ) {

        // await doTextToSpeech( "Command mode" )
        popupRecorder( "multimodal editor" );

    } else if ( e.target.id === "command-proofread" ) {

        response = await sendMessage( e.target.id )
        // popupRecorder( "multimodal editor proofread" );

    } else if ( e.target.id === "command-whats-this" ) {

        fetchWhatsThisMean();


        browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
            let tab = tabs[0];
            browser.tabs.sendMessage(tab.id, {
                command: e.target.id
            });
        });
    } else {
        console.log( "Unknown button clicked: " + e.target.id);
    }
} );

function popupRecorder( mode, debug=false ) {

    url = ""
    if ( mode !== "" ) {
        url = "../html/recorder.html?mode=" + mode + "&debug=" + debug
    } else {
        url = "../html/recorder.html?debug=" + debug
    }

    let createData = {
        url: url,
        type: "popup",
        height: 15, // Browser will force this to be a certain Minimum height
        width: 280
    };
    let creating = browser.windows.create(createData);
}

browser.tabs.executeScript({file: "../js/content.js"})
.then( () => { console.log( "Script loaded..." ) } )
.catch(reportExecuteScriptError);

function reportExecuteScriptError( error) {
    console.error(`Failed to execute content script: ${error.message}`);
}

fetchWhatsThisMean = async () => {

    console.log( "fetchWhatsThisMean() called..." )

    const clipboardText = await navigator.clipboard.readText();

    let url = genieInTheBoxServer + "/api/ask-ai-text?question=" + clipboardText
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

doTextToSpeech = async (text) => {

    console.log( "doTextToSpeech() called..." )

    let url = ttsServer + "/api/tts?text=" + text
    const encodedUrl = encodeURI(url);
    console.log( "encoded: " + encodedUrl);

    const audio = new Audio( encodedUrl);
    await audio.play();

    console.log( "doTextToSpeech() called... done!" )
}