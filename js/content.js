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

    browser.runtime.onMessage.addListener((message) => {

        console.log( "content.js: Message.command received: " + message.command ) ;

        if (message.command === "command-proofread") {
            selectedText = document.getSelection().toString()
            console.log( "content.js: selectedText: " + selectedText );

            if ( selectedText.length > 0 ) {
                navigator.clipboard.writeText( text ).then( () => {
                    console.log( "clipboard.writeText() Success!" );
                }, () => {
                    console.log( "clipboard.writeText() Failure!" );
                } );
            } else {
                console.log( "content.js: No text selected! Proofreading from clipboard." );
            }
        } else if (message.command === "command-paste") {

            console.log( "content.js: Pasting from clipboard?" );
            navigator.clipboard.readText().then( (text) => {
                console.log( "clipboard.readText() text: " + text );
            }, () => {
                console.log( "clipboard.readText() Failure!" );
            } );
        }
    } );
    // function showRecorderPopup ( info ){
    //
    //     console.log( "showRecorderPopup() called... " )
    //     var popupURL = browser.runtime.getURL( "../html/recorder.html" );
    //
    //     let creating = browser.runtime.create({
    //         url: popupURL,
    //         type: "popup",
    //         height: 15, // Browser will force this to be a certain Minimum height
    //         width: 280
    //     });
    //     // creating.then( onCreated = () => {
    //     //     console.log("Created");
    //     // }, onError = ( error ) => {
    //     //     console.log(`Error: ${error}`);
    //     // });
    //     console.log( "showRecorderPopup() called... Done!" )
    // };
    console.log( "content.js loading... Done!" );
})();