import {
    ZOOM_INCREMENT,
    ZOOM_MAX,
    ZOOM_MIN,
    ZOOM_DEFAULT,
    TTS_SERVER_ADDRESS,
    GIB_SERVER_ADDRESS,
    MODE_TRANSCRIPTION,
    MODE_COMMAND,
    VOX_CMD_SEARCH_DDG,
    VOX_CMD_SEARCH_GOOGLE,
    VOX_CMD_OPEN_NEW_TAB,
    STEM_MULTIMODAL_EDITOR,
    EDITOR_URL, MULTIMODAL_CONTACT_INFO, MULTIMODAL_TEXT_EMAIL, MULTIMODAL_TEXT_PYTHON
} from "/js/constants.js";

import {
    sendMessageToBackgroundScripts,
    sendMessageToContentScripts,
    callOnActiveTab,
    queueNewTabCommandInLocalStorage,
} from "/js/util.js";

let args                = "";
let command             = "";
var mode                = "";
var currentMode         = "";
var prefix              = "";
var transcription       = "";
let debug                 = false;
let titleMode             = "Transcription"
let popupRecorderWindowId = null;

// Set focus after the DOM is loaded
window.addEventListener( "DOMContentLoaded", (event) => {

    console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );

    document.addEventListener( "click", async (e) => {
        handleClickEvent( e );
    } );

    // const cmbLinkMode = document.getElementById( "link-mode" );
    // // set startup value
    // // browser.storage.local.set( { "linkMode" : cmbLinkMode.value } );
    // // Update value as it changes
    // cmbLinkMode.addEventListener( "change", async (e) => {
    //     console.log( "cmbLinkMode: " + cmbLinkMode.value )
    //     browser.storage.local.set( { "linkMode" : cmbLinkMode.value } );
    // } );

    loadContentScript();
    
} );
async function loadContentScript() {

    console.log( "Loading content script..." );
    browser.tabs.executeScript( {file: "../js/content.js" } )
    .then( () => { console.log( "Loading content script... done!" ) } )
    .catch( reportExecuteScriptError );
}
// document.addEventListener( "keypress", (event) => {
//
//     console.log( "key pressed: " + event.key );
//
//     if (event.key === "ArrowDown" ) {
//
//         console.log( "ArrowDown" )
//         // currentFocus = document.activeElement;
//         // for ( button in buttons ) {
//         //     if ( button === currentFocus ) {
//         //         console.log( "button has focus: " + button )
//         //         break;
//         //     }
//         // }
//     } else if (event.key === "ArrowUp" ) {
//         console.log( "ArrowUp" )
//     }
// } );

function reportExecuteScriptError( error) {
    console.error(`Failed to execute content script: ${error.message}`);
}
//
// replaced, I mean moved into the util module
// async function sendMessageToContentScripts( command ) {
//
//     // sends to content scripts
//     await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
//         let tab = tabs[0];
//         await browser.tabs.sendMessage( tab.id, {
//             command: command
//         } );
//         return true;
//     } );
// }

// replaced by calls to the same function within the utility module.
// async function sendMessageToBackgroundScripts( command ) {
//
//     // sends to background scripts
//     let sending = browser.runtime.sendMessage( {
//         command: command
//     } );
// }


// document.getElementById( "link-mode" ).addEventListener( "change", async (e) => {
//
//     const cmbLinkMode = document.getElementById( "link-mode" );
//     console.log( "cmbLinkMode: " + cmbLinkMode.value() )
//     // if ( cmbLinkMode.checked ) {
//     //     console.log( "Link mode: Drill Down" );
//     //     browser.storage.local.set( { "linkMode" : "drill down" } );
//     // } else {
//     //     console.log( "Link mode: Open link new tab" );
//     //     browser.storage.local.set( { "linkMode" : "new tab" } );
//     // }
//
// } );

async function handleClickEvent( e ) {

    if ( e.target.id === "editor" ) {
        console.log( "editor clicked?" );
    } else if ( e.target.id === "transcription" ) {

        popupRecorder(mode = MODE_TRANSCRIPTION);

    } else if ( e.target.id === "transcription-python" ) {

        popupRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_TEXT_PYTHON);

    } else if ( e.target.id === "transcription-email" ) {

        popupRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_TEXT_EMAIL);

    } else if ( e.target.id === "transcription-contact-information" ) {

        popupRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_CONTACT_INFO);

    } else if ( e.target.id === "transcription-debug" ) {

        popupRecorder(mode = MODE_TRANSCRIPTION, debug = true);

    } else if ( e.target.id === "command-cut" || e.target.id === "command-copy" || e.target.id === "command-paste" || e.target.id === "command-delete" || e.target.id === "command-select-all" ) {

        let response = await sendMessageToContentScripts( e.target.id)

    } else if ( e.target.id === "command-mode" ) {

        popupRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_EDITOR, command = "mode" );

    } else if ( e.target.id === "command-open-new-tab" ) {

        console.log( "command-new-tab" );
        popupRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_EDITOR, command = VOX_CMD_OPEN_NEW_TAB);

    } else if ( e.target.id === "command-search-duck-duck-go" ) {

        popupRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_EDITOR, command = VOX_CMD_SEARCH_DDG);

    } else if ( e.target.id === "command-search-google" ) {

        popupRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_EDITOR, command = VOX_CMD_SEARCH_GOOGLE);

    } else if ( e.target.id === "command-search-duck-duck-go-clipboard" ) {

        const clipboardText = await navigator.clipboard.readText()
        let url = "https://www.duckduckgo.com/";
        queueNewTabCommandInLocalStorage(url, args = "&q=" + clipboardText);

    } else if ( e.target.id === "command-search-google-clipboard" ) {

        const clipboardText = await navigator.clipboard.readText()
        let url = "https://www.google.com/search";
        queueNewTabCommandInLocalStorage(url, args = "&q=" + clipboardText);

    } else if ( e.target.id === "command-proofread" ) {

        let response = await sendMessageToBackgroundScripts( e.target.id)

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
        // Go forward.
    } else if ( e.target.id === "tab-back" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        let response = await sendMessageToContentScripts( e.target.id)
        await loadContentScript();

    } else if ( e.target.id === "tab-forward" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        let response = await sendMessageToContentScripts( e.target.id)
        await loadContentScript();

    } else if ( e.target.id === "tab-refresh" ) {

        // window.location.reload();
        let response = await sendMessageToContentScripts( e.target.id)
        // await loadContentScript();

        let searchingHistory = browser.history.search({text: "", maxResults: 5});
        searchingHistory.then((results) => {
            // What to show if there are no results.
            if (results.length < 1) {
                console.log( "This is all there is:" + hostname.url);
            } else {
                for (let k in results) {
                    let history = results[k];
                    console.log(history.url);
                }
            }
        });

        // verbatim copy and paste from web extension example "tabs tabs tabs": https://github.com/mdn/webextensions-examples/tree/main/tabs-tabs-tabs
    } else if ( e.target.id === "tabs-add-zoom" ) {
        callOnActiveTab((tab) => {
            // console.log( "tabs-add-zoom, tab: " + JSON.stringify( tab ) );
            console.log( "tabs-add-zoom, tab.id: " + tab.id);
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                // //the maximum zoomFactor is 5, it can't go higher
                // if (zoomFactor >= ZOOM_MAX) {
                //     // alert( "Tab zoom factor is already at max!" );
                // } else {
                let newZoomFactor = zoomFactor + ZOOM_INCREMENT;
                //if the newZoomFactor is set to higher than the max accepted
                //it won't change, and will never alert that it's at maximum
                newZoomFactor = newZoomFactor > ZOOM_MAX ? ZOOM_MAX : newZoomFactor;
                browser.tabs.setZoom(tab.id, newZoomFactor);
                // }
            });
        });
    } else if ( e.target.id === "tabs-decrease-zoom" ) {
        callOnActiveTab((tab) => {
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                //the minimum zoomFactor is 0.3, it can't go lower
                // if (zoomFactor <= ZOOM_MIN) {
                //     // alert( "Tab zoom factor is already at minimum!" );
                // } else {
                let newZoomFactor = zoomFactor - ZOOM_INCREMENT;
                //if the newZoomFactor is set to lower than the min accepted
                //it won't change, and will never alert that it's at minimum
                newZoomFactor = newZoomFactor < ZOOM_MIN ? ZOOM_MIN : newZoomFactor;
                browser.tabs.setZoom(tab.id, newZoomFactor);
                // }
            });
        });
    } else if ( e.target.id === "tabs-default-zoom" ) {
        callOnActiveTab((tab) => {
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                if (zoomFactor != ZOOM_DEFAULT) {
                    browser.tabs.setZoom(tab.id, ZOOM_DEFAULT);
                }
            });
        });

    } else if ( e.target.id === "tabs-close-current-tab" ) {

        callOnActiveTab((tab) => {
            browser.tabs.remove(tab.id);
        });

    } else if ( e.target.id === "open-editor" ) {

        // var url = "http://127.0.0.1:8080/genie-plugin-firefox/html/editor-quill.html";
        queueNewTabCommandInLocalStorage(EDITOR_URL)

    } else if ( e.target.id === "link-mode" ) {

        console.log( "Link mode clicked..." );

    } else {
        console.log( "Unknown button clicked: " + e.target.id);
    }
    e.preventDefault()
}

export async function popupRecorder(mode=MODE_TRANSCRIPTION, prefix = "", transcription = "", debug = false, tabId = -1) {

    // console.log( `popupRecorder() Mode [${mode}], prefix [${prefix}], command [${command}], debug [${debug}] tabId [${tabId}]...` )

    let lastTab = await browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
        return tabs[0]
    });
    let lastTabId = lastTab.id;
    console.log( "lastTabId: " + lastTabId );
    console.log( "lastTab: " + JSON.stringify( lastTab ) );

    const result = await updateLocalStorage(mode, prefix, transcription, debug, lastTabId );
    console.log( "result: " + result);

    console.log( "popupRecorder() titleMode [" + titleMode + "]" );

    let createData = {
        url: "../html/recorder.html",
        type: "popup",
        height: 320,
        width: 256,
        allowScriptsToClose: true,
        titlePreface: "Genie in The Box",
        // callerFunction: messageToParentWindow
    };
    let creating = browser.windows.create(createData);
    let popupRecorderWindow = (await creating)
    // popupRecorderWindow.callerFunction = messageToParentWindow
    popupRecorderWindowId = popupRecorderWindow.id;
    console.log( "popupRecorderWindow  : " + JSON.stringify(popupRecorderWindow));
    console.log( "popupRecorderWindowId: " + popupRecorderWindowId);
}
// function messageToParentWindow( foo ) {
//     alert( "messageToParentWindow()... " + foo );
// }
// TODO: Command should be renamed transcription!
async function updateLocalStorage( mode, prefix, transcription, debug, lastTabId ) {

    console.log( `updateLocalStorage() Mode [${mode}], prefix [${prefix}], transcription [${transcription}], debug [${debug}] lastTabId [${lastTabId}]...` )

    await browser.storage.local.set( {
      alwaysOnTop: false,
           "mode": mode,
         "prefix": prefix,
        // TODO: Command should be renamed transcription!
        "transcription": transcription,
          "debug": debug,
      "lastTabId": lastTabId
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

let fetchWhatsThisMean;
fetchWhatsThisMean = async () => {

    console.log( "fetchWhatsThisMean() called..." )

    const clipboardText = await navigator.clipboard.readText();

    let url = GIB_SERVER_ADDRESS + "/api/ask-ai-text?question=" + clipboardText
    const encodedUrl = encodeURI( url );
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

let doTextToSpeech = async (text) => {

    console.log( "doTextToSpeech() called..." )

    let url = TTS_SERVER_ADDRESS + "/api/tts?text=" + text
    const encodedUrl = encodeURI( url );
    console.log( "encoded: " + encodedUrl);

    const audio = new Audio( encodedUrl);
    await audio.play();

    console.log( "doTextToSpeech() called... done!" )
}