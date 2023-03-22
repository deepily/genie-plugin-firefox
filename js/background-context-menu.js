console.log( "background-context-menu.js loading..." );
browser.contextMenus.create({
        id: "whats-this-mean",
        title: "What's this mean?",
        contexts: ["selection"]
    },
    // See https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/#event-pages-and-backward-compatibility
    // for information on the purpose of this error capture.
    () => void browser.runtime.lastError,
);

browser.contextMenus.onClicked.addListener((info, tab) => {

    if ( info.menuItemId === "whats-this-mean" ) {

        console.log( "whats-this-mean clicked [" + info.selectionText + "]" );
        console.log( "info: " + JSON.stringify( info ) );

        let url = "http://127.0.0.1:5000/api/ask-ai-text?question=" + info.selectionText
        const encoded = encodeURI( url );
        console.log( "encoded: " + encoded );
        fetch( encoded, {
            method: 'GET',
            headers: { 'Access-Control-Allow-Origin': '*' }
        } )
        .then( console.log( "fetch returned" ) )
        .then( ( response) => {
            console.log( "response.status: " + response.status );
            response.text().then( respText => {
                console.log( "respText: " + respText )
                let urlBlob = URL.createObjectURL( new Blob([ respText ] ) )

                wLeft = window.screenLeft ? window.screenLeft : window.screenX;
                wTop = window.screenTop ? window.screenTop : window.screenY;

                const width = 320;
                const height = 200;
                const left = wLeft + (window.innerWidth / 2) - ( width / 2);
                const top = wTop + (window.innerHeight / 2) - ( height / 2);
                browser.windows.create({
                    type: 'popup',
                    url: urlBlob,
                    width: width,
                    height: height,
                    left: left,
                    top: top
                });
            } )
        } )
        .then( ( data) => console.log( data ) );
    }
});
console.log( "background-context-menu.js loading... Done!" );