// import "genie-utils.js"
const ZOOM_INCREMENT = 0.1;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.3;
const DEFAULT_ZOOM = 1;

const ttsServer = "http://127.0.0.1:5002";
const genieInTheBoxServer = "http://127.0.0.1:7999";

let titleMode = "Transcription"
let popupRecorderWindowId = null;

// Set focus after the DOM is loaded.
window.addEventListener( "DOMContentLoaded", (event) => {

    console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );

    document.getElementById( "transcription" ).focus();

    loadContentScript();
    // console.log( "Loading content script..." );
    // browser.tabs.executeScript( {file: "../js/content.js" } )
    // .then( () => { console.log( "Loading content script... done!" ) } )
    // .catch( reportExecuteScriptError );

} );
// window.addEventListener( "message", (event) => {
//
//     console.log( "message: " + event );
//     console.log( "message: " + event.data );
//     console.log( "message: " + JSON.stringify( event.data ) );
// } );
async function loadContentScript() {

    console.log( "Loading content script..." );
    browser.tabs.executeScript( {file: "../js/content.js" } )
    .then( () => { console.log( "Loading content script... done!" ) } )
    .catch( reportExecuteScriptError );
}
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

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}
document.addEventListener( "click", async (e) => {

    console.log( "click detected: " + e.target.id);
    // e.preventDefault()

    function callOnActiveTab(callback) {
        getCurrentWindowTabs().then((tabs) => {
            for (let tab of tabs) {
                if (tab.active) {
                    callback(tab, tabs);
                }
            }
        });
    }
    if (e.target.id === "transcription") {

        // await doTextToSpeech( "Transcription mode" )
        popupRecorder(mode = "transcription");

    } else if (e.target.id === "transcription-python") {

        popupRecorder(mode = "transcription", prefix = "multimodal python punctuation");

    } else if (e.target.id === "transcription-email") {

        popupRecorder(mode = "transcription", prefix = "multimodal text email");

    } else if (e.target.id === "transcription-debug") {

        // await doTextToSpeech( "Debug mode" )
        popupRecorder(mode = "transcription", debug = true);

    } else if (e.target.id === "command-cut" || e.target.id === "command-copy" || e.target.id === "command-paste" || e.target.id === "command-delete") {

        response = await sendMessage( e.target.id )

    } else if (e.target.id === "command-mode") {

        // await doTextToSpeech( "Command mode" )
        popupRecorder(mode = "command", prefix = "multimodal editor", command = "mode");

    } else if (e.target.id === "command-open-new-tab") {

        // await doTextToSpeech( "Command mode" )
        console.log("command-new-tab");
        popupRecorder(mode = "command", prefix = "multimodal editor", command = "open new tab");
        // browser.tabs.create()
        // sendMessage( e.target.id )

    } else if (e.target.id === "command-search-duck-duck-go") {

        // await doTextToSpeech( "Command mode" )
        popupRecorder(mode = "command", prefix = "multimodal editor", command = "search duck duck go");

    } else if (e.target.id === "command-search-google") {

        // await doTextToSpeech( "Command mode" )
        popupRecorder(mode = "command", prefix = "multimodal editor", command = "search google");

    } else if (e.target.id === "command-search-duck-duck-go-clipboard" ) {

        const rawText = await navigator.clipboard.readText()
        url = "https://www.duckduckgo.com/?q=" + rawText + "&ts=" + Date.now();
        console.log("Updating lastUrl to [" + url + "]");
        updateLocalStorageLastUrl(url);

    } else if (e.target.id === "command-search-google-clipboard" ) {

        const rawText = await navigator.clipboard.readText()
        url = "https://www.google.com/search?q=" + rawText + "&ts=" + Date.now();
        console.log("Updating lastUrl to [" + url + "]");
        updateLocalStorageLastUrl(url);

    } else if (e.target.id === "command-proofread") {

        response = await sendMessage( e.target.id )
        // popupRecorder( "multimodal editor proofread" );

    } else if (e.target.id === "command-whats-this") {

        doTextToSpeech("TODO: Implement what's this?")
        // fetchWhatsThisMean();
        //
        // browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        //     let tab = tabs[0];
        //     browser.tabs.sendMessage(tab.id, {
        //         command: e.target.id
        //     } );
        // } );
        // Go forward.
    } else if ( e.target.id === "tabs-back" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        response = await sendMessage( e.target.id )
        await loadContentScript();

    } else if ( e.target.id === "tabs-forward" ) {

        // Kluge to force a reload of the content script just in case we've already toggled forward or backwards and the script has not been reloaded.
        response = await sendMessage( e.target.id )
        await loadContentScript();

    } else if (e.target.id === "tabs-reload") {

        // window.location.reload();
        response = await sendMessage( e.target.id )
        // await loadContentScript();

        let searchingHistory = browser.history.search({text: "", maxResults: 5});
            searchingHistory.then((results) => {
            // What to show if there are no results.
            if (results.length < 1) {
              console.log( "This is all there is:" + hostname.url );
            } else {
              for (let k in results) {
                let history = results[k];
                console.log(history.url);
              }
            }
        });

    // verbatim copy and paste from web extension example tabs tabs tabs
    } else if (e.target.id === "tabs-add-zoom") {
        callOnActiveTab((tab) => {
            console.log("tabs-add-zoom, tab: " + JSON.stringify( tab ) );
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                //the maximum zoomFactor is 5, it can't go higher
                if (zoomFactor >= MAX_ZOOM) {
                    // alert("Tab zoom factor is already at max!");
                } else {
                    let newZoomFactor = zoomFactor + ZOOM_INCREMENT;
                    //if the newZoomFactor is set to higher than the max accepted
                    //it won't change, and will never alert that it's at maximum
                    newZoomFactor = newZoomFactor > MAX_ZOOM ? MAX_ZOOM : newZoomFactor;
                    browser.tabs.setZoom(tab.id, newZoomFactor);
                }
            });
        });
    } else if (e.target.id === "tabs-decrease-zoom") {
        callOnActiveTab((tab) => {
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                //the minimum zoomFactor is 0.3, it can't go lower
                if (zoomFactor <= MIN_ZOOM) {
                    // alert("Tab zoom factor is already at minimum!");
                } else {
                    let newZoomFactor = zoomFactor - ZOOM_INCREMENT;
                    //if the newZoomFactor is set to lower than the min accepted
                    //it won't change, and will never alert that it's at minimum
                    newZoomFactor = newZoomFactor < MIN_ZOOM ? MIN_ZOOM : newZoomFactor;
                    browser.tabs.setZoom(tab.id, newZoomFactor);
                }
            });
        });
    } else if (e.target.id === "tabs-default-zoom") {
        callOnActiveTab((tab) => {
            let gettingZoom = browser.tabs.getZoom(tab.id);
            gettingZoom.then((zoomFactor) => {
                if (zoomFactor == DEFAULT_ZOOM) {
                    // alert("Tab zoom is already at the default zoom factor");
                } else {
                    browser.tabs.setZoom(tab.id, DEFAULT_ZOOM);
                }
            });
        });
    } else {
        console.log("Unknown button clicked: " + e.target.id);
    }
    e.preventDefault()
} );
async function updateLocalStorageLastUrl( url ) {

    console.log( "updateLocalStorageLastUrl()..." + url  );
    browser.storage.local.set( {
        "lastUrl": url
    } );
    return true;
}
// async function updateLocalStorageLastTabId( value ) {
//
//     console.log( "updateLocalStorageLastTabId()... " + value );
//     browser.storage.local.set( {
//         "lastTabId": value
//     } );
//     return true;
// }
async function popupRecorder(mode="transcription", prefix="", command="", debug=false, tabId=-1) {

    // console.log( `popupRecorder() Mode [${mode}], prefix [${prefix}], command [${command}], debug [${debug}] tabId [${tabId}]...` )

    lastTabId = await browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
        return tabs[0].id;
    // }
    //
    //     let tab = tabs[0];
    //     console.log( "tab: " + JSON.stringify( tab ) );
    //     console.log( "tab.id: " + tab.id );
    //     console.log( "tab.url: " + tab.url );
    //     console.log( "tab.title: " + tab.title );
    //     console.log( "tab.windowId: " + tab.windowId );
    //     console.log( "tab.index: " + tab.index );
    //     console.log( "tab.active: " + tab.active );
    //     console.log( "tab.pinned: " + tab.pinned );
    //     console.log( "tab.audible: " + tab.audible );
    //     console.log( "tab.discarded: " + tab.discarded );
    //     console.log( "tab.favIconUrl: " + tab.favIconUrl );
    //     console.log( "tab.height: " + tab.height );
    //     console.log( "tab.hidden: " + tab.hidden );
    //     console.log( "tab.incognito: " + tab.incognito );
    //     console.log( "tab.isArticle: " + tab.isArticle );
    //     console.log( "tab.isInReaderMode: " + tab.isInReaderMode );
    //     console.log( "tab.lastAccessed: " + tab.lastAccessed );
    //     console.log( "tab.mutedInfo: " + tab.mutedInfo );
    //     console.log( "tab.openerTabId: " + tab.openerTabId );
    //     console.log( "tab.pinned: " + tab.pinned );
    //     console.log( "tab.selected: " + tab.selected );
    //     console.log( "tab.status: " + tab.status );
    //     console.log( "tab.successorTabId: " + tab.successorTabId );
    //     console.log( "tab.width: " + tab.width );
    //     console.log( "tab.windowId: " + tab.windowId );

        // browser.tabs.sendMessage(tab.id, {
        //     command: "popupRecorder",
        //     mode: mode,
        //     prefix: prefix,
        //     command: command,
        //     debug: debug
        // } );
        // Go forward.
    });
    console.log( "lastTabId: " + lastTabId );

    const result = await updateLocalStorage( mode, prefix, command, debug, lastTabId );
    console.log( "result: " + result );
    // await updateLocalStorageLastTabId( lastTabId );

    console.log( "popupRecorder() titleMode [" + titleMode + "]" );

    let createData = {
        url: "../html/recorder.html",
        type: "popup",
        height: 320,
        width: 256,
        allowScriptsToClose: true,
        type: "panel",
        titlePreface: "Genie in The Box",
        // callerFunction: messageToParentWindow
    };
    let creating = browser.windows.create( createData );
    popupRecorderWindow = (await creating)
    // popupRecorderWindow.callerFunction = messageToParentWindow
    popupRecorderWindowId = popupRecorderWindow.id;
    console.log( "popupRecorderWindow  : " + JSON.stringify( popupRecorderWindow ) );
    console.log( "popupRecorderWindowId: " + popupRecorderWindowId );
}
// function messageToParentWindow( foo ) {
//     alert( "messageToParentWindow()... " + foo );
// }
// TODO: Command should be renamed transcription!
async function updateLocalStorage( mode, prefix, command, debug, lastTabId ) {

    console.log( `updateLocalStorage() Mode [${mode}], prefix [${prefix}], command [${command}], debug [${debug}] lastTabId [${lastTabId}]...` )

    await browser.storage.local.set( {
      alwaysOnTop: false,
           "mode": mode,
         "prefix": prefix,
        // TODO: Command should be renamed transcription!
        "command": command,
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