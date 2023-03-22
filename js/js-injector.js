(() => {
    console.log( "js-injector.js loading..." );
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  // /**
  //  * Given a URL to a beast image, remove all existing beasts, then
  //  * create and style an IMG node pointing to
  //  * that image, then insert the node into the document.
  //  */
  // function insertBeast(beastURL) {
  //   removeExistingBeasts();
  //   const beastImage = document.createElement("img");
  //   beastImage.setAttribute("src", beastURL);
  //   beastImage.style.height = "100vh";
  //   beastImage.className = "beastify-image";
  //   document.body.appendChild(beastImage);
  // }

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
