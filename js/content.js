// import { MODE_AGENT, MODE_COMMAND, MODE_TRANSCRIPTION } from "./constants";
// copied verbatim from the constant file since I can't import them here!!!
const MODE_TRANSCRIPTION       = "transcription mode";
const MODE_COMMAND             = "command-mode";
const MODE_AGENT               = "agent mode";

let lastKey   = "";
let lastCode  = "";

(function() {

    console.log( "content.js loading..." );
    /**
    * Check and set a global guard variable.
    * If this content script is injected into the same page again,
    * it will do nothing next time.
    */
    // TODO: This may be the cause of the content script not being reloaded when moving backwards and forward through the history queue.
    if (window.hasRun) {
        console.log( "content.js loading... already loaded. Bailing early!" );
        return;
    }
    window.hasRun = true;

    window.addEventListener( "click", function(event) {
        handleWindowClick(event);
    }, false );

    async function handleWindowClick(event) {

        var origEl = event.target || event.srcElement;

        if ( origEl.tagName === 'A' || origEl.parentNode.tagName === 'A' ) {
            var eventHref = "";
            if ( origEl.href != undefined ) {
                eventHref = origEl.href;
            } else {
                eventHref = origEl.parentNode.href;
            }
            const mode = await browser.storage.local.get( "linkMode" ).then( ( result ) => {
                return result.linkMode;
            } );
            console.log( "linkMode is [" + mode + "]" );
            const newTab = mode === "new tab";
            console.log( "newTab is [" + newTab + "]" );
            if ( mode === "new tab" ) {
                queueNextUrlInLocalStorage( eventHref );
                console.log( "Link clicked, canceling & redirecting to a new tab: " + eventHref );
                event.preventDefault();
            } else {
                console.log( "Link clicked, loading to the same tab: " + eventHref );
            }
        }
    }
    // TODO: move to util.js & find a way to import without the errors I've been getting when I try to do that.
    async function queueNextUrlInLocalStorage( url ) {

        // add timestamp to url to force reload
        browser.storage.local.set( {
            "lastUrlNewTab": url + "?ts=" + Date.now()
        } );
        return true;
    }
    document.addEventListener( "selectionchange", () => {

        // console.log( document.getSelection().toString() );
        if ( document.getSelection().toString() !== "" ) {
            // console.log( "selectionchange event detected: empty selection" );
        // } else {
            console.log( "Auto copying to the clipboard [" + document.getSelection().toString() + "]" );
            copyToClipboard( document.getSelection().toString() );
        }
    });

    document.body.addEventListener( "keydown", (event) => {

        // console.log( "event.metaKey is [" + event.metaKey + "] and keydown.key is [" + event.key + "] and the code is [" + event.code + "]" );
        // console.log( "lastKey is [" + lastKey + "] and the lastCode is [" + lastCode + "]" );

        // Capture clover C, X or V keys
        if ( event.metaKey && ( event.key === "x" || event.key === "c" || event.key === "v" ) ) {
            // Cancel the event
            event.preventDefault();
            console.log( "Background: Clover C, X or V detected AND cancelled" );
        } else if ( event.code === "F8" ) {
            console.log( "Background: F8 detected" );
            document.execCommand( 'cut' )
            event.preventDefault();
        } else if ( event.code === "F9" ) {
            console.log( "Background: F9 detected" );
            document.execCommand( 'copy' )
            event.preventDefault();
        } else if ( event.code === "F10" ) {
            console.log( "Background: F10 detected" );
            paste()
            event.preventDefault();
        }

        if ( event.metaKey && event.altKey && [ "OSRight", "AltRight" ].includes( event.code ) ) {
            console.log( "Background: Right command + right option combination detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": MODE_AGENT
            } );
        } else if ( event.key === "Alt" && event.code === "AltRight" && lastKey === "Meta" && lastCode === "MetaRight" ) {
            console.log( "Background: MetaRight and AltRight keydown sequence detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": MODE_AGENT
            } );
        } else if ( event.key === "Meta" && event.code === "MetaRight" && lastKey === "Meta" && lastCode === "MetaRight" ) {
            console.log( "Background: Double MetaRight keydown detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": MODE_TRANSCRIPTION
            });
        } else if ( event.key === "Alt" && event.code === "AltRight" && lastKey === "Alt" && lastCode === "AltRight" ) {
            console.log( "Background: Double AltRight keydown detected" );
            lastKey = "";
            lastCode = "";
            browser.runtime.sendMessage( {
                "command": MODE_COMMAND
            } );
        } else {
            // console.log( "Not a double MetaRight nor AltRight keydown" );
            lastKey = event.key;
            lastCode = event.code;
        }
    });

    console.log( "content.js loading... onMessage event listener..." );
    browser.runtime.onMessage.addListener( async ( request, sender, sendResponse ) => {

        console.log( "content.js: Message.command received: " + JSON.stringify( request.command ) );

        if ( request.command === "command-append-html-to-body" ) {

            console.log( "content.js: Appending to body: " + request.extras );

            //Create the element using the createElement method.
            var newDiv = document.createElement( "div" );

            newDiv.style = "margin: 50px auto; max-width: 840px; font-family: monospace; border-style: solid; border-width: 1px; border-color: #cccccc; padding: 10px;";

            //Set its unique ID.
            newDiv.id = 'div-id-' + Date.now();

            //Add your content to the DIV
            newDiv.innerHTML = "<pre>" + request.extras + "</pre>";

            //Finally, append the element to the HTML body
            document.body.appendChild( newDiv );

        } else if ( request.command === "command-select-all" ) {

            document.execCommand( "selectAll" );

        } else if ( request.command === "command-copy" ) {

            var selectedText = document.getSelection().toString()

            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": request.command
            } );

        } else if ( request.command === "command-cut" ) {

            var selection = document.getSelection()
            
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

        } else if ( request.command === "tab-back" ) {

            console.log( "tab-back" )
            try {
                console.log( "tabs-back: history: " + history.length )
                console.log( JSON.stringify( history ) );
                history.back();
                console.log( "tabs-back: history: " + history.length )
            } catch (e) {
                console.log( "tabs-back: Can't go back any further: " + e );
            }

        } else if ( request.command === "tab-forward" ) {

            console.log( "tab-forward" )
            try {
                console.log( "tabs-forward: history: " + history.length )
                console.log( JSON.stringify( history ) );
                history.forward();
                console.log( "tabs-forward: history: " + history.length )
            } catch (e) {
                console.log( "tabs-forward: Can't go forward any further: " + e );
            }
        // Reload page
        } else if ( request.command === "tab-refresh" ) {

            console.log( "tab-refresh" )
            window.location.reload();

        } else if ( request.command === "load-url" ) {

            console.log( "request.command: " + request.command )
            window.location = request.extras;

        } else {
            console.log( "content.js: Unknown command: " + JSON.stringify( request.command ) );
        }
    } );
    console.log( "content.js loading... onMessage event listener... Done!" );

    function getCurrentWindowTabs() {
        return browser.tabs.query( {currentWindow: true});
    }
    function callOnActiveTab(callback) {

        console.log( "callOnActiveTab()..." );
        getCurrentWindowTabs().then((tabs) => {
            for (let tab of tabs) {
                if (tab.active) {
                    callback(tab, tabs);
                }
            }
        });
    }

    function paste( text ) {

        console.log( "paste() called..." );
        // set up a try and catch block for this deprecated call
        try {
            document.execCommand( 'paste' )
        } catch ( e ) {
            console.log( "document.execCommand( 'paste' ): " + e );
        }
        // disable the entire block below to see what happens when we use the deprecating call everywhere
        //
        // var selection = document.getSelection()
        //
        // // test for selection before attempting to delete it: https://stackoverflow.com/questions/22935320/uncaught-indexsizeerror-failed-to-execute-getrangeat-on-selection-0-is-not
        // if ( selection.rangeCount ) {
        //     console.log( "selection.rangeCount: " + JSON.stringify( selection.rangeCount ) );
        //     selection.deleteFromDocument()
        // }
        // try {
        //
        //     // TODO 1: Find a way to move the cursor to the end of the paste
        //     // TODO 2: This paste command attempts to paste in all documents, not just the current document. The problem
        //     //  Is you can't access a reference to the current tab within a content tab, which is kind of weird...
        //     selection = document.getSelection()
        //     selection.getRangeAt(0 ).insertNode( document.createTextNode( text + " " ) )
        //     selection.removeAllRanges()
        //
        //     console.log( "paste() successful!" );
        // } catch ( e ) {
        //     console.log( "paste() failed: " + e );
        // }
    }
    function pasteFromClipboard(){
        document.execCommand( "paste" )
    }
    function pasteIntoTab( text, tabId ) {

        console.log( "pasteIntoTab() called..." );
        const activeDocument = browser.tabs[ tabId ].document
        var selection = activeDocument.getSelection()

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
    console.log( "content.js loading... Done!" );
} )();