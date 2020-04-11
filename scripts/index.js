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
  if (element == '#begin' || element == '#loading') {
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
            wordCloud(data_2019.wordCount);
          }, 800);
        } else if (el.attr("data-anime") == "chart") {
          //different charts need to be initialized accordingly
          switch (el.attr('id')) {
            case 'hourChart':
              hourChart(el.get(), data_2019.hourlyCount);
              break;
            case 'typeChart':
              typeChart(el.get(), data_2019.typeCount, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
              break;
            case 'reactChart':
              typeChart(el.get(), data_2019.reactType, ['😍', '❤️', '😆', '😮', '😢', '😠', '👍', '👎'])
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
      }
    }
  });
}

//function for the wordcloud
function wordCloud(words) {
  let wordlist = [];
  for (var i = 0; i < words.length; i++) {
    wordlist.push([words[i].text, words[i].size / 20]);
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

//load in all the interesting facts
function loadFacts() {
  $('.thisYear').each(function(i, el) {
    el.innerText = data_2019.year;
  });

  $('#msg_total').attr('data-number', data_2019.messageCount);
  $('#rcd_total').attr('data-number', data_2019.receivedCount);
  $('#rct_total').attr('data-number', data_2019.reactCount);
  $('#rct_max').attr('data-number', Math.floor(Math.max(...data_2019.reactType) / data_2019.reactCount * 100));
  $('#msgType_max').attr('data-number', Math.floor(Math.max(...data_2019.typeCount) / data_2019.messageCount * 100));

  //show the reaction most used
  var reactSrc = ['love', 'heart', 'grin', 'surprised', 'sad', 'angry', 'thumbsup', 'thumbsdown'];
  $('#mostRct').attr('src', 'img/' + reactSrc[indexOfMax(data_2019.reactType)] + '.png');

  //show the most common messaage type
  var msgTypes = ['texts', 'photos', 'links', 'gifs', 'videos'];
  $('#mostMsgType').text(msgTypes[indexOfMax(data_2019.typeCount)]);

  //show the most active times
  var timePeriods = ['12 - 1AM', '1 - 2AM', '2 - 3AM', '3 - 4AM', '4 - 5AM', '5 - 6AM', '6 - 7AM', '7 - 8AM', '8 - 9AM', '9 - 10AM', '10 - 11AM', '11AM - 12PM',
    '12 - 1PM', '1 - 2PM', '2 - 3PM', '3 - 4PM', '4 - 5PM', '5 - 6PM', '6 - 7PM', '7 - 8PM', '8 - 9PM', '9 - 10PM', '10 - 11PM', '11PM - 12AM'
  ];
  $('#mostActiveTime').text(timePeriods[indexOfMax(data_2019.hourlyCount)]);
  $('#leastActiveTime').text(timePeriods[indexOfMin(data_2019.hourlyCount)]);

  //top contacts aand groups
  $('#topContact').text(data_2019.topPrivateOut.name);
  $('#topContactMsgCount').attr('data-number', data_2019.topPrivateOut.count);
  $('#topContactPercent').attr('data-number', Math.floor(data_2019.topPrivateOut.count / data_2019.privateCount * 100));

  $('#topContactIn').text(data_2019.topPrivateIn.name);
  if (data_2019.topPrivateIn.name == data_2019.topPrivateOut.name) {
    $('#also').attr('style', '');
  }
  $('#topContactInMsgCount').attr('data-number', data_2019.topPrivateIn.count);
  $('#topContactInPercent').attr('data-number', Math.floor(data_2019.topPrivateIn.count / data_2019.receivedCountPrivate * 100));

  if (data_2019.topGroupIn.name == data_2019.topGroupOut.name) {
    $('#multigroup0').text(' was');
    $('#multigroup').attr('style', 'display: none;');
    $('#multigroup1').attr('style', 'display: none;');
    $('#multigroup2').attr('style', 'display: none;');
  } else {
    $('#topGroup2').text(data_2019.topGroupIn.name);
  }
  $('#topGroup1').text(data_2019.topGroupOut.name);
  $('#topGroupInCount').attr('data-number', data_2019.topGroupIn.count);
  $('#topGroupOutCount').attr('data-number', data_2019.topGroupOut.count);

  //deep conversation
  $('#deepTalkName').text(data_2019.deepTalk.name);
  tempD = new Date(data_2019.deepTalk.messages[0].timestamp_ms);
  $('#deepTalkDate').text(tempD.toDateString());
  $('#deepTalkTime').text(tempD.toLocaleTimeString());
  $('#deepTalkCount').attr('data-number', data_2019.deepTalk.count);
  $('#deepTalkHours').attr('data-number', Math.ceil(data_2019.deepTalk.timeElapsed));
  if (Math.ceil(data_2019.deepTalk.timeElapsed) == 1) {
    $('#hoursPlural').attr('style', 'display: none;');
  }

  //load the messages into the convo
  let htmlStr = "",
    messages = data_2019.deepTalk.messages;
  for (m = 0; m < messages.length; m++) {
    if (messages[m].type == 'Generic') {
      tempD = new Date(data_2019.deepTalk.messages[m].timestamp_ms);
      htmlStr += '<li ';
      htmlStr += ((messages[m].sender_name != data_2019.deepTalk.name) ? 'class="mine"' : '');
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
      tempD = new Date(data_2019.deepTalk.messages[m].timestamp_ms);
      htmlStr += '<li ';
      htmlStr += ((messages[m].sender_name != data_2019.deepTalk.name) ? 'class="mine"' : '');
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
  $('#lost1').text(data_2019.lostConnections[0].name);
  $('#lost2').text(data_2019.lostConnections[1].name);
  $('#lost3').text(data_2019.lostConnections[2].name);
  $('#lost1-1').text(data_2019.lostConnections[0].name);
  $('#lostCount').attr('data-number', data_2019.lostConnections[0].percentage);

  //new friends
  $('#friend1').text(data_2019.newFriends[0].name);
  $('#friend2').text(data_2019.newFriends[1].name);
  $('#friend3').text(data_2019.newFriends[2].name);
  $('#friendCount1').attr('data-number', data_2019.newFriends[0].difference);
  $('#friendCount2').attr('data-number', data_2019.newFriends[1].difference);
  $('#friendCount3').attr('data-number', data_2019.newFriends[2].difference);

}

//function to go to dashbord
function startDashboard() {
  scrollTo('#data-dashboard');
  Chart.defaults.scale.gridLines.display = true;
  Chart.defaults.scale.ticks.display = true;
  setTimeout(function() {
    $('#year-review').css('display', 'none');
    $('#begin').css('display', 'none');
  }, 1000);
  document.getElementById('convoSearch').addEventListener('focus', function() {
    document.getElementById('convoList').style = "";
  });
  document.getElementById('convoSearch').addEventListener('blur', function() {
    setTimeout(function() {
      document.getElementById('convoList').style = "display: none";
    }, 100);
  });
  dashGraphs();
}

//function to update convo seaerch
function updateConvoSearch() {
  // Declare variables
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('convoSearch');
  filter = input.value.toUpperCase();
  ul = document.getElementById("convoList");
  li = ul.getElementsByTagName('li');

  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}

// function handler for clicking on convo list
function convoClick(contact) {
  console.log("Convo clicked: " + contact);
  $('#convoSearch').val(contact);
}

//doc start scripting
$(document).ready(function() {
  updateAnimates();

  window.lastSection = "#sec12";

  setTimeout(function() {
    document.getElementById("year_text").innerHTML = 2019;
  }, 200);

  // assuming $ is jQuery
  $(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
  });

  //listeners for arrow keys
  document.addEventListener('keyup', (e) => {
    if (e.code === "ArrowUp") {
      e.preventDefault();
      if (window.currentSection != "#loading") {
        scrollUp();
      }
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      if (window.currentSection != "#loading") {
        scrollDown();
      }
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


  //sets the date range picker for data dashboard
  $('#dateRange').daterangepicker({
    "showDropdowns": true,
    "minYear": 2000,
    "linkedCalendars": false,
    "showCustomRangeLabel": false,
    "opens": "center",
    "autoUpdateInput": false,
    "locale": {
      "cancelLabel": 'Clear'
    }
  }, function(start, end, label) {
    console.log('New date range selected: ' + start + ' to ' + end);
    window.date = {
      start: start,
      end: end
    };
  });

  $('#dateRange').on('apply.daterangepicker', function(ev, picker) {
    $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
  });

  $('#dateRange').on('cancel.daterangepicker', function(ev, picker) {
    $(this).val('');
  });

  //listens for done loading signal
  ipcRenderer.on('loading', (event, arg) => {
    if (arg == 'done') {
      scrollTo("#sec1");
      updateAnimates();
      setTimeout(function() {
        document.getElementById("loading").remove();
        document.getElementById("control").style = "opacity: 1";
        document.getElementById("loadbutton").innerText = "Retrace the Journey";
        document.getElementById("loadbutton").onclick = function() {
          scrollTo('#sec1');
        }
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
  ipcRenderer.on('2019data', (event, arg) => {
    window.data_2019 = arg;
    console.log("Done loading");
    console.log(arg);
    loadFacts();
  });
  ipcRenderer.on('contacts', (event, arg) => {
    console.log(arg);
    let htmlStr = '',
      i, name;
    for (i = 0; i < arg.length; i++) {
      name = arg[i].name;
      if (name != '') {
        htmlStr += '<li><a href="#" onclick="convoClick(\'' +
          escapeJs(name) +
          '\');">' +
          name +
          '</a>';
        if (arg[i].type == 'dm') {
          htmlStr += '<div class="dmTag">DM</div>'
        }
        htmlStr += '</li>';
      }
    }
    document.getElementById('convoList').innerHTML = htmlStr;
  });


  Chart.defaults.scale.gridLines.display = false;
  Chart.defaults.scale.ticks.display = false;


});
