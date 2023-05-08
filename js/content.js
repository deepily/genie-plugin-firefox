// import {
//     popupRecorder
// } from "./menu-and-side-bar.js";

let lastKey   = "";
let lastCode  = "";

(function() {
    console.log( "content.js loading..." );

    /**
    * Check and set a global guard variable.
    * If this content script is injected into the same page again,
    * it will do nothing next time.
    */
    if (window.hasRun) {
        console.log( "content.js loading... already loaded. Bailing early!" );
        return;
    }
    window.hasRun = true;

    document.addEventListener("selectionchange", () => {

        // console.log( document.getSelection().toString() );
        if ( document.getSelection().toString() !== "" ) {
            // console.log( "selectionchange event detected: empty selection" );
        // } else {
            console.log( "Auto copying to the clipboard [" + document.getSelection().toString() + "]" );
            copyToClipboard( document.getSelection().toString() );
        }
    });

    document.body.addEventListener( "keydown", (event) => {

        // console.log( "keydown.key is [" + event.key + "] and the code is [" + event.code + "]" );
        // console.log( "lastKey is [" + lastKey + "] and the lastCode is [" + lastCode + "]" );

        if ( event.key === "Meta" && event.code === "OSRight" && lastKey === "Meta" && lastCode === "OSRight" ) {
            console.log( "Background: Double OSRight keydown detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": "command-transcription"
            } );
        } else {
            // console.log( "Not a double MetaRight keydown" );
            lastKey = event.key;
            lastCode = event.code;
        }
    });

    // console.log( "content.js loading... Adding event listeners..." );
    // document.addEventListener( "focus", (event) => {
    //     console.log( "focus event detected: " + JSON.stringify( event ) );
    //     console.log( "content.js: FOCUS event.target: " + JSON.stringify( event.target ) ) ;
    //     console.log( "content.js: FOCUS active element: " + JSON.stringify( document.activeElement ) ) ;
    // } );
    // document.addEventListener( "blur", (event) => {
    //     console.log( "blur event detected: " + JSON.stringify( event ) );
    //     console.log( "content.js: BLUR event.target: " + JSON.stringify( event.target ) ) ;
    //     console.log( "content.js: BLUR active element: " + JSON.stringify( document.activeElement ) );
    // } );
    // console.log( "content.js loading... Adding event listeners... Done!" );

    // var inputs, index;
    //
    // console.log( "content.js: Inputs..." );
    // inputs = document.getElementsByTagName('input');
    // for ( index = 0; index < inputs.length; ++index ) {
    //     console.log( "input: " + inputs[ index ].id + " has focus " + ( inputs[ index ] === document.activeElement ) );
    // }
    // console.log( "content.js: Inputs... done!" );
    //
    // document.addEventListener( "click", async (e) => {
    //    console.log( "click detected: " + e.target );
    //    console.log( "click detected: " + e.target.id );
    // } )


    browser.runtime.onMessage.addListener(async ( request, sender, sendResponse ) => {

        console.log( "content.js: Message.command received: " + request.command);

        if ( request.command === "command-copy" ) {

            selectedText = document.getSelection().toString()

            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": request.command
            } );

        } else if ( request.command === "command-cut" ) {

            selection = document.getSelection()
            
            await copyToClipboard( selection.toString() );
            selection.deleteFromDocument()
            
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": request.command
            } );
            
        } else if ( request.command === "command-delete" ) {

            document.getSelection().deleteFromDocument()
            
        } else if ( request.command === "command-paste" ) {

            console.log( "content.js: Pasting from clipboard?" );
            const clipboardText = await navigator.clipboard.readText()
            console.log( "content.js: clipboardText: " + clipboardText );
            paste( clipboardText );

        } else if ( request.command === "command-proofread" ) {

            console.log( JSON.stringify( request ) );
            selectedText = document.getSelection().toString()
            await copyToClipboard( selectedText );
            sendResponse( "Hi from content script! Text copied to clipboard" );
            // let response = Promise.resolve({ response: "Hi from content script! Text copied to clipboard" } );
            // return response;
            // browser.runtime.sendMessage( {
            //     "selectedText": selectedText,
            //     "command": message.command
            // } );

        } else if ( request.command === "command-open-new-tab" ) {

            console.log( "content.js: Opening new tab..." );
            // browser.tabs.create( {url: message.url } );
            let backgroundPage = await window.runtime.getBackgroundPage();
            backgroundPage.createNewTab();

        } else if ( request.command === "tabs-back" ) {

            console.log( "tabs-back" )
            //
            // function onGot(historyItems) {
            //     for (const item of historyItems) {
            //         console.log(item.url);
            //         console.log(new Date(item.lastVisitTime));
            //     }
            // }
            //
            // history.search({ text: "" }).then( onGot );
            //
            // let searching = await history.search( "" );
            // console.log( "tabs-back: searching: " + searching );
            // console.log( "tabs-back: history: " + history.length )
            // console.log( JSON.stringify( history ) );
            try {
                console.log( "tabs-back: history: " + history.length )
                console.log( JSON.stringify( history ) );
                history.back();
                console.log( "tabs-back: history: " + history.length )
            } catch (e) {
                console.log( "tabs-back: Can't go back any further: " + e );
            }

        } else if ( request.command === "tabs-forward" ) {

            console.log( "tabs-forward" )
            try {
                console.log( "tabs-forward: history: " + history.length )
                console.log( JSON.stringify( history ) );
                history.forward();
                console.log( "tabs-forward: history: " + history.length )
            } catch (e) {
                console.log( "tabs-forward: Can't go forward any further: " + e );
            }
        // Reload page
        } else if ( request.command === "tabs-reload" ) {

            console.log( "tabs-reload" )
            window.location.reload();

        } else {
            console.log( "content.js: Unknown command: " + request.command );
        }
    } );

    function paste( text ) {

        console.log( "paste() called..." );
        selection = document.getSelection()
        if ( selection.rangeCount ) {
            selection.deleteFromDocument()
        }
        selection.getRangeAt(0).insertNode(document.createTextNode( text ) )
    }
    //
    // create a function that copies the parameter text to the clipboard
    async function copyToClipboard( selectedText) {

        if (selectedText.length > 0) {
            const writeCmd = await navigator.clipboard.writeText( selectedText );
            console.log( "clipboard.writeText() Success!" );
        } else {
            console.log( "content.js: No text selected!" );
        }
    }
    console.log( "content.js loading... Done!" );
} )();