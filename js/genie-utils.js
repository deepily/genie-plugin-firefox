export function showRecorderPopup (info ){

    var popupURL = browser.runtime.getURL( "../html/recorder.html" );

    let creating = browser.windows.create( {
        url: popupURL,
        type: "popup",
        height: 15, // Browser will force this to be a certain Minimum height
        width: 280
    });
    creating.then(onCreated, onError);
};