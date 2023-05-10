console.log( "util.js: Loading..." );

export async function sendMessageToBackgroundScripts( command ) {

    // sends to background scripts
    let sending = browser.runtime.sendMessage( {
        command: command
    } );
}
export async function sendMessageToContentScripts( command ) {

    // sends to content scripts
    await browser.tabs.query( {currentWindow: true, active: true} ).then(async (tabs) => {
        let tab = tabs[0];
        await browser.tabs.sendMessage( tab.id, {
            command: command
        } );
        return true;
    } );
}

export function updateLocalStorageLastPaste( ts ) {

    console.log( "updateLocalStorageLastPaste()..." + ts  );
    browser.storage.local.set( {
        "lastPaste": ts
    } );
    return true;
}

export const readLocalStorage = async (key, defaultValue ) => {
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
console.log( "util.js: Loading... Done!" );