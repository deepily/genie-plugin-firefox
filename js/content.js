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

    browser.runtime.onMessage.addListener(async (message) => {

        console.log("content.js: Message.command received: " + message.command);

        if (message.command === "command-copy") {

            selectedText = document.getSelection().toString()
            // console.log("content.js: selectedText: " + selectedText);
            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "text": selectedText,
                "command": message.command
            } );

        } else if ( message.command === "command-proofread") {

            selectedText = document.getSelection().toString()
            // console.log("content.js: selectedText: " + selectedText);
            await copyToClipboard( selectedText );
            browser.runtime.sendMessage( {
                "selectedText": selectedText,
                "command": message.command
            } );

        } else if (message.command === "command-paste") {

            console.log("content.js: Pasting from clipboard?");
            navigator.clipboard.readText().then((text) => {
                console.log("clipboard.readText() text: " + text);
            }, () => {
                console.log("clipboard.readText() Failure!");
            });
        }
    } );
    //
    // create a function that copies the parameter text to the clipboard
    async function copyToClipboard( selectedText) {

        if (selectedText.length > 0) {
            const writeCmd = await navigator.clipboard.writeText(selectedText);
            console.log("clipboard.writeText() Success!");
        } else {
            console.log("content.js: No text selected!");
        }
    }

    // function popupRecorder( mode ) {
    //
    //     let url = "../html/recorder.html?mode=" + mode;
    //
    //     let createData = {
    //         url: url,
    //         type: "popup",
    //         height: 15, // Browser will force this to be a certain Minimum height
    //         width: 280
    //     };
    //     let creating = navigator..windows.create(createData);
    // }
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
    // console.log( "content.js loading... Done!" );
})();