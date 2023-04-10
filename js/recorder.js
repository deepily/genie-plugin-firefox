console.log( "recorder.js loading..." );

tempMode = localStorage.getItem( "mode" );
if ( tempMode == null ) {
    currentMode = "transcription";
} else {
    currentMode = tempMode;
}
console.log( "currentMode [" + currentMode + "]" );

// ¡OJO! TODO: These constants should be declared globally and ultimately in a runtime configurable configuration service provided by the browser.
// ¡OJO! TODO: background-context-menu.js and recorder.js both make duplicate declarations of these constants.
const ttsServer = "http://127.0.0.1:5002";
const genieInTheBoxServer = "http://127.0.0.1:7999";

function formatter() {
  document.body.style.backgroundColor = "pink";
  document.body.style.border = "2px dotted red";
  document.body.style.padding = "8px";
}

document.getElementById( "record" ).addEventListener( "click", formatter );

// let stream = "";
window.addEventListener( "DOMContentLoaded", (event) => {

    console.log( "DOM fully loaded and parsed, Checking permissions...." );
    document.getElementById('record').click()

    navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
    .then( ( stream ) => {
        console.log( "Microphone available" )
    },
    e => {
        console.log( "Microphone NOT available" )
    } );
    console.log( "DOM fully loaded and parsed, Checking permissions.... Done!" );
});
window.addEventListener( "keydown", function (event) {

    console.log( "event [" + event + "]" );
    console.log( "event.key [" + event.key + "]" );
    if ( event.key == "Escape" ) {
        console.log( "Escape pressed" );
        document.body.style.backgroundColor = "white";
        document.body.innerText = "Exiting...";
        window.setTimeout( () => {
            window.close();
        }, 250 );
    }
    // if ( event.ctrlKey && event.key == "r" ) {
    //   console.log( "'Ctrl r' pressed" );
    //   document.getElementById('record').click();
    // } else if ( event.ctrlKey && event.key == "s" ) {
    //   console.log( "'Ctrl s' pressed" );
    //   document.getElementById('stop').click();
    //   console.log( "Key pressed [" + event.key + "]" );
    // } else if ( event.ctrlKey && event.key == "p" ) {
    //   console.log( "Ctrl 'p' pressed" );
    //   document.getElementById('play').click();
    // } else if ( event.ctrlKey && event.key == "t" ) {
    //   console.log( "'Ctrl t' pressed" );
    //   document.getElementById('save').click();
    // }
});

const recordAudio = () =>
    new Promise(async resolve => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];

      mediaRecorder.addEventListener('dataavailable', event => {
        audioChunks.push(event.data);
      });

      const start = () => {
        audioChunks = [];
        mediaRecorder.start();
        // document.getElementById('record').hidden = true;
        document.getElementById('stop').focus();
      };

      const stop = () =>
        new Promise(resolve => {
          mediaRecorder.addEventListener('stop', () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            const play = () => audio.play();
            resolve({ audioChunks, audioBlob, audioUrl, play });
          });

          mediaRecorder.stop();
        });

      resolve({ start, stop });
    });

// const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const recordButton = document.querySelector('#record');
const stopButton = document.querySelector('#stop');
const playButton = document.querySelector('#play');
const saveButton = document.querySelector('#save');

let recorder;
let audio;

recordButton.addEventListener('click', async () => {

    document.body.style.backgroundColor = "pink";
    document.body.style.border = "2px dotted red";
    ``
    recordButton.setAttribute('disabled', true);
    stopButton.removeAttribute('disabled');
    stopButton.focus();
    playButton.setAttribute('disabled', true);
    saveButton.setAttribute('disabled', true);
    if (!recorder) {
      recorder = await recordAudio();
    }
    recorder.start();
});

stopButton.addEventListener('click', async () => {

    document.body.style.backgroundColor = "white";
    document.body.style.border = "2px solid white";

    recordButton.removeAttribute('disabled');
    stopButton.setAttribute('disabled', true);
    playButton.removeAttribute('disabled');
    saveButton.removeAttribute('disabled');
    saveButton.focus();
    audio = await recorder.stop();
});

playButton.addEventListener('click', () => {
    audio.play();
});

saveButton.addEventListener('click', async () => {

    const url = genieInTheBoxServer + "/api/upload-and-transcribe-mp3"
    console.log( "Attempting to upload and transcribe to url [" + url + "]" )

    try {
        const result = await readBlobAsDataURL( audio.audioBlob )
        console.log( "result [" + typeof result + "]" );
        console.log( "result.split(',')[0] [" + result.split(',')[0] + "]" );

        const audioMessage = result.split(',')[1];
        const mimeType = result.split(',')[0];

        document.body.innerText = "Processing audio...";
        response = await fetch( url, {
            method: 'POST',
            headers: {'Content-Type': mimeType},
            body: audioMessage
        } );
        if ( !response.ok ) {
            throw new Error( `HTTP error: ${response.status}` );
        }

        const transcriptionJson = await response.json();
        console.log( "transcriptionJson [" + JSON.stringify( transcriptionJson ) + "]..." );
        let transcription = transcriptionJson[ "transcription" ]

        if ( transcription.startsWith( "multimodal editor" ) ) {

            console.log( "TODO: Finish implementing multiple voice commands handling" );
            handleCommands( transcription );

        } else {
            console.log( "Pushing 'transcription' part of this response object to clipboard [" + JSON.stringify( transcriptionJson ) + "]..." );
            console.log( "transcription [" + transcriptionJson[ "transcription" ] + "]" );

            const writeCmd = navigator.clipboard.writeText( transcription )
            console.log( "Success!" );
            document.body.innerText = "Processing audio... Done!";
            window.setTimeout( () => {
                window.close();
            }, 250 );
        }
    } catch (e) {
        console.log( "Error reading audio file [" + e + "]" );
    }
});

async function handleCommands( transcription ) {

    console.log( "handleCommands( transcription ) called with transcription [" + transcription + "]" );
    if ( transcription == "multimodal editor proof" ) {

        proofreadFromClipboard();

    } else if ( transcription == "multimodal editor toggle" ) {

        document.body.innerText = "Processing audio... Done!";
        if ( currentMode == "command" ){
            currentMode = "transcription";
        } else {
            currentMode = "command";
        }
        localStorage.setItem( "mode", currentMode );
        await doTextToSpeech( "Switching to " + currentMode + " mode", closeWindow=false, refreshWindow=true );
        // closeWindow();
    }
}
async function proofreadFromClipboard() {

    try {

        document.body.innerText = "Proofreading...";
        document.body.style.backgroundColor = "pin";
        document.body.style.border = "2px dotted red";

        const rawText = await navigator.clipboard.readText()
        console.log( "rawText [" + rawText + "]" );

        let url = genieInTheBoxServer + "/api/proofread?question=" + rawText
        const response = await fetch( url, {
            method: 'GET',
            headers: {'Access-Control-Allow-Origin': '*'}
        } );
        console.log( "response.status [" + response.status + "]" );

        if (!response.ok) {
            throw new Error( `HTTP error: ${response.status}` );
        }
        const proofreadText = await response.text();
        console.log( "proofreadText [" + proofreadText + "]" );

        console.log( "Pushing proofreadText [" + proofreadText + "] to clipboard..." );
        const pasteCmd = await navigator.clipboard.writeText( proofreadText );

        document.body.innerText = "Proofreading... Done!";
        closeWindow();

    } catch ( e ) {
        console.log( "Error: " + e );
    }
}

function closeWindow() {
    window.setTimeout( () => {
        window.close();
    }, 250 );
}

async function readBlobAsDataURL( file ) {

    // From: https://errorsandanswers.com/read-a-file-synchronously-in-javascript/
    let result_base64 = await new Promise((resolve) => {
        let fileReader = new FileReader();
        fileReader.onload = (e) => resolve(fileReader.result);
        fileReader.readAsDataURL( file );
    });
    console.log(result_base64.split( "," )[ 0 ]); // aGV5IHRoZXJl...

    return result_base64;
}

async function doTextToSpeech( text, closeWindow=true, refreshWindow=false ) {

    console.log("doTextToSpeech() called...")

    let url = ttsServer + "/api/tts?text=" + text
    const encodedUrl = encodeURI(url);
    console.log("encoded: " + encodedUrl);

    let audioResult = await new Promise((resolve) => {
        document.body.innerText = "Playing audio...";
        let audio = new Audio(encodedUrl);
        audio.onload = (e) => resolve(audio.result);
        audio.play();
        audio.addEventListener( "ended", () => {
            document.body.innerText = "Playing audio... Done!";
            if ( closeWindow ) {
                closeWindow();
            } else if ( refreshWindow ) {
                window.location.reload();
            }
        } );
    });
    console.log("audioResult [" + audioResult + "]");

    console.log("doTextToSpeech() called... done!")
}
// pushToCurrentTab = ( msg ) => {
//
//     browser.tabs.sendMessage( tabs[0].id, {
//         command: "insert-text",
//         transcribedText: msg
//     });
// }

// async function getFromClipboard() {
//
//     console.log( "Getting from clipboard..." );
//
//     await navigator.clipboard.readText().then( ( clipText) => {
//         console.log( "clipText [" + clipText + "]" );
//         return clipText;
//     }, () => {
//         console.log( "Nothing read from clipboard!" );
//         return "";
//     });
// }


pushToClipboardAndClose = ( text ) => {

  // console.log( "Pushing 'transcription' part of this response object to clipboard [" + JSON.stringify( response ) + "]..." );
  // console.log( "transcription [" + response[ "transcription" ] + "]" );
    console.log( "pushToClipboard( text ) [" + text + "]" );
  // navigator.clipboard.writeText( response[ "transcription" ] ).then(() => {
  navigator.clipboard.writeText( text ).then(() => {
    console.log( "Success!" );
  }, () => {
    console.log( "Failed to write to clipboard!" );
  }).then( () => {
    document.body.innerText = "Processing... Done!";
    window.setTimeout( () => {
        window.close();
    }, 250 );
  });
  // console.log( "document.hasFocus() " + document.hasFocus());
  // console.log( "document.activeElement " + document.activeElement.id);
  // document.activeElement.value = msg;
  // typeInTextarea( msg );

  // I want to refer to the currently opened tab but don't really know of a good way to do this yet. I want to refer to the currently opened tab but don't really know of a good way to do this yet.
  // window.tabs.query({active: true, currentWindow: true}, function(tabs) {
  // window.Window.tabs
  //     .executeScript({
  //       code: "document.getSelection().toString()"
  //     })
  //     .then(results => {
  //       console.log(results[0])
  //     });
  // window.close()
}
// const typeInTextarea = ( newText, el = document.activeElement) => {
//     const [start, end] = [el.selectionStart, el.selectionEnd];
//     el.setRangeText(newText, start, end, 'select');
// }


/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
// console.log( "JS injector script loading... " )
// browser.tabs.executeScript({ file: "/js/js-injector.js"})
//   .then( console.log( "JS injector script loading... done!" ) )
//   .catch( console.log( "Unable to load JS injector script." ) );

console.log( "recorder.js loaded" );
// document.body.style.border = "5px solid green";
