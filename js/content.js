// import { TRANSCRIPTION_MODE, COMMAND_MODE } from "./constants";

let lastKey   = "";
let lastCode  = "";
let lastPaste = "";

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

        console.log( "keydown.key is [" + event.key + "] and the code is [" + event.code + "]" );
        // console.log( "lastKey is [" + lastKey + "] and the lastCode is [" + lastCode + "]" );

        if ( event.key === "Meta" && event.code === "OSRight" && lastKey === "Meta" && lastCode === "OSRight" ) {
            console.log("Background: Double OSRight keydown detected");
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage({
                "command": "command-transcription"
            });
        } else if ( event.key === "Alt" && event.code === "AltRight" && lastKey === "Alt" && lastCode === "AltRight" ) {
            console.log( "Background: Double AltRight keydown detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": "command-mode"
            } );
        } else {
            // console.log( "Not a double MetaRight nor AltRight keydown" );
            lastKey = event.key;
            lastCode = event.code;
        }
    });

    console.log( "content.js loading... onMessage event listener..." );
    browser.runtime.onMessage.addListener( async ( request, sender, sendResponse ) => {

        console.log( "content.js: Message.command received: " + request.command);

        if ( request.command === "command-select-all" ) {

            document.execCommand( "selectAll" );

        } else if ( request.command === "command-copy" ) {

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

        } else if ( request.command === "command-open-new-tab" ) {

            console.log( "content.js: Opening new tab..." );
            let backgroundPage = await window.runtime.getBackgroundPage();
            backgroundPage.createNewTab();

        } else if ( request.command === "tabs-back" ) {

            console.log( "tabs-back" )
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
    console.log( "content.js loading... onMessage event listener... Done!" );

    console.log( "content.js loading... onChanged event listener..." );
    browser.storage.onChanged.addListener( async (changes, areaName ) => {

        console.log( "content.js: storage.onChanged() called..." )
        // console.log( "changes: " + JSON.stringify(changes));
        // console.log( "areaName: " + areaName);
        // console.log( "lastPaste: " + lastPaste );

        if (changes.lastPaste === undefined) {
            console.log( "lastPaste NOT defined: " + lastPaste)
        } else if (areaName === "local" && lastPaste != changes.lastPaste.newValue) {

            lastPaste = changes.lastPaste.newValue;
            console.log( "lastPaste updated, sending message to paste from clipboard..." );

            const clipboardText = await navigator.clipboard.readText()
            paste( clipboardText )
            // const tabId = await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
            //     return tabs[ 0 ].id;
            // } );
            // pasteIntoTab( clipboardText, tabId )

        } else {
            console.log( "lastPaste NOT changed: " + lastUrl)
        }
        // console.log( "lastPaste: " + lastPaste);
    } );
    console.log( "content.js loading... onChanged event listener... Done!" );

    function paste( text ) {

        console.log( "paste() called..." );
        selection = document.getSelection()

        // test for selection before attempting to delete it
        if ( selection.rangeCount ) {
            console.log( "selection.rangeCount: " + JSON.stringify( selection.rangeCount ) );
            selection.deleteFromDocument()
        }
        // Test to make sure we can insert: https://stackoverflow.com/questions/22935320/uncaught-indexsizeerror-failed-to-execute-getrangeat-on-selection-0-is-not
        // if ( selection.rangeCount > 0 ) {
        try {

            // TODO 1: Find a way to move the cursor to the end of the paste
            // TODO 2: This paste command attempts to paste in all documents, not just the current document. The problem
            //  Is you can't access a reference to the current tab within a content tab, which is kind of weird...
            selection = document.getSelection()
            selection.getRangeAt(0 ).insertNode( document.createTextNode( text ) )
            // selection.setSelectionRange( selection.focusNode.length, selection.focusNode.length )
            selection.removeAllRanges()
            // document.getSelection().setPosition( null, text.length );

            console.log( "paste() successful!" );
        } catch ( e ) {
            // console.log( "paste() failed: " + e );
        }
        // } else {
        //     console.log( "CANNOT paste() in this document, selection.rangeCount: " + selection.rangeCount );
        // }
    }
    function pasteIntoTab( text, tabId ) {

        console.log( "pasteIntoTab() called..." );
        const activeDocument = browser.tabs[ tabId ].document
        selection = activeDocument.getSelection()

        // test for selection before attempting to delete it
        if ( selection.rangeCount ) {
            selection.deleteFromDocument()
        }
        // Test to make sure we can insert: https://stackoverflow.com/questions/22935320/uncaught-indexsizeerror-failed-to-execute-getrangeat-on-selection-0-is-not
        if ( selection.rangeCount > 0 ) {
            selection.getRangeAt(0).insertNode(activeDocument.createTextNode(text))
        } else {
            console.log( "pasteIntoTab() failed: selection.rangeCount: " + selection.rangeCount );
        }
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

    function foo( bar ) {
        console.log( "foo(): " + bar );
    }
    console.log( "content.js loading... Done!" );
} )();