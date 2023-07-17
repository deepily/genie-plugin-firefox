console.log( "util.js: Loading..." );

export async function sendMessageToBackgroundScripts( command ) {

    console.log( "util.js calling background script command [" + command + "]" );
    // sends to background scripts
    let sending = browser.runtime.sendMessage( {
        command: command
    } );
}
export async function sendMessageToContentScripts( command ) {

    // sends to content scripts
    await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        console.log( "util.js calling content script in tab [" + tabs[ 0 ].id + "] command [" + command + "]" );
        await browser.tabs.sendMessage( tabs[ 0 ].id, {
            command: command
        } );
        return true;
    } );
}
export async function sendMessageToOneContentScript( tabId, command, extras="" ) {

    console.log( "calling content script in tab: " + tabId );
    await browser.tabs.sendMessage( tabId, {
        command: command,
        extras: extras
    });
}

export async function loadContentScript() {

    console.log( "Loading content script..." );
    browser.tabs.executeScript( {file: "../js/content.js" } )
    .then( () => { console.log( "Loading content script... done!" ) } )
    .catch( reportExecuteScriptError );
}
function getCurrentWindowTabs() {
  return browser.tabs.query( {currentWindow: true});
}
export function callOnActiveTab(callback) {

    console.log( "callOnActiveTab()..." );
    getCurrentWindowTabs().then((tabs) => {
        for (let tab of tabs) {
            if (tab.active) {
                callback(tab, tabs);
            }
        }
    });
}
export function getCurrentTab() {

    let queryingTabs = browser.tabs.query( {
        active: true,
        currentWindow: true
    });
    queryingTabs.then( ( tabs ) => {
        return tabs[ 0 ];
    });
    return queryingTabs;
}
export function queuePasteCommandInLocalStorage( ts ) {

    console.log( "queuePasteCommandInLocalStorage()..." + ts  );
    browser.storage.local.set( {
        "lastPaste": ts
    } );
    return true;
}

export async function queueNewTabCommandInLocalStorage( url, args="" ) {

    // add timestamp to url to force reload
    url = url + "?ts=" + Date.now() + args;

    console.log( "queueNewTabCommandInLocalStorage()..." + url  );

    browser.storage.local.set( {
        "lastUrlNewTab": url
    } );
    return true;
}
export async function queueCurrentTabCommandInLocalStorage( url, args="" ) {

    // add timestamp to url to force reload
    url = url + "?ts=" + Date.now() + args;

    console.log( "queueNewTabCommandInLocalStorage()..." + url  );

    browser.storage.local.set( {
        "lastUrlCurrentTab": url
    } );
    return true;
}
export async function queueHtmlInsertInLocalStorage( htmlToInsert ) {

    console.log( "queueHtmlInsertInLocalStorage()..." );

    browser.storage.local.set( {
        "lastHtmlToInsert": htmlToInsert
    } );
    return true;
}
// export const readFromLocalStorageWithDefault = async ( key, defaultValue ) => {
//
//     const keyValue = await browser.storage.local.get( key ).then( ( result ) => {
//         return result.key;
//     } );
//     if ( keyValue === undefined ) {
//         return defaultValue;
//     } else {
//         return keyValue;
//     }
// }
export const readFromLocalStorage = async (key, defaultValue ) => {
    return new Promise(( resolve, reject ) => {
        browser.storage.local.get( [ key ], function ( result ) {
            if (result[ key ] === undefined) {
                reject( defaultValue );
            } else {
                resolve( result[ key ] );
            }
        } );
    } );
}

export function handleOneFile() {

    const fileList = this.files;
    console.log( fileList[ 0 ] );
    let reader = new FileReader();
    reader.readAsDataURL( fileList[ 0 ] );
    reader.onload = function () {
        let rawBase64 = reader.result;
        let mimeType = rawBase64.split( "," )[ 0 ]
        let base64   = rawBase64.split( "," )[ 1 ]
        console.log( "mimeType:" + mimeType );
        let plainText = atob( base64 );
        console.log( "plainText:" + plainText.substring( 0, 32 ) + "..." );
        navigator.clipboard.writeText( plainText );
        sendMessageToContentScripts( "command-paste" )
    };
}

// From: https://stackoverflow.com/questions/9804777/how-to-test-if-a-string-is-json-or-not
export function isJson( str ) {
    try {
        JSON.parse( str );
    } catch ( e ) {
        return false;
    }
    return true;
}
console.log( "util.js: Loading... Done!" );