// import "genie-utils.js"

const ttsServer = "http://127.0.0.1:5002";
const genieInTheBoxServer = "http://127.0.0.1:7999";

// capture key events
document.addEventListener("keypress", (event) => {

    console.log( "key pressed: " + event.key );

    // if (event.key === "ArrowDown") {
    //
    //     console.log("ArrowDown")
    //     currentFocus = document.activeElement;
    //     for ( button in buttons ) {
    //         if ( button === currentFocus ) {
    //             console.log( "button has focus: " + button )
    //             break;
    //         }
    //     }
    // } else if (event.key === "ArrowUp") {
    //     console.log("ArrowUp")
    // }
} );


document.addEventListener("click", (e) => {

    console.log( "click detected: " + e.target.id );

    if ( e.target.id === "transcribe") {

        popupRecorder("transcription");

    } else if ( e.target.id === "command-mode" ) {

        popupRecorder("multimodal editor" );

    } else if ( e.target.id === "command-proofread" ) {

        popupRecorder("multimodal editor proofread");

    } else if ( e.target.id === "command-whats-this" ) {

        fetchWhatsThisMean();

    } else if ( e.target.id === "command-paste" ) {

        browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
        let tab = tabs[0];
        browser.tabs.sendMessage( tab.id, {
            command: e.target.id
        });
    });
    } else {
        console.log( "Unknown button clicked: " + e.target.id );
    }
    // browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
    //     let tab = tabs[0];
    //     browser.tabs.sendMessage( tab.id, {
    //         command: e.target.id
    //     });
    // });
} );
function popupRecorder( mode ) {
    let createData = {
        url: "../html/recorder.html?mode=" + mode,
        type: "popup",
        height: 15, // Browser will force this to be a certain Minimum height
        width: 280
    };
    let creating = browser.windows.create(createData);
}
// function listenForClicks() {
//
//     document.addEventListener("click", (e) => {
//         console.log( "click detected: " + e.target.id );
//
//         browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
//             let tab = tabs[0];
//             browser.tabs.sendMessage( tab.id, {
//                 command: e.target.id
//             });
//         });
//     } )
// }
// browser.tabs.executeScript({file: "../js/content.js"})
// .then( () => { console.log( "Script loaded..." ) } )
// .catch(reportExecuteScriptError);
//
// function reportExecuteScriptError(error) {
//     console.error(`Failed to execute content script: ${error.message}`);
// }

fetchWhatsThisMean = async () => {

    console.log("fetchWhatsThisMean() called...")

    const clipboardText = await navigator.clipboard.readText();

    let url = genieInTheBoxServer + "/api/ask-ai-text?question=" + clipboardText
    const encodedUrl = encodeURI(url);
    console.log("encoded: " + encodedUrl);

    await fetch(url, {
        method: 'GET',
        headers: {'Access-Control-Allow-Origin': '*'}
    }).then( async (response) => {
        console.log("response.status: " + response.status);
        if ( response.status !== 200) {
            return Promise.reject("Server error: " + response.status);
        } else {
            await response.text().then( async respText => {
                console.log("respText: " + respText);
                await doTextToSpeech( respText )
            })
        }
    })
}

doTextToSpeech = async (text) => {

    console.log("doTextToSpeech() called...")

    let url = ttsServer + "/api/tts?text=" + text
    const encodedUrl = encodeURI(url);
    console.log("encoded: " + encodedUrl);

    const audio = new Audio(encodedUrl);
    await audio.play();

    console.log("doTextToSpeech() called... done!")
}