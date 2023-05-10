console.log( "util.js: Loading..." );

export async function sendMessageToBackgroundScripts( command ) {

    // sends to background scripts
    let sending = browser.runtime.sendMessage( {
        command: command
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