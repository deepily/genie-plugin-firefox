import {
    ZOOM_INCREMENT,
    MAX_ZOOM,
    MIN_ZOOM,
    DEFAULT_ZOOM,
    TTS_SERVER,
    GIB_SERVER,
    TRANSCRIPTION_MODE,
    COMMAND_MODE,
    VOX_EDIT_COMMANDS,
    VOX_CMD_TAB_CLOSE, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD, VOX_CMD_PASTE
} from "/js/constants.js";
import {
    popupRecorder
} from "/js/menu-and-side-bar.js";
import {
    callOnActiveTab,
    getCurrentTab,
    loadContentScript,
    readLocalStorage,
    updateLocalStorageLastPaste,
    updateLocalStorageLastUrl,
    // sendMessageToContentScripts
    sendMessageToOneContentScript
} from "/js/util.js";

let lastPaste = "";
let lastUrl   = "";
let lastZoom  = "";
let lastTabId = -1;
var mode      = "";
var prefix    = "";
var command   = "";

console.log( "NOT NEW! background.js loading..." );

let titleMode = "Transcription"

let counter = 0;
// function logURL(requestDetails) {
//     counter++;
//     console.log( `Loading [${counter}] [${requestDetails.url}]` );
// }
//
// browser.webRequest.onBeforeRequest.addListener(
//   logURL,
//   {urls: ["<all_urls>"]}
// );

window.addEventListener("DOMContentLoaded", async (event) => {

    console.log("DOM fully loaded and parsed, initializing global values...");
    lastUrl = await readLocalStorage("lastUrl", "").then( (value) => {
        return value;
    } );
    console.log( "lastUrl [" + lastUrl + "]" );

    titleMode = await readLocalStorage("mode", "Transcription" ).then( (value) => {
        return value;
    } );
    titleMode = titleMode[ 0 ].toUpperCase() + titleMode.slice( 1 );
    console.log( "titleMode [" + titleMode + "]" );

    // loadContentScript();
    return true;
} );

// async function loadContentScript() {
//
//     console.log( "Background.js: Loading content script..." );
//     browser.tabs.executeScript( {file: "../js/content.js" } )
//     .then( () => { console.log( "Background.js: Loading content script... done!" ) } )
//     .catch( () => { console.log( "Background.js: Loading content script... ERROR" ) } );
// }

browser.contextMenus.onClicked.addListener(function(info, tab) {
    // if (info.menuItemId == "radio-blue" ) {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItBlue
    //   });
    // } else if (info.menuItemId == "radio-green" ) {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItGreen
    //   });
    // }
});

console.log( "browser.commands.onCommand.addListener ..." )
browser.commands.onCommand.addListener( ( command) => {

    // console.log( "command [" + command + "]" )

    if ( command === "popup-vox-to-text" ) {
        popupRecorder( mode = "transcription" );
    }
    // else if ( command === "open-editor" ) {
    //
    //     openNewTab( "html/editor-quill.html" )
    // }
});
console.log( "browser.commands.onCommand.addListener ... Done?" )

browser.contextMenus.create({
        id: "proofread",
        title: "Proofread",
        contexts: ["selection"]
    },
    // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
    // for information on the purpose of this error capture.
    () => void browser.runtime.lastError,
);
// browser.contextMenus.create({
//         id: "read-to-me",
//         title: "Read to me",
//         contexts: ["selection"]
//     },
//     // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
//     // for information on the purpose of this error capture.
//     () => void browser.runtime.lastError,
// );`


// function insertCss() {
//
//     browser.tabs.query({currentWindow: true, active: true}).then(async (tabs) => {
//
//         let tab = tabs[0]; // Safe to assume there will only be one result
//
//         console.log( "background.js inserting CSS...[" + tab + "]" );
//         try {
//             // Insert CSS from a file:
//             browser.tabs.insertCSS( tab.id, { file: "../css/modal.css" } )
//             document.getElementsByName( "body" ).innerHTML = "Hello World! Hello World! Hello World! Hello World! Hello World! Hello World! Hello World! ";
//             // Insert static CSS:
//             // let css = "body { border: 20px dotted pink; }";
//             // await browser.tabs.insertCSS( tab.id, {code: css} );
//         } catch (err) {
//             console.error(`failed to insert CSS: ${err}`);
//         }
//         console.log( "background.js inserting CSS... Done!" );
//     }, console.error )
// }
browser.contextMenus.onClicked.addListener(async (info, tab) => {
//
//     if (info.menuItemId === "insert-modal" ) {
//
//         console.log( "insert-modal clicked [" + info.selectionText + "]" );
//         console.log( "info: " + JSON.stringify(info) );
//
//         insertModal(info);
//
//     } else if (info.menuItemId === "whats-this-mean" ) {
    if (info.menuItemId === "whats-this-mean" ) {

        console.log( "whats-this-mean clicked [" + info.selectionText + "]" );
        console.log( "info: " + JSON.stringify(info) );

        console.log( "calling fetchWhatsThisMean()..." )
        new Promise(function (resolve, reject) {

            fetchWhatsThisMean(info).then((explanation) => {
                console.log( "calling fetchWhatsThisMean()... done!" )
                // console.log( "explanation: " + explanation);
                // console.log( "calling doTextToSpeech()..." )
                // doTextToSpeech( explanation ).then( ( audio ) => {
                //     console.log( "calling doTextToSpeech()... done!" )
                // } );
                // } );
            });
        });
    } else if ( info.menuItemId === "proofread" ) {

        proofread( info.selectionText );
    }
});
// insertModal = ( info ) => {
//
//     console.log( "insertModal() called..." )
//     insertCss()
// }

async function proofread( rawText ) {

    console.log( "proofread() rawText [" + rawText + "]" );
    try {
        await doTextToSpeech( "Proofreading..." )
        let url = GIB_SERVER + "/api/proofread?question=" + rawText

        console.log( "Calling GIB_SERVER [" + GIB_SERVER + "]..." );

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
        updateLocalStorageLastPaste( Date.now() );

    } catch ( e ) {

        doTextToSpeech( "Unable to proofread that text, please see the error log." );
        console.log( "Error: " + e );
    }
}

let fetchWhatsThisMean = async (info) => {

    console.log( "fetchWhatsThisMean() called..." )

    let url = GIB_SERVER + "/api/ask-ai-text?question=" + info.selectionText
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

    let url = TTS_SERVER + "/api/tts?text=" + text
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
    console.log( "changes: " + JSON.stringify(changes) );
    console.log( "areaName: " + areaName);
    console.log( "lastUrl: " + lastUrl);
    console.log( "lastZoom: " + lastZoom);
    console.log( "lastTabId: " + lastTabId);
    console.log( "lastPaste: " + lastPaste);

    if (changes.lastUrl === undefined || changes.lastUrl === null) {
        console.log( "lastUrl NOT defined: " + lastUrl)
    } else if (areaName === "local" && lastUrl !== changes.lastUrl.newValue) {
        openNewTab( changes.lastUrl.newValue );
        lastUrl = changes.lastUrl.newValue;
    } else {
        console.log( "lastUrl NOT changed: " + lastUrl)
    }

    if (changes.lastTabId === undefined) {
        console.log( "lastTabId NOT defined: " + lastTabId)
    } else if (areaName === "local" && lastTabId !== parseInt(changes.lastTabId.newValue) ) {
        lastTabId = parseInt(changes.lastTabId.newValue);
    } else {
        console.log( "lastTabId NOT changed: " + lastUrl)
    }

    if (changes.lastZoom === undefined) {
        console.log( "lastZoom NOT defined: " + lastZoom)
    } else if (areaName === "local" && lastZoom !== changes.lastZoom.newValue) {

        lastZoom = changes.lastZoom.newValue;
        // Remove time stamp from URL
        const zoom = lastZoom.split( "?ts=" )[0];
        console.log( "Zoom: " + zoom);
        console.log( "lastTabId: " + lastTabId);

        zoomInOut(lastTabId, zoom);
    } else {
        console.log( "lastZoom NOT changed: " + lastUrl)
    }

    // if (changes.lastPaste === undefined) {
    //     console.log( "lastPaste NOT defined: " + lastPaste)
    // } else if (areaName === "local" && lastPaste != changes.lastPaste.newValue) {
    //
    //     lastPaste = changes.lastPaste.newValue;
    //     console.log( "lastPaste updated, sending message to paste from clipboard..." );
    //
    //     // let currentTabId = await browser.tabs.query( { currentWindow: true, active: true } ).then( async ( tabs ) => {
    //     //     return tabs[0].id;
    //     // });
    //     // console.log( "currentTabId: " + currentTabId );
    //     // browser.tabs.sendMessage( currentTabId, {
    //     //     "transcription": "command-paste"
    //     // });
    //     // sendMessage( "command-paste" );
    //
    // } else {
    //     console.log( "lastPaste NOT changed: " + lastUrl)
    // }
    console.log( "lastUrl: " + lastUrl );
    console.log( "lastZoom: " + lastZoom );
    console.log( "lastTabId: " + lastTabId );
} );
function openNewTab( url ) {
  console.log( "Opening new tab: " + url );
   browser.tabs.create({
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

    let newZoomFactor = DEFAULT_ZOOM;
    let gettingZoom = browser.tabs.getZoom( tabId );
    gettingZoom.then( ( zoomFactor ) => {

        // If the zoom factor is 0, then reset to the default value.
        // if ( zoom = 0 ) {
        //     newZoomFactor = DEFAULT_ZOOM;
        // } else {
        if ( zoom != 0 ) {
            let incrementing = zoom > 0;
            newZoomFactor    = zoomFactor;

            // If we're zooming out, we need to make the zoom factor negative
            if ( !incrementing ) {
                zoom = zoom * -1;
            }
            for ( let i = 0; i < zoom; i++ ) {

                console.log( "Zooming... " + i );

                if ( newZoomFactor >= MAX_ZOOM || newZoomFactor <= MIN_ZOOM ) {
                    console.log( "Tab zoom factor is already at max/min!" );
                } else {
                    if ( incrementing ) {
                        newZoomFactor += ZOOM_INCREMENT;
                        //if the newZoomFactor is set to higher than the max accepted
                        //it won't change, and will never alert that it's at maximum
                        newZoomFactor = newZoomFactor > MAX_ZOOM ? MAX_ZOOM : newZoomFactor;
                    } else {
                        // We must be decrementing
                        newZoomFactor -= ZOOM_INCREMENT;
                        //if the newZoomFactor is set to lower than the min accepted
                        //it won't change, and will never alert that it's at minimum
                        newZoomFactor = newZoomFactor < MIN_ZOOM ? MIN_ZOOM : newZoomFactor;
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
        browser.tabs.create({url: message.url});

    } else if ( message.command === "command-transcription" ) {

        console.log( "background.js: 'command-transcription' received" );
        popupRecorder( mode=TRANSCRIPTION_MODE );

    } else if ( message.command === "command-mode" ) {

        console.log( "background.js: 'command-mode' received" );
        popupRecorder(mode=COMMAND_MODE, prefix="multimodal editor", command="mode" );

    } else if ( message.command === VOX_CMD_PASTE ) {

        console.log( "background.js: 'paste' transcription received" );
        sendMessageToOneContentScript( lastTabId, "command-paste" );

    } else if ( VOX_EDIT_COMMANDS.includes( message.command ) ) {

        // TODO: This is a gigantic hack that needs to be replaced with a transcription to command dictionary
        console.log( `background.js: sending [${message.command}] message to content script in tab [${lastTabId}]` )
        sendMessageToOneContentScript( lastTabId, "command-" + message.command.replaceAll(" ", "-" ) );

    } else if ( message.command === VOX_CMD_TAB_CLOSE ) {

        browser.tabs.remove( lastTabId );

    } else if ( message.command === VOX_CMD_TAB_REFRESH ) {

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

    } else{
        console.log( "background.js: command NOT recognized: " + message.command );
    }
} );
console.log( "background.js: adding listener for messages... Done!" );

console.log( "NOT NEW! background.js loading... Done!" );