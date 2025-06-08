import {
    ZOOM_INCREMENT,
    ZOOM_MAX,
    ZOOM_MIN,
    ZOOM_DEFAULT,
    TTS_SERVER_ADDRESS,
    GIB_SERVER_ADDRESS,
    MODE_TRANSCRIPTION,
    MODE_COMMAND,
    VOX_CMD_SEARCH_DDG_NEW_TAB,
    VOX_CMD_SEARCH_GOOGLE_NEW_TAB,
    VOX_CMD_LOAD_NEW_TAB,
    STEM_MULTIMODAL_BROWSER,
    EDITOR_URL,
    MULTIMODAL_CONTACT_INFO,
    MULTIMODAL_TEXT_EMAIL,
    MULTIMODAL_PYTHON_PUNCTUATION,
    MULTIMODAL_TEXT_SQL,
    MULTIMODAL_PYTHON_PROOFREAD
} from "/js/constants.js";

import {
    sendMessageToBackgroundScripts,
    sendMessageToContentScripts,
    callOnActiveTab,
    queueNewTabCommandInLocalStorage,
    handleOneFile
} from "/js/util.js";

let args                = "";
let command             = "";
var mode                = "";
var currentMode         = "";
var prefix              = "";
var transcription       = "";
let debug             = false;
let titleMode           = "Transcription"
let popupRecorderWindowId = null;
let popupQueueWindowId    = null;

let fileSelect= null;
let fileElem = null;
let fileList = null;

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

    console.log( "DOM fully loaded and parsed, setting up message listener..." );
    browser.runtime.onMessage.addListener( ( message, sender ) => {
        handleMessages( message, sender );
    } );
    console.log( "DOM fully loaded and parsed, setting up message listener... done!" );

} );

function handleMessages( message, sender ) {

    // console.log( "handleMessages() message: " + JSON.stringify( message ) );
    console.log( "handleMessages() message: NO-OP" );
    // console.log( "sender: " + JSON.stringify( sender ) );

    // None of these work all throw a very specific error: <input> picker was blocked due to lack of user activation.
    // 1) document.getElementById( "file-selector" ).addEventListener( "change", handleOneFile, false);
    // 1) document.getElementById( "file-selector" ).click();

    // 2) handleClickEvent( { target: { id: "open-file-selector" } } );
    // 3) document.getElementById( "open-file-selector" ).click();
    // document.getElementById( "open-file-selector" ).focus( { force: true, focusVisible: true } );
}
// window.onload = function() {
//
//     console.log( "window.onload()..." );
//     fileSelect = document.getElementsByName( "fileSelect" )[ 0 ];
//     fileElem = document.getElementsByName( "fileElem" )[ 0 ];
//     fileList = document.getElementsByName( "fileList" )[ 0 ];
//
//     fileElem.addEventListener( "change", handleFiles, false);
// }
async function loadContentScript() {

    // console.log( "Loading CONSTANTS script from w/in menu-and-side-bar.js..." );
    // browser.tabs.executeScript( {file: "../js/constants.js" } )
    // .then( () => { console.log( "Loading CONSTANTS script from w/in menu-and-side-bar.js... done!" ) } )
    // .catch( reportExecuteScriptError );
    //
    // console.log( "Loading content script from w/in menu-and-side-bar.js..." );
    // browser.tabs.executeScript( {file: "../js/content.js" } )
    // .then( () => { console.log( "Loading content script from w/in menu-and-side-bar.js... done!" ) } )
    // .catch( reportExecuteScriptError );
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
    console.error( `Failed to execute content script: ${error.message}` );
}

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

        displayRecorder(mode = MODE_TRANSCRIPTION);

    } else if ( e.target.id === "transcription-python" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_PYTHON_PUNCTUATION );

    } else if ( e.target.id === "transcription-python-proofread" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_PYTHON_PROOFREAD );

    } else if ( e.target.id === "transcription-sql" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_TEXT_SQL );

    } else if ( e.target.id === "transcription-email" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_TEXT_EMAIL );

    } else if ( e.target.id === "transcription-contact-information" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, prefix = MULTIMODAL_CONTACT_INFO );

    } else if ( e.target.id === "transcription-debug" ) {

        displayRecorder(mode = MODE_TRANSCRIPTION, debug = true);

    } else if ( e.target.id === "command-cut" || e.target.id === "command-copy" || e.target.id === "command-paste" || e.target.id === "command-delete" || e.target.id === "command-select-all" ) {

        let response = await sendMessageToContentScripts( e.target.id )

    } else if ( e.target.id === MODE_COMMAND ) {

        displayRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_BROWSER, command = "mode" );

    } else if ( e.target.id === "command-open-new-tab" ) {

        console.log( "command-new-tab" );
        displayRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_BROWSER, command = VOX_CMD_LOAD_NEW_TAB);

    } else if ( e.target.id === "command-search-duck-duck-go" ) {

        displayRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_BROWSER, command = VOX_CMD_SEARCH_DDG_NEW_TAB);

    } else if ( e.target.id === "command-search-google" ) {

        displayRecorder(mode = MODE_COMMAND, prefix = STEM_MULTIMODAL_BROWSER, command = VOX_CMD_SEARCH_GOOGLE_NEW_TAB);

    } else if ( e.target.id === "command-search-duck-duck-go-clipboard" ) {

        const clipboardText = await navigator.clipboard.readText()
        let url = "https://www.duckduckgo.com/";
        queueNewTabCommandInLocalStorage(url, args = "&q=" + clipboardText);

    } else if ( e.target.id === "command-search-google-clipboard" ) {

        const clipboardText = await navigator.clipboard.readText()
        let url = "https://www.google.com/search";
        queueNewTabCommandInLocalStorage(url, args = "&q=" + clipboardText);

    } else if ( e.target.id === "command-proofread" ) {

        let response = await sendMessageToBackgroundScripts( e.target.id )

    } else if ( e.target.id === "command-whats-this" ) {

        doTextToSpeech( "TODO: Implement what's this?" )
        // fetchWhatsThisMean();
        //
        // browser.tabs.query( {currentWindow: true, active: true} ).then(async ( tabs) => {
        //     let tab = tabs[0];
        //     browser.tabs.sendMessage( tab.id, {
        //         command: e.target.id
        //     } );
        // } );
        // Go forward.
    } else if ( e.target.id === "tab-back" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        let response = await sendMessageToContentScripts( e.target.id )
        await loadContentScript();

    } else if ( e.target.id === "tab-forward" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        let response = await sendMessageToContentScripts( e.target.id )
        await loadContentScript();

    } else if ( e.target.id === "tab-refresh" ) {

        // window.location.reload();
        let response = await sendMessageToContentScripts( e.target.id )
        // await loadContentScript();

        let searchingHistory = browser.history.search( {text: "", maxResults: 5});
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
        callOnActiveTab(( tab) => {
            // console.log( "tabs-add-zoom, tab: " + JSON.stringify( tab ) );
            console.log( "tabs-add-zoom, tab.id: " + tab.id );
            let gettingZoom = browser.tabs.getZoom( tab.id );
            gettingZoom.then((zoomFactor) => {
                // //the maximum zoomFactor is 5, it can't go higher
                // if (zoomFactor >= ZOOM_MAX) {
                //     // alert( "Tab zoom factor is already at max!" );
                // } else {
                let newZoomFactor = zoomFactor + ZOOM_INCREMENT;
                //if the newZoomFactor is set to higher than the max accepted
                //it won't change, and will never alert that it's at maximum
                newZoomFactor = newZoomFactor > ZOOM_MAX ? ZOOM_MAX : newZoomFactor;
                browser.tabs.setZoom( tab.id, newZoomFactor);
                // }
            });
        });
    } else if ( e.target.id === "tabs-decrease-zoom" ) {
        callOnActiveTab(( tab) => {
            let gettingZoom = browser.tabs.getZoom( tab.id );
            gettingZoom.then((zoomFactor) => {
                //the minimum zoomFactor is 0.3, it can't go lower
                // if (zoomFactor <= ZOOM_MIN) {
                //     // alert( "Tab zoom factor is already at minimum!" );
                // } else {
                let newZoomFactor = zoomFactor - ZOOM_INCREMENT;
                //if the newZoomFactor is set to lower than the min accepted
                //it won't change, and will never alert that it's at minimum
                newZoomFactor = newZoomFactor < ZOOM_MIN ? ZOOM_MIN : newZoomFactor;
                browser.tabs.setZoom( tab.id, newZoomFactor);
                // }
            });
        });
    } else if ( e.target.id === "tabs-default-zoom" ) {
        callOnActiveTab(( tab ) => {
            let gettingZoom = browser.tabs.getZoom( tab.id );
            gettingZoom.then((zoomFactor) => {
                if (zoomFactor != ZOOM_DEFAULT) {
                    browser.tabs.setZoom( tab.id, ZOOM_DEFAULT);
                }
            });
        });

    } else if ( e.target.id === "tabs-close-current-tab" ) {

        callOnActiveTab(( tab) => {
            browser.tabs.remove( tab.id );
        });

    } else if ( e.target.id === "open-editor" ) {

        // var url = "http://127.0.0.1:8080/genie-plugin-firefox/html/editor-quill.html";
        queueNewTabCommandInLocalStorage( EDITOR_URL )

    } else if ( e.target.id === "link-mode" ) {

        console.log( "Link mode clicked..." );

    // } else if ( e.target.id === "open-file-selector" || e.target.id === "file-selector" ) {
    //
    //     console.log( "open-file-selector clicked... " + e.target.id );
    //     let response = await sendMessageToBackgroundScripts( e.target.id );

    // Moved this into the background script so that we can call it by voice also
    } else if ( e.target.id === "open-file-selector" ) {

        // This is a ridiculously KLUDGEY workaround in which a visible button is used to force a click on an invisible
        // file selector button!
        console.log( "open-file-selector clicked... " + e.target.id );

        // const fileSelector = document.getElementById( "file-selector" ) RETURNS NULL!?!?!?!?!?!
        // These two lines below are used because when you assign, get element by ID to a variable, it returns null. I have no idea why.
        document.getElementById( "file-selector" ).addEventListener( "change", handleOneFile, false);
        document.getElementById( "file-selector" ).click();

    } else if ( e.target.id === "file-selector" ) {

        console.log( "file-selector clicked..." );
        console.log( "Here comes your innocuous, but odd as fuck, uncaught in-promise type error:" )
        // always throws: Uncaught (in promise) TypeError: window.showOpenFilePicker is not a function
        // Currently harmless.
        const filePicker = await window.showOpenFilePicker();
        //     .then(
        //     (fileHandle) => {
        //         console.log( "fileHandle: " + fileHandle);
        //         return fileHandle;
        //     }
        // );
        console.log( "filePicker: " + filePicker) ;
    } else {
        console.log( "Unknown button clicked: " + e.target.id );
    }
    e.preventDefault()
}

export async function displayRecorder( mode=MODE_TRANSCRIPTION, prefix = "", transcription = "", debug = false, tabId = -1) {

    let lastTab = await browser.tabs.query( { currentWindow: true, active: true } ).then(async ( tabs ) => {
        return tabs[0]
    });
    let lastTabId = lastTab.id;
    console.log( "lastTabId: " + lastTabId );
    // console.log( "lastTab: " + JSON.stringify( lastTab ) );

    const result = await updateLocalStorage(mode, prefix, transcription, debug, lastTabId );
    console.log( "result: " + result);

    console.log( "displayRecorder() titleMode [" + titleMode + "]" );

    let createData = {
        url: "../html/recorder.html",
        type: "popup",
        height: 320,
        width: 256,
        allowScriptsToClose: true,
        titlePreface: "CoSA",
        // callerFunction: messageToParentWindow
    };
    let creating = browser.windows.create(createData);
    let popupRecorderWindow = (await creating)
    popupRecorderWindowId = popupRecorderWindow.id;
    console.log( "popupRecorderWindowId: " + popupRecorderWindowId );
}

export async function displayQueue() {

    console.log( `displayQueue() called, popupQueueWindowId ${popupQueueWindowId}...` );

    if ( popupQueueWindowId !== null ) {

        console.log( "Queue window already open, not opening another one." );

        // Bring the hidden pop-up window to the top
        browser.windows.update( popupQueueWindowId, { focused: true } );

        return;
    }
    let lastTab = await browser.tabs.query( { currentWindow: true, active: true } ).then( async( tabs ) => {
        return tabs[ 0 ]
    } );
    let lastTabId = lastTab.id;
    console.log( "lastTabId: " + lastTabId );
    // console.log( "lastTab: " + JSON.stringify( lastTab ) );

    let createData = {
        url: GIB_SERVER_ADDRESS + "/static/queue.html",
        type: "popup",
        height: 1000,
        width: 400,
        allowScriptsToClose: true,
        titlePreface: "Genie in The Box: Queue",
    };
    let creating = browser.windows.create( createData );
    let popupQueueWindow = ( await creating );
    popupQueueWindowId = popupQueueWindow.id;

    console.log( "popupQueueWindowId: " + popupQueueWindowId );
}

// Listen for the queue window being closed to remove the reference to it.
browser.windows.onRemoved.addListener( windowId => {

    if ( windowId === popupQueueWindowId ) {
        popupQueueWindowId = null;
    }
} );

async function updateLocalStorage( mode, prefix, transcription, debug, lastTabId ) {

    console.log( `updateLocalStorage() Mode [${mode}], prefix [${prefix}], transcription [${transcription}], debug [${debug}] lastTabId [${lastTabId}]...` )

    await browser.storage.local.set( {
          alwaysOnTop: false,
               "mode": mode,
             "prefix": prefix,
      "transcription": transcription,
              "debug": debug,
          "lastTabId": lastTabId
    } );
    return true;
}

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