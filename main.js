const electron = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const utf8 = require('utf8');

const {
  app,
  BrowserWindow,
  Menu,
  ipcMain
} = electron;

let mainWindow;

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Listen for app to be ready
app.on('ready', function() {
  // Create new window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 1536,
    height: 848,
    minWidth: 1024,
    minHeight: 565,
    frame: false
  });
  // Load html into window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  //Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  //Insert menu
  Menu.setApplicationMenu(mainMenu);

  ipcMain.on('load-directory', (event, arg) => {
    setupMessages(arg);
  });
  ipcMain.on('close-me', (evt, arg) => {
    app.quit();
  });
  ipcMain.on('maximize-me', (evt, arg) => {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  });
  ipcMain.on('minimize-me', (evt, arg) => {
    mainWindow.minimize();
  });
});

//escape a string for html
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

//function process data
function processData() {
  mainWindow.webContents.send('loading', 'parsing');
  let i, j, message,
    firstMsg = {
      timestamp_ms: 9999999999999
    },
    lastMsg = {
      timestamp_ms: -1
    };

  //iterate through private conversations
  for (i = 0; i < messagesData.private.length; i++) {

    //sort the messages list
    messagesData.private[i].messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);

    //find earliest and latest message
    if (messagesData.private[i].messages[0].timestamp_ms < firstMsg.timestamp_ms) {
      firstMsg = Object.assign({}, messagesData.private[i].messages[0]);
      firstMsg.title = messagesData.private[i].title;
    }
    if (messagesData.private[i].messages[messagesData.private[i].messages.length - 1].timestamp_ms > lastMsg.timestamp_ms) {
      lastMsg = {
        ...messagesData.private[i].messages[messagesData.private[i].messages.length - 1]
      };
      lastMsg.title = messagesData.private[i].title;
    }

    //iterate through each message
    for (j = 0; j < messagesData.private[i].messages.length; j++) {

      message = messagesData.private[i].messages[j];
      //encode all emojis
      if (message.content != undefined && message.content.length != 0) {
        message.content = utf8.decode(message.content);
      }
    }
  }

  //iterate through group conversations
  for (i = 0; i < messagesData.group.length; i++) {

    //sort the messages list
    messagesData.group[i].messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);

    //find earliest and latest message
    if (messagesData.group[i].messages[0].timestamp_ms < firstMsg.timestamp_ms) {
      firstMsg = Object.assign({}, messagesData.group[i].messages[0]);
      firstMsg.title = messagesData.group[i].title;
    }
    if (messagesData.group[i].messages[messagesData.group[i].messages.length - 1].timestamp_ms > lastMsg.timestamp_ms) {
      lastMsg = {
        ...messagesData.group[i].messages[messagesData.group[i].messages.length - 1]
      };
      lastMsg.title = messagesData.group[i].title;
    }

    //iterate through each message
    for (j = 0; j < messagesData.group[i].messages.length; j++) {
      message = messagesData.group[i].messages[j];
      //encode all emojis
      if (message.content != undefined && message.content.length != 0) {
        message.content = utf8.decode(message.content);
      }
    }
  }
  messagesData.firstMsg = firstMsg;
  messagesData.lastMsg = lastMsg;
  console.log("Data Processed");
}

//function to get contact list
function contactList() {
  let cList = [],
    i;
  //iterate through private conversations
  for (i = 0; i < messagesData.private.length; i++) {
    cList.push({
      name: utf8.decode(messagesData.private[i].title),
      type: 'dm',
      id: messagesData.private[i].thread_path
    });
  }
  //iterate through group conversations
  for (i = 0; i < messagesData.group.length; i++) {
    cList.push({
      name: utf8.decode(messagesData.group[i].title),
      type: 'group',
      id: messagesData.group[i].thread_path
    });
  }
  console.log("Contact list loaded");
  return cList.sort((a, b) => (a.name > b.name) ? 1 : -1)
}


//function to setup the inital dashboard
function dashBoard() {

}

//process request for data
function getData(contact, startTime, endTime) {
  let messages = [],
    timeLabel = [],
    i, j, tempDate, tempDate2, timeUnit, msgCount, cTime, name, messaage, person,
    msgSentTime = [],
    msgSent = [],
    data = {
      participants: [],
      timeLabel: [],
      details: {}
    };

  //get the name of the user
  name = (messagesData.private[0].participants[1] != undefined) ? messagesData.private[0].participants[1].name :
    messagesData.private[1].participants[1];

  if (contact == "") { //process for all contacts
    data.details.title = "All conversaions";
    data.details.type = "N/A";
    if (startTime == 0 && endTime == 0) { //if date range is all time find the first and last message
      tempDate = new Date(messagesData.firstMsg.timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      startTime = tempDate2.getTime();
      tempDate = new Date(messagesData.lastMsg.timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      endTime = tempDate2.getTime() + 86399999; //inclusive day
    }
    data.participants.push({
      name: name,
      msgTime: [],
      msgPct: [],
      msgType: [0, 0, 0, 0, 0, 0],
      msgCount: 0,
      rctCount: [0, 0, 0, 0, 0, 0, 0, 0]
    });
    data.participants.push({
      name: 'Received',
      msgTime: [],
      msgPct: [],
      msgType: [0, 0, 0, 0, 0, 0],
      msgCount: 0,
      rctCount: [0, 0, 0, 0, 0, 0, 0, 0]
    });
    //get the messages and add them to the messages list
    for (i = 0; i < messagesData.private.length; i++) {
      for (j = 0; j < messagesData.private[i].messages.length; j++) {
        if (messagesData.private[i].messages[j].timestamp_ms > startTime &&
          messagesData.private[i].messages[j].timestamp_ms < endTime) {
          messages.push(messagesData.private[i].messages[j]);
        }
      }
    }
    for (i = 0; i < messagesData.group.length; i++) {
      for (j = 0; j < messagesData.group[i].messages.length; j++) {
        if (messagesData.group[i].messages[j].timestamp_ms > startTime &&
          messagesData.group[i].messages[j].timestamp_ms < endTime) {
          messages.push(messagesData.group[i].messages[j]);
        }
      }
    }
  } else { //process for just the requested conversation
    //find the conversation and add participants to list
    let foundConvo;
    for (i = 0; i < messagesData.private.length; i++) {
      if (messagesData.private[i].thread_path == contact) {
        foundConvo = messagesData.private[i];
      }
    }
    for (i = 0; i < messagesData.group.length; i++) {
      if (messagesData.group[i].thread_path == contact) {
        foundConvo = messagesData.group[i];
      }
    }

    data.details.title = foundConvo.title;
    data.details.type = foundConvo.participants.length == 2 ? 'DM' : 'Group';
    for (j = 0; j < foundConvo.participants.length; j++) {
      data.participants.push({
        name: foundConvo.participants[j].name,
        msgTime: [],
        msgPct: [],
        msgType: [0, 0, 0, 0, 0, 0],
        msgCount: 0,
        rctCount: [0, 0, 0, 0, 0, 0, 0, 0]
      });
    }
    if (startTime == 0 && endTime == 0) {
      tempDate = new Date(foundConvo.messages[0].timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      startTime = tempDate2.getTime();
      tempDate = new Date(foundConvo.messages[foundConvo.messages.length - 1].timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      endTime = tempDate2.getTime() + 86399999; //inclusive day
    }
  }

  tempDate = new Date(startTime);
  tempDate2 = new Date(endTime);
  data.details.range = (tempDate.getMonth() + 1) + '-' + tempDate.getDate() + '-' + (tempDate.getYear() + 1900) +
    " to " +
    (tempDate2.getMonth() + 1) + '-' + tempDate2.getDate() + '-' + (tempDate2.getYear() + 1900);

  messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);
  timeUnit = 60000; // < 1 day: 1 min
  if (endTime - startTime >= 441797328000) { // > 14 years: weeks
    timeUnit = 604800000;
  } else if (endTime - startTime >= 347126472000) { // > 11 years: 4 days
    timeUnit = 345600000;
  } else if (endTime - startTime >= 252455616000) { // > 8 years: 3 days
    timeUnit = 259200000;
  } else if (endTime - startTime >= 126227808000) { // > 4 years: 2 days
    timeUnit = 172800000;
  } else if (endTime - startTime >= 5259492000) { // > 2 month: 1 day
    timeUnit = 86400000;
  } else if (endTime - startTime >= 604800000) { // > 1 week: 1 hour
    timeUnit = 3600000;
  } else if (endTime - startTime >= 259200000) { // > 3 days: 10 min
    timeUnit = 600000;
  } else if (endTime - startTime >= 86400000) { // > 1 day: 5 min
    timeUnit = 300000;
  }

  let messageIndex = 0,
    end = true;
  for (cTime = startTime; end; cTime += timeUnit) {
    if (cTime >= endTime && end) {
      end = false;
    }
    msgCount = 0;
    for (i = 0; i < data.participants.length; i++) {
      data.participants[i].msgTime.push(0);
    }
    tempDate = new Date(cTime);
    if (tempDate.getHours() == 0 && tempDate.getMinutes() == 0) {
      data.timeLabel.push(((tempDate.getMonth() + 1 < 10) ? ('0' + (tempDate.getMonth() + 1)) : (tempDate.getMonth() + 1)) +
        '-' + ((tempDate.getDate() < 10) ? ('0' + tempDate.getDate()) : tempDate.getDate()) +
        '-' + (tempDate.getYear() + 1900));
    } else {
      if (timeUnit < 3600000) {
        data.timeLabel.push(tempDate.getHours() + ':' + ((tempDate.getMinutes() < 10) ? ('0' + tempDate.getMinutes()) : tempDate.getMinutes()));
      } else if (timeUnit == 3600000) {
        data.timeLabel.push(tempDate.getHours() + ':00');
      } else {
        data.timeLabel.push(((tempDate.getMonth() + 1 < 10) ? ('0' + (tempDate.getMonth() + 1)) : (tempDate.getMonth() + 1)) +
          '-' + ((tempDate.getDate() < 10) ? ('0' + tempDate.getDate()) : tempDate.getDate()) +
          '-' + (tempDate.getYear() + 1900));
      }
    }
    while (messageIndex < messages.length && messages[messageIndex].timestamp_ms < cTime) {
      message = messages[messageIndex];
      messageIndex++;
      if (message.sender_name == name) {
        person = data.participants[0];
      } else {
        if (contact == "") {
          person = data.participants[1];
        } else {
          for (i = 0; i < data.participants.length; i++) {
            if (message.sender_name == data.participants[i].name) {
              person = data.participants[i];
              break;
            }
          }
        }
      }

      msgCount += 1;
      person.msgCount += 1;
      person.msgTime[person.msgTime.length - 1] += 1;
      if (message.type == "Generic") {
        if (message.photos != undefined) {
          person.msgType[1] += message.photos.length;
        } else if (message.gifs != undefined) {
          person.msgType[3] += 1;
        } else if (message.videos != undefined) {
          person.msgType[4] += 1;
        } else if (message.sticker != undefined) {
          person.msgType[5] += 1;
        } else {
          person.msgType[0] += 1;
        }
      } else if (message.type == "Share" && message.share != undefined) {
        if (message.share.link != undefined) {
          person.msgType[2] += 1;
        }
      }
    }

    //calculate the % of messages in this time period for each participant
    for (i = 0; i < data.participants.length; i++) {
      if (msgCount == 0) {
        data.participants[i].msgPct.push(0);
      } else {
        data.participants[i].msgPct.push(Math.floor(100 * data.participants[i].msgTime[data.participants[i].msgTime.length - 1] / msgCount));
      }
    }
  }
  console.log("Dashboard data loaded for: " + contact + ", " + startTime + ", " + endTime);
  return data;
}

//process data for a year
function processYear(year) {

  //initialize variabless
  let privateCount = 0,
    groupCount = 0,
    reactCount = 0,
    receivedCountPrivate = 0,
    receivedCount = 0,
    reactType = [0, 0, 0, 0, 0, 0, 0, 0], // [😍 ❤ 😆 😮 😢 😠 👍 👎 ] [\u00f0\u009f\u0098\u008d, \u00e2\u009d\u00a4, \u00f0\u009f\u0098\u0086, \u00f0\u009f\u0098\u00ae, \u00f0\u009f\u0098\u00a2, \u00f0\u009f\u0098\u00a0, \u00f0\u009f\u0091\u008d, \u00f0\u009f\u0091\u008e]
    hourCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    typeCount = [0, 0, 0, 0, 0, 0], //text, image, link, gif, video, sticker
    i, j, k, d, message, name,
    tempCountIn,
    tempCountOut,
    tempIndex,
    topPrivateIn = {
      count: 0
    },
    topPrivateOut = {
      count: 0
    },
    topGroupIn = {
      count: 0
    },
    topGroupOut = {
      count: 0
    },
    deepTalk = {
      count: 0
    },
    tempTalk = [],
    lastYearCount,
    lostConnections = [],
    newFriends = [],
    wordCount = {};
  for (i = 0; i < 10; i++) {
    lostConnections.push({
      difference: 0
    });
    newFriends.push({
      difference: 0
    });
  }

  messagesData['year_' + year] = {};

  //get the name of the user
  name = (messagesData.private[0].participants[1] != undefined) ? messagesData.private[0].participants[1].name :
    messagesData.private[1].participants[1];


  //iterate through private convos
  for (i = 0; i < messagesData.private.length; i++) {
    tempCountIn = receivedCount;
    tempCountOut = privateCount;
    lastYearCount = 0;

    for (j = 0; j < messagesData.private[i].messages.length; j++) {
      message = messagesData.private[i].messages[j];
      d = new Date(message.timestamp_ms)
      if (d.getYear() + 1900 == year - 1) {
        lastYearCount += 1;
      }
      //if the year is the specified year
      else if (d.getYear() + 1900 == year) {

        //for deepTalk
        if (tempTalk.length != 0 && message.timestamp_ms - tempTalk[tempTalk.length - 1].timestamp_ms > 1800000) {
          tempTalk = [];
        }
        if (tempTalk.length > deepTalk.count) {
          deepTalk.messages = Array.from(tempTalk);
          deepTalk.count = tempTalk.length;
          deepTalk.name = messagesData.private[i].title;
        }
        tempTalk.push(message);

        //for sent messages
        if (message.sender_name == name) {
          privateCount += 1;
          hourCount[d.getHours()] += 1;

          //get message type
          if (message.type == "Generic") {
            if (message.photos != undefined) {
              typeCount[1] += message.photos.length;
            } else if (message.gifs != undefined) {
              typeCount[3] += 1;
            } else if (message.videos != undefined) {
              typeCount[4] += 1;
            } else if (message.sticker != undefined) {
              typeCount[5] += 1;
            } else {
              typeCount[0] += 1;
            }
          } else if (message.type == "Share" && message.share != undefined) {
            if (message.share.link != undefined) {
              typeCount[2] += 1;
            }
          }
        } else { //for received messages
          receivedCount += 1;
        }

        //add to wordCount
        if (message.content != undefined && message.content.length != 0) {
          if (message.sender_name == name) {
            message.content.split(/\s+/).forEach(function(word) {
              word = word.toUpperCase();
              if (wordCount[word] != undefined) {
                wordCount[word] += 1;
              } else {
                wordCount[word] = 1;
              }
            });
          }
        }

        //for reactions
        if (message.reactions != undefined) {
          for (k = 0; k < message.reactions.length; k++) {
            if (message.reactions[k].actor == name) {
              switch (message.reactions[k].reaction) {
                case '\u00f0\u009f\u0098\u008d':
                  reactType[0] += 1;
                  break;
                case '\u00e2\u009d\u00a4':
                  reactType[1] += 1;
                  break;
                case '\u00f0\u009f\u0098\u0086':
                  reactType[2] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00ae':
                  reactType[3] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00a2':
                  reactType[4] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00a0':
                  reactType[5] += 1;
                  break;
                case '\u00f0\u009f\u0091\u008d':
                  reactType[6] += 1;
                  break;
                case '\u00f0\u009f\u0091\u008e':
                  reactType[7] += 1;
                  break;
              }
              break;
            }
          }
        }
      }
    }
    //For each conversation, top contacts
    if (privateCount - tempCountOut > topPrivateOut.count) {
      topPrivateOut.count = privateCount - tempCountOut;
      topPrivateOut.name = messagesData.private[i].title;
    }
    if (receivedCount - tempCountIn > topPrivateIn.count) {
      topPrivateIn.count = receivedCount - tempCountIn;
      topPrivateIn.name = messagesData.private[i].title;
    }

    //lost connections
    tempIndex = 10;
    while (tempIndex > 0 && lastYearCount - (receivedCount - tempCountIn + privateCount - tempCountOut) > lostConnections[tempIndex - 1].difference) {
      tempIndex -= 1;
    }
    if (tempIndex != 10) {
      lostConnections.splice(tempIndex, 0, {
        difference: lastYearCount - (receivedCount - tempCountIn + privateCount - tempCountOut),
        name: messagesData.private[i].title,
        count: receivedCount - tempCountIn + privateCount - tempCountOut,
        lastCount: lastYearCount
      });
      lostConnections.pop();
    }
    //new friends
    tempIndex = 3;
    while (tempIndex > 0 && (receivedCount - tempCountIn + privateCount - tempCountOut) - lastYearCount > newFriends[tempIndex - 1].difference) {
      tempIndex -= 1;
    }
    if (tempIndex != 3) {
      newFriends.splice(tempIndex, 0, {
        difference: (receivedCount - tempCountIn + privateCount - tempCountOut) - lastYearCount,
        name: messagesData.private[i].title,
        count: receivedCount - tempCountIn + privateCount - tempCountOut,
        lastCount: lastYearCount
      });
      newFriends.pop();
    }
    tempTalk = [];

  }
  receivedCountPrivate = receivedCount;
  console.log('Done parsing private conversations');
  //iterate through group convo
  for (i = 0; i < messagesData.group.length; i++) {
    tempCountIn = receivedCount;
    tempCountOut = groupCount;



    for (j = 0; j < messagesData.group[i].messages.length; j++) {
      message = messagesData.group[i].messages[j];
      d = new Date(message.timestamp_ms);
      if (d.getYear() + 1900 == year) {
        if (message.sender_name == name) {
          groupCount += 1;
          hourCount[d.getHours()] += 1;

          //get messaage type
          if (message.type == "Generic") {
            if (message.photos != undefined) {
              typeCount[1] += message.photos.length;
            } else if (message.gifs != undefined) {
              typeCount[3] += 1;
            } else if (message.videos != undefined) {
              typeCount[4] += 1;
            } else if (message.sticker != undefined) {
              typeCount[5] += 1;
            } else {
              typeCount[0] += 1;
            }
          } else if (message.type == "Share" && message.share) {
            typeCount[2] += 1;
          }
        } else {
          receivedCount += 1;
        }

        //add to wordCount
        if (message.content != undefined && message.content.length != 0) {
          if (message.sender_name == name) {
            message.content.split(/\s+/).forEach(function(word) {
              word = word.toUpperCase();
              if (wordCount[word] != undefined) {
                wordCount[word] += 1;
              } else {
                wordCount[word] = 1;
              }
            });
          }
        }

        if (message.reactions != undefined) {
          for (k = 0; k < message.reactions.length; k++) {
            if (message.reactions[k].actor == name) {
              if (message.reactions[k].actor == name) {
                switch (message.reactions[k].reaction) {
                  case '\u00f0\u009f\u0098\u008d':
                    reactType[0] += 1;
                    break;
                  case '\u00e2\u009d\u00a4':
                    reactType[1] += 1;
                    break;
                  case '\u00f0\u009f\u0098\u0086':
                    reactType[2] += 1;
                    break;
                  case '\u00f0\u009f\u0098\u00ae':
                    reactType[3] += 1;
                    break;
                  case '\u00f0\u009f\u0098\u00a2':
                    reactType[4] += 1;
                    break;
                  case '\u00f0\u009f\u0098\u00a0':
                    reactType[5] += 1;
                    break;
                  case '\u00f0\u009f\u0091\u008d':
                    reactType[6] += 1;
                    break;
                  case '\u00f0\u009f\u0091\u008e':
                    reactType[7] += 1;
                    break;
                }
                break;
              }
            }
          }
        }
      }
    }
    if (groupCount - tempCountOut > topGroupOut.count) {
      topGroupOut.count = groupCount - tempCountOut;
      topGroupOut.name = messagesData.group[i].title;

    }
    if (receivedCount - tempCountIn > topGroupIn.count) {
      topGroupIn.count = receivedCount - tempCountIn;
      topGroupIn.name = messagesData.group[i].title;
    }
  }

  //find the top 3 percentage lost connections and new friends
  let topPercentageLost = [{
      percentage: 0
    }, {
      percentage: 0
    }, {
      percentage: 0
    }],
    topPercentageGain = [{
      percentage: 0
    }, {
      percentage: 0
    }, {
      percentage: 0
    }];
  for (i = 0; i < 10; i++) {
    lostConnections[i].percentage = Math.floor((lostConnections[i].difference / lostConnections[i].lastCount) * 100);
    newFriends[i].percentage = Math.floor((newFriends[i].difference / (newFriends[i].lastCount + newFriends[i].difference)) * 100);

    //top merging for lost connection
    tempIndex = 3;
    while (tempIndex > 0 && lostConnections[i].percentage > topPercentageLost[tempIndex - 1].percentage) {
      tempIndex -= 1;
    }
    if (tempIndex != 3) {
      topPercentageLost.splice(tempIndex, 0, {
        difference: lostConnections[i].difference,
        name: lostConnections[i].name,
        count: lostConnections[i].count,
        lastCount: lostConnections[i].lastCount,
        percentage: lostConnections[i].percentage
      });
      topPercentageLost.pop();
    }

    //top merging for new friends
    tempIndex = 3;
    while (tempIndex > 0 && newFriends[i].percentage > topPercentageGain[tempIndex - 1].percentage) {
      tempIndex -= 1;
    }
    if (tempIndex != 3) {
      topPercentageGain.splice(tempIndex, 0, {
        difference: newFriends[i].difference,
        name: newFriends[i].name,
        count: newFriends[i].count,
        lastCount: newFriends[i].lastCount,
        percentage: newFriends[i].percentage
      });
      topPercentageGain.pop();
    }
  }

  // escape messages for html
  for (i = 0; i < deepTalk.messages.length; i++) {
    if (deepTalk.messages[i].content != undefined) {
      deepTalk.messages[i].content = escapeHtml(deepTalk.messages[i].content);
    }
  }

  //sort final wordcount list and get top 100
  var finalWordsArray = [];
  finalWordsArray = Object.keys(wordCount).map(function(key) {
    return {
      text: key,
      size: wordCount[key]
    };
  });
  finalWordsArray.sort(function(a, b) {
    return b.size - a.size;
  });
  finalWordsArray.length = 100;

  deepTalk.timeElapsed = ((deepTalk.messages[deepTalk.messages.length - 1].timestamp_ms - deepTalk.messages[0].timestamp_ms) / 3600000).toFixed(2);

  console.log('Done parsing group conversations');
  messagesData['year_' + year].year = year;
  messagesData['year_' + year].privateCount = privateCount;
  messagesData['year_' + year].groupCount = groupCount;
  messagesData['year_' + year].messageCount = privateCount + groupCount;
  messagesData['year_' + year].hourlyCount = hourCount;
  messagesData['year_' + year].typeCount = typeCount;
  messagesData['year_' + year].reactType = reactType;
  messagesData['year_' + year].receivedCount = receivedCount;
  messagesData['year_' + year].reactCount = 0;
  messagesData['year_' + year].topPrivateIn = topPrivateIn;
  messagesData['year_' + year].topPrivateOut = topPrivateOut;
  messagesData['year_' + year].topGroupIn = topGroupIn;
  messagesData['year_' + year].topGroupOut = topGroupOut;
  messagesData['year_' + year].receivedCountPrivate = receivedCountPrivate;
  messagesData['year_' + year].reactCount = reactType.reduce((a, b) => a + b, 0);
  messagesData['year_' + year].deepTalk = deepTalk;
  messagesData['year_' + year].lostConnections = topPercentageLost;
  messagesData['year_' + year].newFriends = newFriends;
  messagesData['year_' + year].wordCount = finalWordsArray;
}


function ready() {
  mainWindow.webContents.send('2019data', messagesData.year_2019);
  mainWindow.webContents.send('contacts', contactList());
  mainWindow.webContents.send('dashboard', getData('', 0, 0));
  mainWindow.webContents.send('loading', 'done');
}

function findConvo(title) {

}

function setupMessages(startPath) {
  global.messagesData = {}
  messagesData.private = []
  messagesData.group = []
  cbCount = 0;

  //passsing directoryPath and callback function
  function listDir(directoryPath) {
    fs.readdir(directoryPath, (er, files) => {

      if (er) throw er;
      //listing all files using forEach
      files.forEach(function(file) {
        var aPath = directoryPath + '/' + file;
        if (fs.lstatSync(aPath).isDirectory()) {
          if (!aPath.endsWith('message_requests')) {
            listDir(aPath);
          }
        } else if (aPath.endsWith('.json')) { //if the file is JSON
          cbCount += 1;
          fs.readFile(aPath, (err, data) => {
            if (err) throw err;
            parsed = JSON.parse(data);
            if (parsed.thread_type == 'Regular') {
              find = -1;
              for (j = 0; j < messagesData.private.length; j++) {
                if (messagesData.private[j].title == parsed.title) {
                  find = j;
                }
              }
              if (find == -1) {
                messagesData.private.push(parsed);
              } else {
                messagesData.private[find].messages = messagesData.private[find].messages.concat(parsed.messages);
              }
            } else if (parsed.thread_type == 'RegularGroup') {
              find = -1;
              for (j = 0; j < messagesData.group.length; j++) {
                if (messagesData.group[j].title == parsed.title) {
                  find = j;
                }
              }
              if (find == -1) {
                messagesData.group.push(parsed);
              } else {
                messagesData.group[find].messages = messagesData.group[find].messages.concat(parsed.messages);
              }
            }
            cbCount -= 1;
            if (cbCount == 0) {
              console.log('Done loading files');
              processData();
              processYear(2019);
              ready();
            }
          });
        }
      });
    });
  }

  listDir(startPath);
}


//Create Menu template
const mainMenuTemplate = [{
  label: 'File',
  submenu: [{
    label: 'Quit',
    accelerator: process.platform == 'darwin' ? 'Command+W' : 'Ctrl+W',
    click() {
      app.quit();
    }
  }]
}]

//If mac, add empty to menu
if (process.platform == 'darwin') {
  mainMenuTemplate.unshift({});
}

// Add developer tools if not in production
if (process.env.NODE_ENV !== 'production') {
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu: [{
        label: 'Toggle DevTools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  })
}
