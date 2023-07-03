function modalTemplate( data ) {
  return `
    <div id="aiDeepilyModal" className="ai-deepily-modal">
    
      <!-- Modal content -->
      <div className="ai-deepily-modal-content">
        <span className="ai-deepily-close">&times;</span>
        <p>${data.status}</p>
      </div>
      
    </div>`
}
var data = {
  status: "Stand by while we fetch your content..."
}
const modalHtml = modalTemplate( data );

document.getElementById('aiDeepilyModalDisplayButton' ).insertAdjacentHTML( "afterend", modalHtml );

// Get the modal
var modal = document.getElementById( "aiDeepilyModal" );

// Get the button that opens the modal
var btn = document.getElementById( "aiDeepilyModalDisplayButton" );

// Get the <span> element that closes the modal
var span = document.getElementsByClassName( "ai-deepily-close" )[0];

// When the user clicks the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}