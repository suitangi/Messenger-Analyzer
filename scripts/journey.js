//requires
const {
  dialog
} = require('electron').remote

const {
  ipcRenderer
} = require('electron')

const shell = require('electron').shell;

//Helpers: --------------------------
//find the max index in an array
function indexOfMax(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var max = arr[0];
  var maxIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      maxIndex = i;
      max = arr[i];
    }
  }
  return maxIndex;
}

//find the min index in an array
function indexOfMin(arr) {
  if (arr.length === 0) {
    return -1;
  }

  var min = arr[0];
  var minIndex = 0;

  for (var i = 1; i < arr.length; i++) {
    if (arr[i] < min) {
      minIndex = i;
      min = arr[i];
    }
  }
  return minIndex;
}

//escape a string for html
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

//escape a string for javascript
function escapeJs(unsafe) {
  return unsafe
    .replace(/\\/g, "\\")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'");
}


//End Helpers
//-----------------


// scrolls up a section
function scrollUp() {
  if (window.currentSection == '#sec1') {
    scrollTo('#begin');
  } else if (window.currentSection != undefined && window.currentSection != '#begin' && window.currentSection != "#data-dashboard") {
    scrollTo('#' + $(window.currentSection).prev().attr('id'));
  }

}

//scrolls down a section
function scrollDown() {
  if (window.currentSection == '#begin') {
    scrollTo('#sec1');
  } else if (window.currentSection != undefined && window.currentSection != window.lastSection && window.currentSection != "#data-dashboard") {
    scrollTo('#' + $(window.currentSection).next().attr('id'));
  }
}

function scrollTo(element) {
  var sections = $('.section');
  document.getElementsByTagName("body")[0].style = "";
  $('html, body').animate({
    scrollTop: $(element).offset().top
  }, 1000, "easeInOutExpo", function() {
    document.getElementsByTagName("body")[0].style = "overflow:hidden;";
  });
  window.currentSection = element;
  if (element == '#begin') {
    document.getElementById('control').style = "opacity: 0;";
    window.hideControl = setTimeout(function() {
      document.getElementById('control').style = "display: none;";
    }, 1000);
  } else if (element == window.lastSection) {
    document.getElementById('downarrow').style = "opacity: 0; cursor: default;";
  } else {
    clearTimeout(window.hideControl);
    document.getElementById('downarrow').style = "";
    document.getElementById('control').style = "opacity: 0";
    setTimeout(function() {
      document.getElementById('control').style = "opacity: 1";
    }, 200);

  }
  updateAnimates();
}

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
        } else if (el.attr("data-anime") == "odo") {
          el.text(el.attr("data-number"));
        } else if (el.attr("data-anime") == "cloud") {
          document.getElementById("wordCloud").innerHTML = "";
          setTimeout(function() {
            wordCloud(year_data.wordCount);
          }, 800);
        } else if (el.attr("data-anime") == "chart") {
          //different charts need to be initialized accordingly
          switch (el.attr('id')) {
            case 'hourChart':
              hourChart(el.get(), year_data.hourlyCount);
              break;
            case 'typeChart':
              typeChart(el.get(), year_data.typeCount, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
              break;
            case 'reactChart':
              typeChart(el.get(), year_data.reactType, ['😍', '❤️', '😆', '😮', '😢', '😠', '👍', '👎'])
          }
        }
        el.removeClass("to-animate");
      } else if (status == 'leaved') {
        if (el.attr("data-anime") == "fade-top") {
          el.removeClass("fade-in-top");
          el.addClass('to-animate');
        } else if (el.attr("data-anime") == "fade-bottom") {
          el.removeClass("fade-in-bottom");
          el.addClass('to-animate');
        } else if (el.attr("data-anime") == "cloud") {
          document.getElementById("wordCloud").innerHTML = "";
        } else if (el.attr("data-anime") == "odo") {
          el.text('0');
          el.addClass('to-animate');
        }
      }
    });
  });
}

//building charts
function hourChart(ctx, data) {
  var myChart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: ['12 - 1AM', '1 - 2AM', '2 - 3AM', '3 - 4AM', '4 - 5AM', '5 - 6AM', '6 - 7AM', '7 - 8AM', '8 - 9AM', '9 - 10AM', '10 - 11AM', '11AM - 12PM',
        '12 - 1PM', '1 - 2PM', '2 - 3PM', '3 - 4PM', '4 - 5PM', '5 - 6PM', '6 - 7PM', '7 - 8PM', '8 - 9PM', '9 - 10PM', '10 - 11PM', '11PM - 12AM'
      ],
      datasets: [{
        label: 'Messages sent',
        data: data,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        hoverBackgroundColor: 'rgba(255, 255, 255, 1)'
      }],
    },
    options: {
      legend: {
        display: false
      },
      tooltips: {
        displayColors: false,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 16,
        bodyAlign: 'center',
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          display: false,
        },
        crosshair: false
      }
    }
  });
}

function typeChart(ctx, data, label) {
  var doughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: label,
      datasets: [{
        label: 'Messages sent',
        data: data,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        hoverBackgroundColor: 'rgba(255, 255, 255, 1)'
      }],
    },
    options: {
      legend: {
        display: false
      },
      tooltips: {
        displayColors: false,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 16,
        bodyAlign: 'center',
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          display: false,
        },
        crosshair: false
      }
    }
  });
}

//function for the wordcloud
function wordCloud(words) {
  let wordlist = [];
  for (var i = 0; i < words.length; i++) {
    wordlist.push([words[i].text, words[i].size / (words[0].size / 150)]);
  }
  WordCloud(document.getElementById('wordCloud'), {
    list: wordlist,
    color: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    fontFamily: 'Times, serif',
    wait: 10,
    gridSize: 15,
    rotateRatio: 0.2,
    rotationSteps: 2,
    shuffle: true
  });
}

//fucntion to open the conversation modal
function openConvo() {
  $('#messagesContainer').attr('style', '');
  setTimeout(function() {
    $('#messagesContainer').attr('style', 'background-color: rgba(0, 0, 0, 0.5);');
  }, 200);
  $('#messages').addClass('scale-in-center');
  $('#messages').removeClass('scale-out-center');
}

//function to close the conversation modal
function closeConvo() {
  $('#messagesContainer').attr('style', 'background-color: rgba(0, 0, 0, 0);');
  setTimeout(function() {
    $('#messagesContainer').attr('style', 'display: none;');
  }, 500);
  $('#messages').removeClass('scale-in-center');
  $('#messages').addClass('scale-out-center');
}

//load in all the interesting facts
function loadFacts() {
  $('.thisYear').each(function(i, el) {
    el.innerText = year_data.year;
  });

  $('#msg_total').attr('data-number', year_data.messageCount);
  $('#rcd_total').attr('data-number', year_data.receivedCount);
  $('#rct_total').attr('data-number', year_data.reactCount);
  $('#rct_max').attr('data-number', Math.floor(Math.max(...year_data.reactType) / year_data.reactCount * 100));
  $('#msgType_max').attr('data-number', Math.floor(Math.max(...year_data.typeCount) / year_data.messageCount * 100));

  //show the reaction most used
  var reactSrc = ['love', 'heart', 'grin', 'surprised', 'sad', 'angry', 'thumbsup', 'thumbsdown'];
  $('#mostRct').attr('src', 'img/' + reactSrc[indexOfMax(year_data.reactType)] + '.png');

  //show the most common messaage type
  var msgTypes = ['texts', 'photos', 'links', 'gifs', 'videos'];
  $('#mostMsgType').text(msgTypes[indexOfMax(year_data.typeCount)]);

  //show the most active times
  var timePeriods = ['12 - 1AM', '1 - 2AM', '2 - 3AM', '3 - 4AM', '4 - 5AM', '5 - 6AM', '6 - 7AM', '7 - 8AM', '8 - 9AM', '9 - 10AM', '10 - 11AM', '11AM - 12PM',
    '12 - 1PM', '1 - 2PM', '2 - 3PM', '3 - 4PM', '4 - 5PM', '5 - 6PM', '6 - 7PM', '7 - 8PM', '8 - 9PM', '9 - 10PM', '10 - 11PM', '11PM - 12AM'
  ];
  $('#mostActiveTime').text(timePeriods[indexOfMax(year_data.hourlyCount)]);
  $('#leastActiveTime').text(timePeriods[indexOfMin(year_data.hourlyCount)]);

  //top contacts aand groups
  $('#topContact').text(year_data.topPrivateOut.name);
  $('#topContactMsgCount').attr('data-number', year_data.topPrivateOut.count);
  $('#topContactPercent').attr('data-number', Math.floor(year_data.topPrivateOut.count / year_data.privateCount * 100));

  $('#topContactIn').text(year_data.topPrivateIn.name);
  if (year_data.topPrivateIn.name == year_data.topPrivateOut.name) {
    $('#also').attr('style', '');
  }
  $('#topContactInMsgCount').attr('data-number', year_data.topPrivateIn.count);
  $('#topContactInPercent').attr('data-number', Math.floor(year_data.topPrivateIn.count / year_data.receivedCountPrivate * 100));

  if (year_data.topGroupIn.name == year_data.topGroupOut.name) {
    $('#multigroup0').text(' was');
    $('#multigroup').attr('style', 'display: none;');
    $('#multigroup1').attr('style', 'display: none;');
    $('#multigroup2').attr('style', 'display: none;');
  } else {
    $('#topGroup2').text(year_data.topGroupIn.name);
  }
  $('#topGroup1').text(year_data.topGroupOut.name);
  $('#topGroupInCount').attr('data-number', year_data.topGroupIn.count);
  $('#topGroupOutCount').attr('data-number', year_data.topGroupOut.count);

  //deep conversation
  $('#deepTalkName').text(year_data.deepTalk.name);
  tempD = new Date(year_data.deepTalk.messages[0].timestamp_ms);
  $('#deepTalkDate').text(tempD.toDateString());
  $('#deepTalkTime').text(tempD.toLocaleTimeString());
  $('#deepTalkCount').attr('data-number', year_data.deepTalk.count);
  $('#deepTalkHours').attr('data-number', Math.ceil(year_data.deepTalk.timeElapsed));
  if (Math.ceil(year_data.deepTalk.timeElapsed) == 1) {
    $('#hoursPlural').attr('style', 'display: none;');
  }

  //load the messages into the convo
  let htmlStr = "",
    messages = year_data.deepTalk.messages;
  for (m = 0; m < messages.length; m++) {
    if (messages[m].type == 'Generic') {
      tempD = new Date(year_data.deepTalk.messages[m].timestamp_ms);
      htmlStr += '<li ';
      htmlStr += ((messages[m].sender_name != year_data.deepTalk.name) ? 'class="mine"' : '');
      htmlStr += ' data-date="' + tempD.toLocaleTimeString() + '"><span>';
      if (messages[m].content != undefined) {
        htmlStr += messages[m].content + '</span></li>';
      } else if (messages[m].photos != undefined) {
        htmlStr += messages[m].sender_name + " sent " + ((messages[m].photos.length == 1) ? 'a photo.</span></li>' : messages[m].photos.length + ' photos.</span></li>');
      } else if (messages[m].videos != undefined) {
        htmlStr += messages[m].sender_name + " sent " + ((messages[m].videos.length == 1) ? 'a video.</span></li>' : messages[m].videos.length + ' videos.</span></li>');
      } else if (messages[m].photos != undefined) {
        htmlStr += messages[m].sender_name + " sent a gif.</span></li>"
      } else if (messages[m].sticker != undefined) {
        htmlStr += messages[m].sender_name + " sent a sticker.</span></li>"
      }
    } else if (messages[m].type == 'Share') {
      tempD = new Date(year_data.deepTalk.messages[m].timestamp_ms);
      htmlStr += '<li ';
      htmlStr += ((messages[m].sender_name != year_data.deepTalk.name) ? 'class="mine"' : '');
      htmlStr += ' data-date="' + tempD.toLocaleTimeString() + '"><span>';
      linkContent = "";
      if (messages[m].content != undefined) {
        if (messages[m].share != undefined && messages[m].share.link != undefined) {
          if (messages[m].content == messages[m].share.link) {
            linkContent += '<a href="' + messages[m].share.link + '">' + messages[m].share.link + '</a>';
          } else {
            linkContent += messages[m].content + "<br>" + '<a href="' + messages[m].share.link + '">' + messages[m].share.link + '</a>';
          }
        }
      } else if (messages[m].share != undefined && messages[m].share.link != undefined) {
        linkContent += '<a href="' + messages[m].share.link + '">' + messages[m].share.link + '</a>';
      }

      if (linkContent == "") {
        linkContent = messages[m].sender_name + " shared something (unable to fetch at the moment)."
      }
      htmlStr += linkContent + '</span></li>';
    }
  }

  document.getElementById('messages').innerHTML = htmlStr;

  //lost contacts
  $('#lost1').text(year_data.lostConnections[0].name);
  $('#lost2').text(year_data.lostConnections[1].name);
  $('#lost3').text(year_data.lostConnections[2].name);
  $('#lost1-1').text(year_data.lostConnections[0].name);
  $('#lostCount').attr('data-number', year_data.lostConnections[0].percentage);

  //new friends
  $('#friend1').text(year_data.newFriends[0].name);
  $('#friend2').text(year_data.newFriends[1].name);
  $('#friend3').text(year_data.newFriends[2].name);
  $('#friendCount1').attr('data-number', year_data.newFriends[0].difference);
  $('#friendCount2').attr('data-number', year_data.newFriends[1].difference);
  $('#friendCount3').attr('data-number', year_data.newFriends[2].difference);

}

//function to go to dashbord
function startDashboard() {
  // scrollTo('#data-dashboard');
  //
  // setTimeout(function() {
  //   $('#year-review').css('display', 'none');
  //   $('#begin').css('display', 'none');
  // }, 1000);
  // document.getElementById('control').style = "opacity: 0;";
  // window.hideControl = setTimeout(function() {
  //   document.getElementById('control').style = "display: none;";
  // }, 1000);

  ipcRenderer.send('dashboard-open');
}


//doc start scripting
$(document).ready(function() {
  updateAnimates();
  ipcRenderer.send('journey', 'ready');
  window.lastSection = "#sec11";

  //disable native electron windows opening external links
  $(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
  });

  //listeners for arrow keys
  document.addEventListener('keyup', (e) => {
    if (e.code === "ArrowUp") {
      e.preventDefault();
      scrollUp();
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      scrollDown();
    }
  });

  document.getElementById("messagesContainer").addEventListener('click', function(e) {
    if (e.target == document.getElementById("messagesContainer")) {
      closeConvo();
    }
  });

  $('body').on('click', '#messages-view a', (event) => {
    event.preventDefault();
    let link = event.target.href;
    require("electron").shell.openExternal(link);
  });

  //listens for done loading signal
  ipcRenderer.on('loading', (event, arg) => {
    window.year = arg;
    document.getElementById("year_text").innerHTML = arg;
    console.log('This window is for year: ' + arg);
  });
  ipcRenderer.on('yearData', (event, arg) => {
    window.year_data = arg;
    console.log("Done loading");
    console.log(arg);
    $('#loadbutton').click(function() {
      scrollTo('#sec1');
    });
    $('#loadbutton').text('Retrace my Journey')
    loadFacts();
  });

  Chart.defaults.scale.gridLines.display = false;
  Chart.defaults.scale.ticks.display = false;

  window.onbeforeunload = (e) => {
    ipcRenderer.send('journey-close', window.year);
  }

});
