console.log( "background-context-menu.js loading..." );

// ¡OJO! TODO: These constants should be declared globally and ultimately in a runtime configurable configuration service provided by the browser.
// ¡OJO! TODO: background-context-menu.js and recorder.js both make duplicate declarations of these constants.
const genieInTheBoxServer = "http://127.0.0.1:7999";
const ttsServer = "http://127.0.0.1:5002";

console.log( "NEW! background-context-menu.js loading... Done!" );
function onCreated() {
  if (browser.runtime.lastError) {
    console.log("error creating item:" + browser.runtime.lastError);
  } else {
    console.log("item created successfully");
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
browser.contextMenus.create({
  id: "radio-popup",
  title: "Popup",
  contexts: ["all"],
  checked: false
}, onCreated);

var makeItBlue = 'document.body.style.border = "5px solid blue"';
var makeItGreen = 'document.body.style.border = "5px solid green"';

// window.addEventListener('load', function ()  {
//     document.addEventListener('keypress', function (e) {
//         console.log( e );
//     }, true);
// }, false);

// const input = document.querySelector("input");
//
// input.addEventListener("keyup", logKey);
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
function showPopup ( info ){

    // // var popup = 'alert("Hello world!")';
    // var widgetWithFocus = document.activeElement;
    // console.log( "widgetWithFocus [" + widgetWithFocus + "]" );
    // console.log( "info.target [" + info.target + "]" );
    // document.activeElement.style.border = "5px solid blue";
    // console.log( document.getSelection().toString() );
    //
    // console.log( "info.selectionText [" + info.selectionText + "]" );
    //
    // // foo = window.getSelection().toString();
    // // console.log( "foo [" + foo + "]" );
    //
    // // document.getSelection().empty()
    // // info.selectionText = "";
    // // info.selectionText.deleteFromDocument()
    // if ( window.getSelection ) {
    //     console.log( "window.getSelection() [" + window.getSelection() + "]" );
    //     window.getSelection().removeAllRanges()
    // } else if ( document.selection ) {
    //     document.selection.empty();
    //     console.log( "document.selection [" + document.selection + "]" );
    // }

    var popupURL = browser.runtime.getURL( "../html/recorder.html" );

    let creating = browser.windows.create({
        url: popupURL,
        type: "popup",
        height: 15, // Browser will force this to be a certain Minimum height
        width: 250
    });
    creating.then(onCreated, onError);
};
browser.contextMenus.onClicked.addListener(function(info, tab) {
    // if (info.menuItemId == "radio-blue") {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItBlue
    //   });
    // } else if (info.menuItemId == "radio-green") {
    //   browser.tabs.executeScript(tab.id, {
    //     code: makeItGreen
    //   });
    // } else
    if (info.menuItemId == "radio-popup") {

        let selection = window.getSelection();
        console.log( "Menu clicked. selection [" + selection + "]" );
        selection.deleteFromDocument();

        browser.tabs.executeScript(tab.id, {
            code: showPopup( info )
        });
    }
});

console.log( "browser.commands.onCommand.addListener ..." )
browser.commands.onCommand.addListener((command) => {

    console.log( "command [" + command + "]" )

    if (command === "popup-vox-to-text") {
        console.log("Popping up recorder.html..." );
        showPopup( null )
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
//         console.log( "background-context-menu.js inserting CSS...[" + tab + "]");
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
//         console.log( "background-context-menu.js inserting CSS... Done!");
//     }, console.error )
// }
// browser.contextMenus.onClicked.addListener(async (info, tab) => {
//
//     if (info.menuItemId === "insert-modal") {
//
//         console.log("insert-modal clicked [" + info.selectionText + "]");
//         console.log("info: " + JSON.stringify(info));
//
//         insertModal(info);
//
//     } else if (info.menuItemId === "whats-this-mean") {
//
//         console.log("whats-this-mean clicked [" + info.selectionText + "]");
//         console.log("info: " + JSON.stringify(info));
//
//         console.log("calling fetchWhatsThisMean()...")
//         new Promise(function (resolve, reject) {
//
//             fetchWhatsThisMean(info).then((explanation) => {
//                 console.log("calling fetchWhatsThisMean()... done!")
//                 // console.log("explanation: " + explanation);
//                 // console.log( "calling doTextToSpeech()..." )
//                 // doTextToSpeech( explanation ).then( ( audio ) => {
//                 //     console.log( "calling doTextToSpeech()... done!" )
//                 // } );
//             });
//             // .then( ( response ) => {
//             //     response.text().then(respText => {
//             //         console.log("respText: " + respText );
//             //     });
//             // });
//
//             // doTextToSpeech( explanation )
//             // } else if ( info.menuItemId === "read-to-me" ) {
//             //
//             //     console.log( "read-to-me clicked [" + info.selectionText + "]" );
//             //     console.log( "info: " + JSON.stringify( info ) );
//             //
//             //     doTextToSpeech( info );
//             //
//             // }
//         });
//     }
// });
// insertModal = ( info ) => {
//
//     console.log( "insertModal() called..." )
//     insertCss()
// }

fetchWhatsThisMean = async (info) => {

    console.log("fetchWhatsThisMean() called...")

    let url = genieInTheBoxServer + "/api/ask-ai-text?question=" + info.selectionText
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

    // You know, this actually works, but I'm not going to use it because I can do it in two lines instead.

    // await fetch(url, {
    //     method: 'GET',
    //     headers: {'Access-Control-Allow-Origin': '*'}
    // }).then(async (response) => {
    //     console.log("response.status: " + response.status);
    //     await response.blob().then(async audioBlob => {
    //         const audioUrl = URL.createObjectURL(audioBlob);
    //         const audio = new Audio(audioUrl);
    //         console.log("Playing audio...");
    //         await audio.play();
    //         console.log("Playing audio... done?");
    //     })
    //
    // })

    console.log("doTextToSpeech() called... done!")
}

console.log( "NEW!  background-context-menu.js loading... Done!" );