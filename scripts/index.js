//requires
const {
  dialog
} = require('electron').remote

const {
  ipcRenderer
} = require('electron')

const shell = require('electron').shell;

//function to update the dynamic animated elements
function updateAnimates() {
  var win = $(window);
  var allMods = $(".to-animate");
  let el;
  allMods.each(function(i, el) {
    el = $(el);
    el.isInViewport(function(status) {
      if (status == 'entered') {
        if (el.attr("data-anime") == "fade-top") {
          el.addClass("fade-in-top");
        } else if (el.attr("data-anime") == "fade-bottom") {
          el.addClass("fade-in-bottom");
        }
        el.removeClass("to-animate");
      }
    });
  });
}

//function for scrolling
function scrollTo(element) {
  var sections = $('.section');
  document.getElementsByTagName("body")[0].style = "";
  $('html, body').animate({
    scrollTop: $(element).offset().top
  }, 1000, "easeInOutExpo", function() {
    document.getElementsByTagName("body")[0].style = "overflow:hidden;";
  });
  window.currentSection = element;
  updateAnimates();
}

//if loading successful, send to main js and show loading screen
function loadDirectory() {

  //show open dialog
  var directory = dialog.showOpenDialogSync({
    properties: ['openDirectory']
  });

  //if valid directory
  if (directory != undefined) {
    ipcRenderer.send('load-directory', directory[0]);
    console.log(directory[0]);
    scrollTo("#loading");
    setTimeout(function() {
      $('#loadingsign').addClass('tracking-in-expand');
    }, 500);
    setTimeout(function() {
      $('#loadAlert').addClass('fade-in-bottom');
    }, 5000);
  } else {
    $('#loadbutton').addClass('shake-bottom');
    $('#loadbutton').removeClass('fade-in-bottom');
    setTimeout(function() {
      $('#loadbutton').removeClass('shake-bottom');
    }, 500);
  }
}

//document ready scripts
$(document).ready(function() {
  updateAnimates();

  //listens for done loading signal
  ipcRenderer.on('loading', (event, arg) => {
    if (arg == 'done') {
      scrollTo("#menu");
      updateAnimates();
      setTimeout(function() {
        document.getElementById("loading").remove();
      }, 1200);
    } else if (arg == 'parsing') {
      $('#loadingsign').removeClass('tracking-in-expand');
      $('#loadingsign').addClass('tracking-out-contract');
      setTimeout(function() {
        $('#loadingsign').text('Parsing Messages');
        $('#loadingsign').removeClass('tracking-out-contract');
        $('#loadingsign').addClass('tracking-in-expand');
      }, 700);
    }
  });
});
