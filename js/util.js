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
export function getCurrentTab() {

    let queryingTabs = browser.tabs.query({
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

export async function queueNewTabCommandInLocalStorage(url, args="" ) {

    // add timestamp to url to force reload
    url = url + "?ts=" + Date.now() + args;

    console.log( "queueNewTabCommandInLocalStorage()..." + url  );

    browser.storage.local.set( {
        "lastUrl": url
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
console.log( "util.js: Loading... Done!" );