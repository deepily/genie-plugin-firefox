var lastKey = "";
var lastCode = "";

var quill = new Quill('#editor-container', {
    modules: {
      formula: true,
      syntax: true,
      toolbar: '#toolbar-container'
    },
    placeholder: 'Compose an epic...',
    theme: 'snow'
});

// document.body.addEventListener( "keydown", (event) => {
//
//     // console.log( "keydown.key is [" + event.key + "] and the code is [" + event.code + "]" );
//     // console.log( "lastKey is [" + lastKey + "] and the lastCode is [" + lastCode + "]" );
//
//     if ( event.key === "Meta" && event.code === "OSRight" && lastKey === "Meta" && lastCode === "OSRight" ) {
//       console.log( "Double OSRight keydown detected" );
//       lastKey = "";
//       lastCode = "";
//     } else {
//       // console.log( "Not a double MetaRight keydown" );
//       lastKey = event.key;
//       lastCode = event.code;
//     }
// });