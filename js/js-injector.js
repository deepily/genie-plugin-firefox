(() => {
    console.log( "js-injector.js loading..." );
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if ( window.injectorHasRun ) {
    return;
  }
  window.injectorHasRun = true;

  function insertText( transcribedText ) {

    const activeTextarea = document.activeElement;
    if ( activeTextarea.tagName === "TEXTAREA" || activeTextarea.tagName === "INPUT" ) {
        activeTextarea.value = transcribedText;
    } else {
        console.log( "No active text area found" );
    }
  }


  /**
   * Listen for messages from the background script.
   */
  browser.runtime.onMessage.addListener((message) => {
      if ( message.command === "insert-text" ) {
          insertText( message.transcribedText );
      }
  });

  console.log( "js-injector.js loading... Done!" );
})();
