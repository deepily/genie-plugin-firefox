console.log( "background.js loading..." );
//
// // ¡OJO! TODO: These constants should be declared globally and ultimately in a runtime configurable configuration service provided by the browser.
// // ¡OJO! TODO: background-context-menu.js and recorder.js both make duplicate declarations of these constants.
// const genieInTheBoxServer = "http://127.0.0.1:7999";
// const ttsServer = "http://127.0.0.1:5002";




/*
Add openMyPage() as a listener to clicks on the browser action.
*/
// browser.browserAction.onClicked.addListener( console.log( "browserAction.onClicked" ) );


//
// console.log( "NEW! background.js loading... Done!" );
// function onCreated() {
//   if (browser.runtime.lastError) {
//     console.log("error creating item:" + browser.runtime.lastError);
//   } else {
//     console.log("item created successfully");
//   }
// }
// function onError() {
//     console.log( "Error:" + browser.runtime.lastError );
// }
//
// window.addEventListener("DOMContentLoaded", (event) => {
//
//     console.log( "DOM fully loaded and parsed, Setting up form event listeners..." );
//
//     console.log( "window [" + window + "]" );
//     console.log( "document [" + document + "]" );
//     console.log( "window.document [" + window.document + "]" );
//     console.log( "window.document.getElementsByClassName( 'form' ) [" + window.document.getElementsByClassName("form" ) + "]" );
//
//     let forms = window.document.getElementsByClassName("form")
//     console.log( "forms.length [" + forms.length + "]" );
//     for ( let i = 0; i < forms.length; i++ ) {
//         console.log( "form [" + forms[ i ] + "]" );
//     }
//
//     const form = window.document.getElementsByClassName("form");
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
// //
// // function showPopup ( info ){
// //
// //     var popupURL = browser.runtime.getURL( "../html/recorder.html" );
// //
// //     let creating = browser.windows.create({
// //         url: popupURL,
// //         type: "popup",
// //         height: 15, // Browser will force this to be a certain Minimum height
// //         width: 250
// //     });
// //     creating.then(onCreated, onError);
// // };
//
//
//
console.log( "NEW!  background.js loading... Done!" );