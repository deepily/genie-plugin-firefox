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

export async function loadContentScript() {

    console.log( "Loading content script..." );
    browser.tabs.executeScript( {file: "../js/content.js" } )
    .then( () => { console.log( "Loading content script... done!" ) } )
    .catch( reportExecuteScriptError );
}
function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
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
export function updateLocalStorageLastPaste( ts ) {

    console.log( "updateLocalStorageLastPaste()..." + ts  );
    browser.storage.local.set( {
        "lastPaste": ts
    } );
    return true;
}

export async function updateLocalStorageLastUrl( url, args="" ) {

    // add timestamp to url to force reload
    url = url + "?ts=" + Date.now() + args;

    console.log( "updateLocalStorageLastUrl()..." + url  );

    browser.storage.local.set( {
        "lastUrl": url
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