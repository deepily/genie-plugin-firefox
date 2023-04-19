// import { readLocalStorage } from "./recorder.js";

console.log( "background-context-menu.js loading..." );

// ¡OJO! TODO: These constants should be declared globally and ultimately in a runtime configurable configuration service provided by the browser.
// ¡OJO! TODO: background-context-menu.js and recorder.js both make duplicate declarations of these constants.
const genieInTheBoxServer = "http://127.0.0.1:7999";
const ttsServer = "http://127.0.0.1:5002";

console.log( "NEW! background-context-menu.js loading... Done!" );

const readLocalStorage = async (key, defaultValue ) => {
    return new Promise(( resolve, reject ) => {
        browser.storage.local.get( [ key ], function ( result ) {
            if ( result[ key ] === undefined || result[ key ] === null ) {
                resolve( defaultValue );
            } else {
                resolve( result[ key ] );
            }
        } );
    } );
}
let lastUrl = "";
let titleMode = "Transcription"
window.addEventListener( "DOMContentLoaded", async (event) => {

    console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );
    lastUrl = await readLocalStorage( "lastUrl", "" ).then( (value) => {
        // TODO: This is redundant! The default value is already set in the readLocalStorage function.
        if ( value === undefined || value === null ) {
            return defaultValue;
        }
        return value;
    } );
    titleMode = await readLocalStorage( "mode", "Transcription" ).then( (value) => {
        // TODO: This is redundant! The default value is already set in the readLocalStorage function.
        if ( value === undefined || value === null ) {
            return defaultValue[ 0 ].toUpperCase() + defaultValue.slice( 1 );
        }
        return value[ 0 ].toUpperCase() + value.slice( 1 );
    } );
    console.log( "lastUrl [" + lastUrl + "]" );
} );

// browser.runtime.onMessage.addListener( notify );
//
// function notify( message ) {
//     browser.notifications.create({
//         "type": "basic",
//         "iconUrl": browser.extension.getURL( "../icons/border-48.png" ),
//         "title": "You did something.!",
//         "message": message.text
//     });
// }
function onCreated() {
  if (browser.runtime.lastError) {
    console.log( "error creating item:" + browser.runtime.lastError);
  } else {
    // console.log( "item created successfully" );
  }
}
function onError() {
    console.log( "Error:" + browser.runtime.lastError );
}
// browser.contextMenus.create({
//   id: "radio-green",
//   type: "radio",
//   title: "Make it green",
//   contexts: ["all"],
//   checked: false
// }, onCreated);
// browser.contextMenus.create({
//   id: "radio-blue",
//   type: "radio",
//   title: "Make it blue",
//   contexts: ["all"],
//   checked: false
// }, onCreated);
// browser.contextMenus.create({
//   id: "radio-popup",
//   title: "Popup",
//   contexts: ["all"],
//   checked: false
// }, onCreated);

var makeItBlue = 'document.body.style.border = "5px solid blue"';
var makeItGreen = 'document.body.style.border = "5px solid green"';

// window.addEventListener('load', function ()  {
//     document.addEventListener('keypress', function (e) {
//         console.log( e );
//     }, true);
// }, false);

// const input = document.querySelector( "input" );
//
// input.addEventListener( "keyup", logKey);
//
// function logKey(e) {
//     console.log( e.code );
// }

// document.addEventListener( "keyup", (event) => {
//     // if (event.isComposing || event.keyCode === 229) {
//     //   return;
//     // }
//     // do something
//     console.log( "Key pressed [" + event.key + "]" );
// });
// console.log( "background-context-menu.js loading input event listeners..." );
// document.querySelector( "input" ).addEventListener( "focus", (event) => {
//
//     console.log( "Focus event [" + event + "]" );
// } );
// document.querySelector( "input" ).addEventListener( "blur", (event) => {
//
//     console.log( "Blur event [" + event + "]" );
// } );
// console.log( "background-context-menu.js loading input event listeners... Done!" );

// const form = document.getElementById( "form" );
//
// form.addEventListener(
//   "focus",
//   (event) => {
//     event.target.style.background = "pink";
//   },
//   true
// );
//
// form.addEventListener(
//   "blur",
//   (event) => {
//     event.target.style.background = "";
//   },
//   true
// );

// This always fails returns know for any queried known objects
// window.addEventListener( "DOMContentLoaded", (event) => {
//
//     console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );
//
//     console.log( "window [" + window + "]" );
//     console.log( "document [" + document + "]" );
//     console.log( "window.document [" + window.document + "]" );
//     console.log( "window.document.getElementsByClassName( 'form' ) [" + window.document.getElementsByClassName( "form" ) + "]" );
//
//     let forms = window.document.getElementsByClassName( "form" )
//     console.log( "forms.length [" + forms.length + "]" );
//     for ( let i = 0; i < forms.length; i++ ) {
//         console.log( "form [" + forms[ i ] + "]" );
//     }
//
//     const form = window.document.getElementsByClassName( "form" );
//
//     form.addEventListener(
//       "focus",
//       (event) => {
//         event.target.style.background = "yellow";
//       },
//       true
//     );
//
//     form.addEventListener(
//       "blur",
//       (event) => {
//         event.target.style.background = "";
//       },
//       true
//     );
//
//     console.log( "DOM fully loaded and parsed, Setting up event listeners... Done!" );
// });

function showRecorderPopup (info ){

    console.log( "showRecorderPopup() titleMode [" + titleMode + "]" );
    var popupURL = browser.runtime.getURL( "../html/recorder.html" );

    let creating = browser.windows.create({
        url: popupURL,
        type: "popup",
        height: 320,
        width: 256,
        titlePreface: titleMode
    });
    creating.then(onCreated, onError);
};
browser.contextMenus.onClicked.addListener(function(info, tab) {
    // if (info.menuItemId == "radio-blue" ) {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItBlue
    //   });
    // } else if (info.menuItemId == "radio-green" ) {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItGreen
    //   });
    // } else
    if (info.menuItemId == "radio-popup" ) {

        let selection = window.getSelection();
        console.log( "Menu clicked. selection [" + selection + "]" );
        selection.deleteFromDocument();

        browser.tabs.executeScript(tab.id, {
            code: showRecorderPopup( info )
        });
    }
});

console.log( "browser.commands.onCommand.addListener ..." )
browser.commands.onCommand.addListener((command) => {

    // console.log( "command [" + command + "]" )

    if (command === "popup-vox-to-text" ) {
        // console.log( "Popping up recorder.html..." );
        showRecorderPopup( null )
    }
});
console.log( "browser.commands.onCommand.addListener ... Done?" )

// browser.contextMenus.create({
//         id: "insert-modal",
//         title: "Insert Modal",
//         contexts: ["selection"]
//     },
//     // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
//     // for information on the purpose of this error capture.
//     () => void browser.runtime.lastError,
// );
// browser.contextMenus.create({
//         id: "whats-this-mean",
//         title: "What's this?",
//         contexts: ["selection"]
//     },
//     // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
//     // for information on the purpose of this error capture.
//     () => void browser.runtime.lastError,
// );
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
//         console.log( "background-context-menu.js inserting CSS...[" + tab + "]" );
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
//         console.log( "background-context-menu.js inserting CSS... Done!" );
//     }, console.error )
// }
browser.contextMenus.onClicked.addListener(async (info, tab) => {
//
//     if (info.menuItemId === "insert-modal" ) {
//
//         console.log( "insert-modal clicked [" + info.selectionText + "]" );
//         console.log( "info: " + JSON.stringify(info));
//
//         insertModal(info);
//
//     } else if (info.menuItemId === "whats-this-mean" ) {
    if (info.menuItemId === "whats-this-mean" ) {

        console.log( "whats-this-mean clicked [" + info.selectionText + "]" );
        console.log( "info: " + JSON.stringify(info));

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

        // Getting selected text in Firefox is supremely fucked up.\!
        // console.log( "info: " + JSON.stringify(info));
        // console.log( document.getSelection().toString() );
        // // window.getSelection().deleteFromDocument();
        // document.execCommand( "copy" )
        // var activeElement = document.activeElement;
        // console.log( "activeElement [" + JSON.stringify(activeElement ) + "]" );
        // console.log( "activeElement.value [" + activeElement.value + "]" );
        //
        // if (activeElement && activeElement.value) {
        //     // firefox bug https://bugzilla.mozilla.org/show_bug.cgi?id=85686
        //     console.log( "FF BUG? " + activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd) );
        // } else {
        //     console.log( document.getSelection().toString() );
        // }
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
        let url = genieInTheBoxServer + "/api/proofread?question=" + rawText

        console.log( "Calling genieInTheBoxServer [" + genieInTheBoxServer + "]..." );

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

        doTextToSpeech( "Done! Copied to clipboard." );

    } catch ( e ) {

        doTextToSpeech( "Unable to proofread that text, please see the error log." );
        console.log( "Error: " + e );
    }
}

fetchWhatsThisMean = async (info) => {

    console.log( "fetchWhatsThisMean() called..." )

    let url = genieInTheBoxServer + "/api/ask-ai-text?question=" + info.selectionText
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

    const audio = new Audio(encodedUrl);
    await audio.play();

    console.log( "doTextToSpeech() called... done!" )
}

function createNewTab( url ) {

    console.log( "createNewTab() called..." )
    browser.tabs.create( { url: url } );
}
browser.storage.onChanged.addListener( ( changes, areaName ) => {

    console.log( "background-context-menu.js: storage.onChanged() called..." )
    console.log( "changes: " + JSON.stringify( changes ) );
    console.log( "areaName: " + areaName );
    console.log( "lastUrl: " + lastUrl );

    if ( changes.lastUrl === undefined || changes.lastUrl === null ) {
        console.log( "lastUrl NOT set yet: " + lastUrl )
    } else if ( areaName === "local" && lastUrl !== changes.lastUrl.newValue ) {
        openNewTab( changes.lastUrl.newValue );
        lastUrl = changes.lastUrl.newValue;
    } else {
        console.log( "lastUrl NOT changed: " + lastUrl )
    }
} );
function openNewTab( url ) {
  console.log( "Opening new tab" );
   browser.tabs.create({
     "url": url
   });
}
browser.runtime.onMessage.addListener((message) => {

    console.log( "background-context-menu.js: Message.command received: " + JSON.stringify( message ) ) ;

    if ( message.command === "command-proofread" ) {

        console.log( "background-context-menu.js: command-proofread received" ) ;
        proofread( message.selectedText );

    } else if ( message.command === "command-copy" ) {

        doTextToSpeech( "Copied to clipboard." );

    } else if ( message.command === "command-open-new-tab" ) {

        console.log( "background-context-menu.js: command-open-new-tab received" ) ;
        browser.tabs.create( { url: message.url } );
    }

    // if (message.command === "transcribe" ) {
    //     // showRecorderPopup();
    // }
} );

console.log( "NEW!  background-context-menu.js loading... Done!" );