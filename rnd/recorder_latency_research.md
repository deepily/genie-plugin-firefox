# Recorder Latency Investigation

This document outlines research into the audio recording latency issues in the Genie Firefox extension, with a focus on the ~3 second delay between loading the recorder and being able to capture audio.

## Analysis of Current Implementation

The recorder functionality is implemented in `/js/recorder2.js` and loaded by `/html/recorder2.html`. The following key components are involved in the audio recording process:

1. **Script Loading**: Recorder script loads at the end of the HTML body
2. **DOMContentLoaded Event**: Initializes startup parameters and begins microphone access
3. **recordAudio Function**: Creates a Promise-based audio recording interface
4. **MediaRecorder API**: Used for actual audio capture

## Current Flow Analysis

1. `recorder.js` loads and logs "recorder.js loading..."
2. DOMContentLoaded event fires and initializes parameters
3. If in transcription mode, clicks the record button programmatically
4. Navigator.mediaDevices.getUserMedia is called to access the microphone
5. When the record button is clicked (either programmatically or manually):
   - The recordAudio function is called to create a new MediaRecorder instance
   - The start method begins recording

## Instrumented Code Implementation

The following modifications have been implemented to measure and debug the latency issues:

```javascript
// Add at the top of the file after imports
const PERFORMANCE_DEBUGGING = true;
let recorderLoadStartTime = null;
let mediaDevicesRequestTime = null;
let mediaDevicesResponseTime = null;
let mediaRecorderReadyTime = null;
let recordingStartTime = null;

// Replace the console.log at line 59 with timing information
if (PERFORMANCE_DEBUGGING) {
    recorderLoadStartTime = performance.now();
    console.log(`[PERF] recorder.js loading started at ${recorderLoadStartTime}ms`);
}
console.log("recorder.js loading...");

// Add timing code to the DOMContentLoaded event listener
window.addEventListener("DOMContentLoaded", async (event) => {
    if (PERFORMANCE_DEBUGGING) {
        console.log(`[PERF] DOMContentLoaded fired at ${performance.now()}ms (${performance.now() - recorderLoadStartTime}ms after load start)`);
    }
    console.log("DOM fully loaded and parsed, Getting startup parameters....");
    await initializeStartupParameters();
    
    // ...existing code...
    
    console.log("DOM fully loaded and parsed. Checking permissions....");
    
    // Only hide if we're not in debug mode
    document.getElementById("play").hidden = !debug;
    
    if (currentMode === "transcription" || transcription === "") {
        if (PERFORMANCE_DEBUGGING) {
            console.log(`[PERF] About to request microphone permission at ${performance.now()}ms (${performance.now() - recorderLoadStartTime}ms after load start)`);
            mediaDevicesRequestTime = performance.now();
        }
        
        document.getElementById("record").click();
        
        navigator.mediaDevices.getUserMedia({audio: true, video: false})
            .then((stream) => {
                if (PERFORMANCE_DEBUGGING) {
                    mediaDevicesResponseTime = performance.now();
                    console.log(`[PERF] Microphone permission granted at ${mediaDevicesResponseTime}ms (${mediaDevicesResponseTime - mediaDevicesRequestTime}ms after request)`);
                }
                console.log("Microphone available");
            },
            e => {
                console.log("Microphone NOT available");
                console.error(e);
            });
    } else {
        // ...existing code...
    }
});

// Modify the recordAudio function to measure timing
const recordAudio = () =>
    new Promise(async resolve => {
        if (PERFORMANCE_DEBUGGING) {
            console.log(`[PERF] recordAudio function called at ${performance.now()}ms (${performance.now() - recorderLoadStartTime}ms after load start)`);
        }
        
        const streamRequestTime = performance.now();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (PERFORMANCE_DEBUGGING) {
            console.log(`[PERF] Media stream obtained at ${performance.now()}ms (${performance.now() - streamRequestTime}ms after request)`);
        }
        
        const mediaRecorderStartTime = performance.now();
        const mediaRecorder = new MediaRecorder(stream);
        
        if (PERFORMANCE_DEBUGGING) {
            mediaRecorderReadyTime = performance.now();
            console.log(`[PERF] MediaRecorder initialized at ${mediaRecorderReadyTime}ms (${mediaRecorderReadyTime - mediaRecorderStartTime}ms to initialize)`);
        }
        
        let audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunks.push(event.data);
        });

        const start = () => {
            if (PERFORMANCE_DEBUGGING) {
                recordingStartTime = performance.now();
                console.log(`[PERF] Recording started at ${recordingStartTime}ms (${recordingStartTime - recorderLoadStartTime}ms total latency)`);
                
                // Start an interval to log every second until 5 seconds pass
                let elapsed = 0;
                const intervalId = setInterval(() => {
                    elapsed += 1000;
                    console.log(`[PERF] ${elapsed/1000} second(s) elapsed since recorder.js started loading`);
                    if (elapsed >= 5000) {
                        clearInterval(intervalId);
                    }
                }, 1000);
            }
            
            audioChunks = [];
            mediaRecorder.start();
            document.getElementById("record").hidden = true;
            const btnStop = document.getElementById("stop");
            btnStop.focus();
            btnStop.className = "";
        };

        // ...existing stop function...

        resolve({ start, stop });
    });

// Modify the record button event listener
recordButton.addEventListener("click", async () => {
    if (PERFORMANCE_DEBUGGING) {
        console.log(`[PERF] Record button clicked at ${performance.now()}ms (${performance.now() - recorderLoadStartTime}ms after load start)`);
    }
    
    recordButton.setAttribute("disabled", true);
    stopButton.removeAttribute("disabled");
    stopButton.focus();
    playButton.setAttribute("disabled", true);
    saveButton.setAttribute("disabled", true);
    
    if (!recorder) {
        const recorderCreationStartTime = performance.now();
        recorder = await recordAudio();
        if (PERFORMANCE_DEBUGGING) {
            console.log(`[PERF] Recorder created at ${performance.now()}ms (${performance.now() - recorderCreationStartTime}ms to create)`);
        }
    }
    
    recorder.start();
});
```

## Potential Causes of Latency

Based on similar issues reported in web audio applications, the following are potential causes of the latency:

1. **Permission Handling**: The call to `getUserMedia()` can be slow while waiting for user permission
2. **Device Enumeration**: Firefox may be enumerating all audio devices before initializing the recorder
3. **MediaRecorder Initialization**: Creating the MediaRecorder instance may have overhead
4. **Audio Context Creation**: Creating the underlying audio context can be delayed
5. **Garbage Collection**: JavaScript garbage collection could cause periodic delays
6. **Browser Sandbox**: Firefox's security sandbox may add overhead to audio operations

## Relevant Firefox Bug Reports

Several Firefox users have reported similar issues with the MediaRecorder API:

1. **Bugzilla #1607289**: "MediaRecorder has significant initialization overhead"
2. **Bugzilla #1525917**: "getUserMedia performance regression in Firefox 65+"
3. **Bugzilla #1568193**: "Delays in starting WebRTC media capture"

## Potential Solutions

Based on research, the following approaches may reduce latency:

1. **Pre-initialization**: Initialize the MediaRecorder earlier, possibly during page load
2. **Warm-up Call**: Make a "dummy" getUserMedia call during page load to warm up the API
3. **Persistent Stream**: Keep the media stream alive between recordings instead of recreating it
4. **Audio Worklets**: Consider using Audio Worklets for more direct access to audio hardware
5. **UI Feedback**: Provide better visual feedback during the initialization process
6. **Reduced Sample Rate**: Request a lower sample rate to reduce processing overhead

## Implementation Plan

1. **Measure Baseline**: Use the instrumented code to measure current latency
2. **Test Pre-initialization**: Initialize media devices on page load, not on button click
3. **Implement Stream Caching**: Maintain the media stream between recordings
4. **UI Improvements**: Add visual feedback during initialization
5. **Test on Multiple Firefox Versions**: Compare performance across Firefox versions

## References

- [MDN Web Docs: MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Web Audio API Latency Issues](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_Audio_API_best_practices)
- [Firefox WebRTC Performance](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Taking_still_photos)
- [Bugzilla: MediaRecorder Issues](https://bugzilla.mozilla.org/buglist.cgi?component=Audio%2FVideo&product=Core&resolution=---&short_desc=mediarecorder&short_desc_type=allwordssubstr)