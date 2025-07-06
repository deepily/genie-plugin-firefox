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

document.getElementById( "editor-container" ).focus();