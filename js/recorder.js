console.log( "recorder.js loading..." );

// ¡OJO! TODO: These constants should be declared globally and ultimately in a runtime configurable configuration service provided by the browser.
// ¡OJO! TODO: background-context-menu.js and recorder.js both make duplicate declarations of these constants.
// const sttServerAndPort = "http://127.0.0.1:5000";
const genieInTheBoxServer = "http://127.0.0.1:7999";

function colorizer() {
  document.body.style.backgroundColor = "#ee2222";
}

document.getElementById("record").addEventListener("click", colorizer );
// document.getElementById("record").addEventListener("click", function() {
//   document.body.style.backgroundColor = '#ee0000';
// } );

// let stream = "";
window.addEventListener("DOMContentLoaded", (event) => {
  console.log("DOM fully loaded and parsed, starting recording...");
  document.getElementById('record').click()
});
window.addEventListener( "keydown", function (event) {

    // console.log( "event [" + event + "]" );
    // console.log( "event.key [" + event.key + "]" );
    if ( event.ctrlKey && event.key == "r" ) {
      console.log( "'Ctrl r' pressed" );
      document.getElementById('record').click();
    } else if ( event.ctrlKey && event.key == "s" ) {
      console.log( "'Ctrl s' pressed" );
      document.getElementById('stop').click();
      console.log( "Key pressed [" + event.key + "]" );
    } else if ( event.ctrlKey && event.key == "p" ) {
      console.log( "Ctrl 'p' pressed" );
      document.getElementById('play').click();
    } else if ( event.ctrlKey && event.key == "t" ) {
      console.log( "'Ctrl t' pressed" );
      document.getElementById('save').click();
    }
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
        document.getElementById('record').hidden = true;
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

    const url = genieInTheBoxServer + "/api/upload-and-transcribe"
    console.log( "Attempting to upload and transcribe to url [" + url + "]")

    const reader = new FileReader();
    reader.readAsDataURL(audio.audioBlob);
    reader.onload = () => {

        const audioMessage = reader.result.split(',')[1];
        const mimeType = reader.result.split(',')[0];

        fetch( url, {
            method: 'POST',
            headers: { 'Content-Type': mimeType },
            body: audioMessage
        }).then(res => {
            console.log( res.headers );
            console.log( res.body );
            console.log( res.status  );
            if (res.ok == true) {
                console.log('Successfully transcribed audio message');
                let text = res.text().then( respText => {
                console.log( "respText [" + respText + "]" )
                pushToClipboard( respText );
                // pushToCurrentTab( respText );
            });
            console.log( "text [" + text + "]" );
            // alert(text);
            } else
            console.log('Invalid status saving audio message: ' + res.status);
        });
    };
});

// pushToCurrentTab = ( msg ) => {
//
//     browser.tabs.sendMessage( tabs[0].id, {
//         command: "insert-text",
//         transcribedText: msg
//     });
// }

pushToClipboard = (msg ) => {

  console.log("Pushing to clipboard [" + msg + "]...");
  navigator.clipboard.writeText(msg).then(() => {
    console.log("Success!");
  }, () => {
    console.log("Failed to write to clipboard!");
  });
  console.log("document.hasFocus() " + document.hasFocus());
  console.log("document.activeElement " + document.activeElement.id);
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


  window.close()
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
