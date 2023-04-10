// import "genie-utils.js"

window.addEventListener( "DOMContentLoaded", (event) => {
    document.getElementById("option-1").addEventListener("click", (event) => {
        // alert("option-1")
        showRecorderPopup()
    } );
    document.getElementById("option-1").focus()
} );
// capture key events
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
        console.log("ArrowDown")
    }
    if (event.key === "ArrowUp") {
        console.log("ArrowUp")
    }
} );

function showRecorderPopup (info ){

    var popupURL = browser.runtime.getURL( "../html/recorder.html" );

    let creating = browser.windows.create({
        url: popupURL,
        type: "popup",
        height: 15, // Browser will force this to be a certain Minimum height
        width: 280
    });
    creating.then(onCreated, onError);
};
