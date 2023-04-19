(function() {
    console.log( "content.js loading..." );

    /**
    * Check and set a global guard variable.
    * If this content script is injected into the same page again,
    * it will do nothing next time.
    */
    if (window.hasRun) {
        console.log( "content.js loading... Bailing early!" );
        return;
    }
    window.hasRun = true;

    console.log( "content.js loading... Adding event listeners..." );
    document.addEventListener( "focus", (event) => {
        console.log( "focus event detected: " + JSON.stringify( event ) );
        console.log( "content.js: FOCUS event.target: " + JSON.stringify( event.target ) ) ;
        console.log( "content.js: FOCUS active element: " + JSON.stringify( document.activeElement ) ) ;
    } );
    document.addEventListener( "blur", (event) => {
        console.log( "blur event detected: " + JSON.stringify( event ) );
        console.log( "content.js: BLUR event.target: " + JSON.stringify( event.target ) ) ;
        console.log( "content.js: BLUR active element: " + JSON.stringify( document.activeElement ) );
    } );
    console.log( "content.js loading... Adding event listeners... Done!" );

    var inputs, index;

    console.log( "content.js: Inputs..." );
    inputs = document.getElementsByTagName('input');
    for ( index = 0; index < inputs.length; ++index ) {
        console.log( "input: " + inputs[ index ].id + " has focus " + ( inputs[ index ] === document.activeElement ) );
    }
    console.log( "content.js: Inputs... done!" );

    document.addEventListener( "click", async (e) => {
       console.log( "click detected: " + e.target );
       console.log( "click detected: " + e.target.id );
    } )

    browser.runtime.onMessage.addListener(async ( message) => {

        console.log( "content.js: Message.command received: " + message.command);

        console.log( "content.js: active element: " + document.activeElement );

        if ( message.command === "command-copy" ) {

            selectedText = document.getSelection().toString()

            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": message.command
            } );

        } else if ( message.command === "command-cut" ) {

            selection = document.getSelection()
            
            await copyToClipboard( selection.toString() );
            selection.deleteFromDocument()
            
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": message.command
            } );
            
        } else if ( message.command === "command-delete" ) {

            document.getSelection().deleteFromDocument()
            
        } else if ( message.command === "command-paste" ) {

            console.log( "content.js: Pasting from clipboard?" );
            const clipboardText = await navigator.clipboard.readText()
            console.log( "content.js: clipboardText: " + clipboardText );
            paste( clipboardText );

            // selection = document.getSelection()
            // if ( selection.rangeCount ) {
            //     selection.deleteFromDocument()
            // }
            // selection.getRangeAt(0).insertNode(document.createTextNode(clipboardText) )

        } else if ( message.command === "command-proofread" ) {

            selectedText = document.getSelection().toString()
            // console.log( "content.js: selectedText: " + selectedText);
            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "selectedText": selectedText,
                "command": message.command
            } );

        } else if ( message.command === "command-open-new-tab" ) {

            console.log( "content.js: Opening new tab..." );
            // browser.tabs.create( {url: message.url } );
            let backgroundPage = await window.runtime.getBackgroundPage();
            backgroundPage.createNewTab();

        } else {
            console.log( "content.js: Unknown command: " + message.command );
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


    // console.log( "content.js loading... Done!" );
} )();