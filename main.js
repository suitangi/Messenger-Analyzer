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

const stopWords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "ill", "i'm", "im", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "r", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "u", "ur", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "https://www", "<", ">", ""];


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
  ipcMain.on('dashboard', (event, arg) => {
    mainWindow.webContents.send('dashboard', getData(arg[0], arg[1], arg[2]));
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

//function preProcess data
function preProcessData() {
  mainWindow.webContents.send('loading', 'parsing');
  //get the name of the user
  messagesData.user_name = (messagesData.private[0].participants[1] != undefined) ? messagesData.private[0].participants[1].name :
    messagesData.private[1].participants[1];
  let name = messagesData.user_name,
    part_table = {};

  //iterate through private conversations
  for (i = 0; i < messagesData.private.length; i++) {

    //sort the messages list
    messagesData.private[i].messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);

    //encode name
    messagesData.private[i].title = utf8.decode(messagesData.private[i].title);

    //set participant nicknames
    for (j = 0; j < messagesData.private[i].participants.length; j++) {
      messagesData.private[i].participants[j].name = utf8.decode(messagesData.private[i].participants[j].name);

      messagesData.private[i].participants[j].nickname = messagesData.private[i].participants[j].name;
      messagesData.private[i].participants[j].nickname_history = [{
        name: messagesData.private[i].participants[j].name
      }];
      messagesData.private[i].participants[j].active = true;
    }

    //iterate through each message
    for (j = 0; j < messagesData.private[i].messages.length; j++) {

      message = messagesData.private[i].messages[j];
      //encode all emojis and filter messages
      if (message.content != undefined && message.content.length != 0) {
        message.content = utf8.decode(message.content);
        message.content = message.content.replace(/’/g, '\'');

        if (((message.content.includes(' set the nickname for ') && message.content.includes(' to ')) ||
            (message.content.includes(' set her own nickname to ')) ||
            (message.content.includes(' set his own nickname to ')) ||
            (message.content.includes(' set your nickname to '))) &&
          message.type == 'Generic' && message.content.endsWith('.')) {

          if ((message.content.includes(' set the nickname for ') && message.content.includes(' to ')) ||
            (message.content.includes(' set her own nickname to ')) ||
            (message.content.includes(' set his own nickname to '))) {
            tempName = messagesData.private[i].participants[0].name;
            person = messagesData.private[i].participants[0];
          } else if (message.content.includes(' set your nickname to ')) {
            tempName = name;
            person = messagesData.private[i].participants[1];
          }

          message.type = "Nickname";
          regx = /(?<= to )(.+)(?=\.)/g;
          if (message.content.match(regx) != null) {
            tempName = message.content.match(regx)[0];
          }
          person.nickname = tempName;
          person.nickname_history.push({
            name: tempName,
            sender: message.sender_name,
            time: message.timestamp_ms
          });
        }
      }
    }
    messagesData.private[i].nickname_translate = {};
    for (j = 0; j < messagesData.private[i].participants.length; j++) {
      messagesData.private[i].nickname_translate[messagesData.private[i].participants[j].name] = messagesData.private[i].participants[j].nickname;
    }
  }

  //iterate through group conversations
  for (i = 0; i < messagesData.group.length; i++) {

    //sort the messages list
    messagesData.group[i].messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);

    part_table = {};

    //encode name
    messagesData.group[i].title = utf8.decode(messagesData.group[i].title);

    //set participant nicknames and lookup table and encode names
    for (j = 0; j < messagesData.group[i].participants.length; j++) {
      messagesData.group[i].participants[j].name = utf8.decode(messagesData.group[i].participants[j].name);

      messagesData.group[i].participants[j].nickname = messagesData.group[i].participants[j].name;
      messagesData.group[i].participants[j].nickname_history = [{
        name: messagesData.group[i].participants[j].name
      }];
      part_table[messagesData.group[i].participants[j].name] = messagesData.group[i].participants[j];
    }



    //iterate through each message
    for (j = 0; j < messagesData.group[i].messages.length; j++) {
      message = messagesData.group[i].messages[j];

      if (part_table[message.sender_name] == undefined) {
        messagesData.group[i].participants.push({
          name: message.sender_name,
          nickname: message.sender_name,
          nickname_history: [{
            name: message.sender_name
          }],
          active: false
        });
        part_table[message.sender_name] = messagesData.group[i].participants[messagesData.group[i].participants.length - 1];
      }

      //encode all emojis
      if (message.content != undefined && message.content.length != 0) {
        message.content = utf8.decode(message.content);
        message.content = message.content.replace(/’/g, '\'');
        if (((message.content.includes(' set the nickname for ') && message.content.includes(' to ')) ||
            message.content.includes(' set your nickname to ') ||
            message.content.includes(' set her own nickname to ') ||
            message.content.includes(' set his own nickname to ')) &&
          message.type == 'Generic' && message.content.endsWith('.')) {
          if (message.content.includes(' set the nickname for ') && message.content.includes(' to ')) {
            regx = /(?<= set the nickname for )(.+?)(?= to )/g;
            tempName = message.content.match(regx)[0];
          } else if (message.content.includes(' set her own nickname to ')) {
            tempName = message.sender_name;
          } else if (message.content.includes(' set his own nickname to ')) {
            tempName = message.sender_name;
          } else if (message.content.includes(' set your nickname to ')) {
            tempName = name;
          }
          person = part_table[tempName];
          if (person == undefined) {
            messagesData.group[i].participants.push({
              name: tempName,
              nickname: tempName,
              nickname_history: [{
                name: tempName
              }],
              active: false
            });
            part_table[tempName] = messagesData.group[i].participants[messagesData.group[i].participants.length - 1];
            person = part_table[tempName];
          }
          message.type = "Nickname";
          regx = /(?<= to )(.+)(?=\.)/g;
          if (message.content.match(regx) != null) {
            tempName = message.content.match(regx)[0];
          }
          person.nickname = tempName;
          person.nickname_history.push({
            name: tempName,
            sender: message.sender_name,
            time: message.timestamp_ms
          });
        } else if (message.content.includes(' cleared the nickname for ')) {
          regx = /(?<= cleared the nickname for )(.+)(?=\.)/g;
          tempName = message.content.match(regx)[0];
          person = part_table[tempName];
          if (person != undefined) {
            message.type = "Nickname";
            person.nickname = person.name;
            person.nickname_history.push({
              name: person.name,
              sender: message.sender_name,
              time: message.timestamp_ms
            });
          }
        }
      }
    }
    messagesData.group[i].nickname_translate = {};
    for (j = 0; j < messagesData.group[i].participants.length; j++) {
      messagesData.group[i].nickname_translate[messagesData.group[i].participants[j].name] = messagesData.group[i].participants[j].nickname;
    }
  }
}

//function process data
function processData() {
  let i, j, k, message, person, regx, tempName, name, nickname,
    firstMsg = {
      timestamp_ms: 9999999999999
    },
    lastMsg = {
      timestamp_ms: -1
    };

  //get the name of the user
  name = messagesData.user_name;

  //iterate through private conversations
  for (i = 0; i < messagesData.private.length; i++) {

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
      //encode all emojis and filter messages
      if (message.content != undefined && message.content.length != 0) {
        nickname = messagesData.private[i].participants[0].nickname;
        if ((message.content == 'The video chat ended.' && message.type == 'Generic') ||
          (message.content == 'You called ' + nickname + '.' && message.type == 'Generic') ||
          (message.content == nickname + ' called you.' && message.type == 'Generic') ||
          (message.content == 'You and ' + nickname + ' can now see each other.' && message.type == 'Generic') ||
          (message.content == 'You stopped viewing ' + nickname + '\'s video.' && message.type == 'Generic') ||
          (message.content == nickname + ' stopped sharing video.' && message.type == 'Generic') ||
          (message.content == nickname + ' started sharing video.' && message.type == 'Generic')) {
          message.type = "Call";
        } else if ((message.content == nickname + ' missed your call.' && message.type == 'Generic') ||
          (message.content == 'You missed a call from ' + nickname + '.' && message.type == 'Generic') ||
          (message.content == nickname + ' missed your video chat.' && message.type == 'Generic') ||
          (message.content == 'You missed a video chat with ' + nickname + '.' && message.type == 'Generic')) {
          message.type = "Call";
          message.missed = true;
        } else if ((message.content.endsWith(' is happening now.') && message.type == 'Generic') ||
          (message.content.includes(' responded Going to ') && message.type == 'Generic') ||
          (message.content.includes(' responded Can\'t Go to ') && message.type == 'Generic') ||
          (message.content.includes(' created the reminder: ') && message.type == 'Generic' && message.content.endsWith('.')) ||
          (message.content.includes(' updated the reminder: ') && message.type == 'Generic' && message.content.endsWith('.'))) {
          message.type = "Event";
        } else if ((message.content.startsWith(nickname + ' scored ') && message.content.endsWith(' in a game.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' scored ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' scored ') && message.content.includes(' playing ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' set a new personal best of ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' set the new high score of ') && message.content.includes(' points playing') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' is now in first place in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' moved up the leaderboard in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith('You challenged ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' challenged you in ') && message.content.endsWith('.') && message.type == 'Generic')) {
          message.type = "Game";
        } else if (message.content.startsWith(nickname + ' set the emoji to ') && message.content.endsWith('.') && message.type == 'Generic') {
          message.type = "Emoji";
        } else if (message.content == (nickname + ' changed the chat theme.') && message.type == 'Generic') {
          message.type = "Theme";
        }
      }
    }
  }

  //iterate through group conversations
  for (i = 0; i < messagesData.group.length; i++) {

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
    messagesData.group[i].title_history = [];

    //iterate through each message
    for (j = 0; j < messagesData.group[i].messages.length; j++) {
      message = messagesData.group[i].messages[j];
      //encode all emojis
      nickname = messagesData.group[i].nickname_translate[message.sender_name];
      if (message.content != undefined && message.content.length != 0) {
        if ((message.content == 'The video chat ended.' && message.type == 'Generic') ||
          (message.content == (nickname + ' started a video chat.') && message.type == 'Generic') ||
          (message.content == (nickname + ' joined the video chat.') && message.type == 'Generic') ||
          (message.content == (nickname + ' started sharing video.') && message.type == 'Generic') ||
          (message.content == (nickname + ' started a call.') && message.type == 'Generic') ||
          (message.content == (nickname + ' joined the call.') && message.type == 'Generic')) {
          message.type = "Call";
        } else if ((message.content.endsWith(' is happening now.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' responded Going to ') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' responded Can\'t Go to ') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' created the reminder: ') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' updated the reminder: ') && message.type == 'Generic') ||
          (message.content == (nickname + ' updated the reminder time.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' updated the reminder location to ') && message.type == 'Generic' && message.content.endsWith('.')) ||
          (message.content == (nickname + ' removed the reminder location.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' turned off the reminder: ') && message.type == 'Generic') ||
          (message.content == (nickname + ' started a plan.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' updated the plan location to ') && message.type == 'Generic' && message.content.endsWith('.')) ||
          (message.content == (nickname + ' removed the plan location.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' updated the plan to ') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' named the plan ') && message.type == 'Generic')) {
          message.type = "Event";
        } else if ((message.content.endsWith(' is happening now.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' voted for \"') && message.content.includes(' in the poll:') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' removed vote for \"') && message.content.includes(' in the poll:') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' changed vote to \"') && message.content.includes(' in the poll:') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' created a poll: ') && message.type == 'Generic')) {
          message.type = "Poll";
        } else if ((message.content.startsWith(nickname + ' scored ') && message.content.endsWith(' in a game.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' scored ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' scored ') && message.content.includes(' playing ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' set a new personal best of ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' set the new high score of ') && message.content.includes(' points playing') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' is now in first place in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' moved up the leaderboard in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith('You challenged ') && message.content.includes(' in ') && message.content.endsWith('.') && message.type == 'Generic') ||
          (message.content.startsWith(nickname + ' challenged you in ') && message.content.endsWith('.') && message.type == 'Generic')) {
          message.type = "Game";
        } else if ((message.content.startsWith(nickname + ' named the group ') && message.type == 'Generic') ||
          (message.content.startsWith('You named the group ') && message.type == 'Generic')) {
          messagesData.group[i].title_history.push({
            name: message.content.substring(message.content.search(' named the group ') + 17, message.content.length - ((message.content.substring(message.content.length - 1) == '.') ? 1 : 0)),
            sender: message.sender_name,
            time: message.timestamp_ms
          });
          message.type = "Group_Name";
        } else if (message.content == (nickname + ' removed the group name.') && message.type == 'Generic') {
          messagesData.group[i].title_history.push({
            name: "",
            sender: message.sender_name,
            time: message.timestamp_ms
          });
          message.type = "Group_Name";
        } else if (message.content.startsWith(nickname + ' set the emoji to ') && message.content.endsWith('.') && message.type == 'Generic') {
          message.type = "Emoji";
        } else if (message.content == (nickname + ' changed the chat theme.') && message.type == 'Generic') {
          message.type = "Theme";
        } else if (message.content == (nickname + ' changed the group photo.') && message.type == 'Generic') {
          message.type = "Group_Photo";
        } else if (message.content == (nickname + ' responded ') && message.type == 'Generic') {
          message.type = "Responded";
        }
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
      name: messagesData.private[i].title,
      type: 'dm',
      id: messagesData.private[i].thread_path
    });
  }
  //iterate through group conversations
  for (i = 0; i < messagesData.group.length; i++) {
    cList.push({
      name: messagesData.group[i].title,
      type: 'group',
      id: messagesData.group[i].thread_path
    });
  }
  console.log("Contact list loaded");
  return cList.sort((a, b) => (a.name > b.name) ? 1 : -1)
}

//process request for data
function getData(contact, startTime, endTime) {
  console.log("Loading data for: " + contact + ", " + startTime + ", " + endTime);
  let messages = [],
    timeLabel = [],
    i, j, k, tempDate, tempDate2, timeUnit, msgCount, cTime, name, messaage, person
  msgSentTime = [],
    msgSent = [],
    activeTime = new Array(1440);
  activeTime.fill(0);
  part_table = {};
  data = {
    participants: [],
    timeLabel: [],
    msgTotal: [],
    activeTotal: [...activeTime],
    details: {}
  };


  //get the name of the user
  name = messagesData.user_name;

  if (contact == "") { //process for all contacts
    data.details.title = "All conversaions";
    data.details.type = "N/A";
    if (startTime == 0 && endTime == 0) { //if date range is all time find the first and last message
      tempDate = new Date(messagesData.firstMsg.timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      startTime = tempDate2.getTime();
      data.details.firstTime = tempDate.toLocaleDateString() + ' ' + tempDate.toLocaleTimeString();
      tempDate = new Date(messagesData.lastMsg.timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      endTime = tempDate2.getTime() + 86399999; //inclusive day
    }
    let parts = ['Sent (DM)', 'Received (DM)', 'Sent (Group)', 'Received (Group)'];
    for (i = 0; i < parts.length; i++) {
      data.participants.push({
        name: parts[i],
        msgTime: [],
        msgPct: [],
        msgType: [0, 0, 0, 0, 0, 0],
        msgCount: 0,
        active: true,
        hourCount: [...activeTime],
        dist: {},
        rctCount: [0, 0, 0, 0, 0, 0, 0, 0],
        stickerCount: {}
      });
      if (i % 2 == 0) {
        data.participants[i].wordCount = {};
      }
    }
    //get the messages and add them to the messages list
    for (i = 0; i < messagesData.private.length; i++) {
      for (j = 0; j < messagesData.private[i].messages.length; j++) {
        if (messagesData.private[i].messages[j].timestamp_ms > startTime &&
          messagesData.private[i].messages[j].timestamp_ms < endTime) {
          messages.push(messagesData.private[i].messages[j]);
          messages[messages.length - 1].fromTitle = messagesData.private[i].title;
          messages[messages.length - 1].fromType = 'DM';
        }
      }
    }
    for (i = 0; i < messagesData.group.length; i++) {
      for (j = 0; j < messagesData.group[i].messages.length; j++) {
        if (messagesData.group[i].messages[j].timestamp_ms > startTime &&
          messagesData.group[i].messages[j].timestamp_ms < endTime) {
          messages.push(messagesData.group[i].messages[j]);
          messages[messages.length - 1].fromTitle = messagesData.group[i].title;
          messages[messages.length - 1].fromType = 'Group';
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
    tempDate = new Date(foundConvo.messages[0].timestamp_ms);
    data.details.firstTime = tempDate.toLocaleDateString() + ' ' + tempDate.toLocaleTimeString();
    data.details.title = foundConvo.title;
    data.details.type = foundConvo.thread_type == 'Regular' ? 'DM' : 'Group';

    //set up group chaat title history
    if (data.details.type == 'Group') {
      data.title_history = foundConvo.title_history;
    }

    //if time range is all, set the restrict the time range to only when conversation was active
    if (startTime == 0 && endTime == 0) {
      tempDate = new Date(foundConvo.messages[0].timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      startTime = tempDate2.getTime();
      tempDate = new Date(foundConvo.messages[foundConvo.messages.length - 1].timestamp_ms);
      tempDate2 = new Date(tempDate.getYear() + 1900, tempDate.getMonth(), tempDate.getDate()); //round down to nearest day
      endTime = tempDate2.getTime() + 86399999; //inclusive day
    }

    //load the participants and info
    let tempNmList = [];
    for (j = 0; j < foundConvo.participants.length; j++) {
      tempNmList = [];
      for (k = 0; k < foundConvo.participants[j].nickname_history.length; k++) {
        if (foundConvo.participants[j].nickname_history[k].time > startTime &&
          foundConvo.participants[j].nickname_history[k].time < endTime) {
          tempNmList.push(foundConvo.participants[j].nickname_history[k]);
          if (tempNmList.length == 0 && k != 0) {
            tempNmList.push(foundConvo.participants[j].nickname_history[k - 1]);
          }
        }
      }
      if (foundConvo.participants[j].name == name) {
        data.participants.unshift({
          name: foundConvo.participants[j].name,
          nickname: foundConvo.participants[j].nickname,
          nickname_history: [...tempNmList],
          msgTime: [],
          msgPct: [],
          msgType: [0, 0, 0, 0, 0, 0],
          msgCount: 0,
          active: true,
          hourCount: [...activeTime],
          react: {},
          reactFrom: {},
          wordCount: {},
          stickerCount: {}
        });
      } else {
        data.participants.push({
          name: foundConvo.participants[j].name,
          nickname: foundConvo.participants[j].nickname,
          nickname_history: [...tempNmList],
          msgTime: [],
          msgPct: [],
          msgType: [0, 0, 0, 0, 0, 0],
          msgCount: 0,
          active: true,
          hourCount: [...activeTime],
          react: {},
          reactFrom: {},
          wordCount: {},
          stickerCount: {}
        });
      }
    }
    for (j = 0; j < data.participants.length; j++) {
      part_table[data.participants[j].name] = data.participants[j];
      data.participants[j].index = j;
    }
    for (j = 0; j < foundConvo.messages.length; j++) {
      if (foundConvo.messages[j].timestamp_ms > startTime &&
        foundConvo.messages[j].timestamp_ms < endTime) {
        messages.push(foundConvo.messages[j]);
      }
    }
  }

  //set up message proximity for groups
  if (data.details.type == 'Group') {
    for (i = 0; i < data.participants.length; i++) {
      data.participants[i].proximity = [];
      for (j = 0; j < data.participants.length; j++) {
        data.participants[i].proximity.push({
          before: true,
          sum: 0,
          count: 0
        });
      }
    }
  } else if (contact != '') { //set up response time for DM's
    for (i = 0; i < data.participants.length; i++) {
      data.participants[i].responseTime = {
        sum: 0,
        count: 0
      };
    }
  }

  tempDate = new Date(startTime);
  tempDate2 = new Date(endTime);
  data.details.range = (tempDate.getMonth() + 1) + '/' + tempDate.getDate() + '/' + (tempDate.getYear() + 1900) +
    " to " +
    (tempDate2.getMonth() + 1) + '/' + tempDate2.getDate() + '/' + (tempDate2.getYear() + 1900);

  messages.sort((a, b) => (a.timestamp_ms > b.timestamp_ms) ? 1 : -1);
  timeUnit = 60000; // < 1 day: 1 min
  data.dateUnit = 'hour';
  if (endTime - startTime >= 441797328000) { // > 14 years: weeks
    timeUnit = 604800000;
    data.dateUnit = 'month';
  } else if (endTime - startTime >= 347126472000) { // > 11 years: 4 days
    timeUnit = 345600000;
    data.dateUnit = 'month';
  } else if (endTime - startTime >= 252455616000) { // > 8 years: 3 days
    timeUnit = 259200000;
    data.dateUnit = 'month';
  } else if (endTime - startTime >= 126227808000) { // > 4 years: 2 days
    timeUnit = 172800000;
    data.dateUnit = 'month';
  } else if (endTime - startTime >= 5259492000) { // > 2 month: 1 day
    timeUnit = 86400000;
    data.dateUnit = 'month';
  } else if (endTime - startTime >= 604800000) { // > 1 week: 1 hour
    timeUnit = 3600000;
    data.dateUnit = 'day';
  } else if (endTime - startTime >= 259200000) { // > 3 days: 10 min
    timeUnit = 600000;
    data.dateUnit = 'hour';
  } else if (endTime - startTime >= 86400000) { // > 1 day: 5 min
    timeUnit = 300000;
    data.dateUnit = 'hour';
  }

  let messageIndex = 0,
    end = true,
    arr, foundIndex, word,
    lastMessage,
    reactor;

  for (cTime = startTime; end; cTime += timeUnit) {

    if (cTime >= endTime && end) {
      end = false;
    }
    for (i = 0; i < data.participants.length; i++) {
      data.participants[i].msgTime.push(0);
    }
    tempDate = new Date(cTime);
    if (timeUnit < 3600000) {
      data.timeLabel.push(((tempDate.getMonth() + 1 < 10) ? ('0' + (tempDate.getMonth() + 1)) : (tempDate.getMonth() + 1)) +
        '-' + ((tempDate.getDate() < 10) ? ('0' + tempDate.getDate()) : tempDate.getDate()) +
        '-' + (tempDate.getYear() + 1900) + ' ' + tempDate.getHours() + ':' + ((tempDate.getMinutes() < 10) ? ('0' + tempDate.getMinutes()) : tempDate.getMinutes()));
    } else if (timeUnit == 3600000) {
      data.timeLabel.push(((tempDate.getMonth() + 1 < 10) ? ('0' + (tempDate.getMonth() + 1)) : (tempDate.getMonth() + 1)) +
        '-' + ((tempDate.getDate() < 10) ? ('0' + tempDate.getDate()) : tempDate.getDate()) +
        '-' + (tempDate.getYear() + 1900) + ' ' + tempDate.getHours() + ':00');
    } else {
      data.timeLabel.push(((tempDate.getMonth() + 1 < 10) ? ('0' + (tempDate.getMonth() + 1)) : (tempDate.getMonth() + 1)) +
        '-' + ((tempDate.getDate() < 10) ? ('0' + tempDate.getDate()) : tempDate.getDate()) +
        '-' + (tempDate.getYear() + 1900));
    }
    while (messageIndex < messages.length && messages[messageIndex].timestamp_ms < cTime) {
      person = undefined;
      message = messages[messageIndex];
      messageIndex++;

      if (contact == "") {
        if (message.sender_name == name) {
          if (message.fromType == 'DM') {
            person = data.participants[0];
          } else {
            person = data.participants[2];
          }
        } else {
          if (message.fromType == 'DM') {
            person = data.participants[1];
          } else {
            person = data.participants[3];
          }
        }
      } else {
        person = part_table[message.sender_name];
        foundIndex = person.index;
        if (person == undefined) {
          console.log("Fatal Error!!!!");
        }
      }

      if (contact == "") {
        //add to wordCount
        if (message.content != undefined && message.content.length != 0 &&
          message.sender_name == name && message.type == 'Generic') {
          message.content.split(/\s+|,|(?<!-|>|=)\.(?!-|>|=)|!|\?|"|(?<!:|=|;|:'|8|-|‑)\(|(?<!:|=|;|:'|8|-|‑|:\^|:c)\)|(?<!D|d):\s|(?<!D|d);\s/).forEach(function(word) {
            word = word.toLowerCase();
            if (person.wordCount[word] != undefined) {
              person.wordCount[word] += 1;
            } else {
              person.wordCount[word] = 1;
            }
          });
        }
        //add to distribution if contact == ""
        if (person.dist[message.fromTitle] == undefined) {
          person.dist[message.fromTitle] = {
            title: message.fromTitle,
            count: 1
          };
        } else {
          person.dist[message.fromTitle].count += 1;
        }
        if (message.reactions != undefined) {
          for (i = 0; i < message.reactions.length; i++) {
            reactor = undefined;
            if (message.fromType == "DM") {
              if (message.reactions[i].actor == name) {
                reactor = data.participants[0];
              } else if (message.sender_name == name) {
                reactor = data.participants[1];
              }
            } else {
              if (message.reactions[i].actor == name) {
                reactor = data.participants[2];
              } else if (message.sender_name == name) {
                reactor = data.participants[3];
              }
            }
            if (reactor != undefined) {
              switch (message.reactions[i].reaction) {
                case '\u00f0\u009f\u0098\u008d':
                  reactor.rctCount[0] += 1;
                  break;
                case '\u00e2\u009d\u00a4':
                  reactor.rctCount[1] += 1;
                  break;
                case '\u00f0\u009f\u0098\u0086':
                  reactor.rctCount[2] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00ae':
                  reactor.rctCount[3] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00a2':
                  reactor.rctCount[4] += 1;
                  break;
                case '\u00f0\u009f\u0098\u00a0':
                  reactor.rctCount[5] += 1;
                  break;
                case '\u00f0\u009f\u0091\u008d':
                  reactor.rctCount[6] += 1;
                  break;
                case '\u00f0\u009f\u0091\u008e':
                  reactor.rctCount[7] += 1;
                  break;
              }
            }
          }
        }
      } else { //get the reactions
        //add to wordCount
        if (message.content != undefined && message.content.length != 0 && message.type == 'Generic') {
          message.content.split(/\s+|,|(?<!-|>|=)\.(?!-|>|=)|!|\?|"|(?<!:|=|;|:'|8|-|‑)\(|(?<!:|=|;|:'|8|-|‑|:\^|:c)\)|(?<!D|d):\s|(?<!D|d);\s/).forEach(function(word) {
            word = word.toLowerCase();
            if (person.wordCount[word] != undefined) {
              person.wordCount[word] += 1;
            } else {
              person.wordCount[word] = 1;
            }
          });
        }
        if (message.reactions != undefined) {
          for (i = 0; i < message.reactions.length; i++) {
            if (person.react[message.reactions[i].actor] == undefined) {
              person.react[message.reactions[i].actor] = {
                count: [0, 0, 0, 0, 0, 0, 0, 0],
                name: message.reactions[i].actor
              };
            }
            switch (message.reactions[i].reaction) {
              case '\u00f0\u009f\u0098\u008d':
                person.react[message.reactions[i].actor].count[0] += 1;
                break;
              case '\u00e2\u009d\u00a4':
                person.react[message.reactions[i].actor].count[1] += 1;
                break;
              case '\u00f0\u009f\u0098\u0086':
                person.react[message.reactions[i].actor].count[2] += 1;
                break;
              case '\u00f0\u009f\u0098\u00ae':
                person.react[message.reactions[i].actor].count[3] += 1;
                break;
              case '\u00f0\u009f\u0098\u00a2':
                person.react[message.reactions[i].actor].count[4] += 1;
                break;
              case '\u00f0\u009f\u0098\u00a0':
                person.react[message.reactions[i].actor].count[5] += 1;
                break;
              case '\u00f0\u009f\u0091\u008d':
                person.react[message.reactions[i].actor].count[6] += 1;
                break;
              case '\u00f0\u009f\u0091\u008e':
                person.react[message.reactions[i].actor].count[7] += 1;
                break;
            }
          }
        }
      }


      //if group and active contact, calculate message proximity
      if (data.details.type == 'Group' && person.active) {
        for (i = 0; i < data.participants.length; i++) {
          if (i != foundIndex) {
            if (person.proximity[i].before && data.participants[i].proximity[foundIndex].distance != undefined) {
              person.proximity[i].sum += data.participants[i].proximity[foundIndex].distance;
              data.participants[i].proximity[foundIndex].sum += data.participants[i].proximity[foundIndex].distance;
              person.proximity[i].count += 1;
              data.participants[i].proximity[foundIndex].count += 1;
              data.participants[i].proximity[foundIndex].distance = 0;
              person.proximity[i].distance = 0;
            }
            for (j = 0; j < data.participants.length; j++) {
              if (j != foundIndex && !data.participants[i].proximity[j].before) {
                if (data.participants[i].proximity[j].distance == undefined) {
                  data.participants[i].proximity[j].distance = 1;
                } else {
                  data.participants[i].proximity[j].distance += 1;
                }
              }
            }
            data.participants[i].proximity[foundIndex].before = true;
            person.proximity[i].before = false;
          }
        }
      } else if (data.details.type == 'DM' && contact != '') {
        if (lastMessage != undefined && lastMessage.sender_name != message.sender_name && message.timestamp_ms - lastMessage.timestamp_ms < 21600000) {
          person.responseTime.count += 1;
          person.responseTime.sum += message.timestamp_ms - lastMessage.timestamp_ms;
        }
        lastMessage = message;
      }

      person.msgCount += 1;
      person.msgTime[person.msgTime.length - 1] += 1;

      //message type
      if (message.type == "Generic") {
        if (message.photos != undefined) {
          person.msgType[1] += message.photos.length;
        } else if (message.gifs != undefined) {
          person.msgType[3] += 1;
        } else if (message.videos != undefined) {
          person.msgType[4] += 1;
        } else if (message.sticker != undefined) {
          person.msgType[5] += 1;
          if (person.stickerCount[message.sticker.uri] == undefined) {
            person.stickerCount[message.sticker.uri] = 1;
          } else {
            person.stickerCount[message.sticker.uri] += 1;
          }
        } else {
          person.msgType[0] += 1;
        }
      } else if (message.type == "Share" && message.share != undefined) {
        if (message.share.link != undefined) {
          person.msgType[2] += 1;
        }
      }

      //get the time active
      d = new Date(message.timestamp_ms)
      person.hourCount[d.getHours() * 60 + d.getMinutes()] += 1;
      data.activeTotal[d.getHours() * 60 + d.getMinutes()] += 1;

      //get the message proximity


    } //end while loop

    //calculate the % of messages in this time period for each participant
    msgCount = 0;
    for (i = 0; i < data.participants.length; i++) {
      msgCount += data.participants[i].msgTime[data.participants[i].msgTime.length - 1];
    }
    data.msgTotal.push(msgCount);
    for (i = 0; i < data.participants.length; i++) {
      if (msgCount == 0) {
        data.participants[i].msgPct.push(0);
      } else {
        data.participants[i].msgPct.push(Math.round(10000 * data.participants[i].msgTime[data.participants[i].msgTime.length - 1] / msgCount) / 100);
      }
    }
  }

  //format words and wordcounts
  let finalWordsArray = [];
  for (i = 0; i < data.participants.length; i++) {
    //sort final wordcount list and get top 100
    if (data.participants[i].wordCount != undefined) {
      finalWordsArray = Object.keys(data.participants[i].wordCount).map(function(key) {
        return {
          text: key,
          size: data.participants[i].wordCount[key]
        };
      });
      finalWordsArray.sort(function(a, b) {
        return b.size - a.size;
      });
      j = 0;
      while (j < 150 && j < finalWordsArray.length) {
        if (stopWords.includes(finalWordsArray[j].text)) {
          finalWordsArray.splice(j, 1);
        } else {
          j++;
        }
      }
      finalWordsArray.length = 150;
      data.participants[i].wordCount = finalWordsArray;
    }

    //get most used sticker
    let max = {
      sticker: "",
      count: 0
    };
    for (const stick in data.participants[i].stickerCount) {
      if (data.participants[i].stickerCount[stick] > max.count) {
        max.sticker = stick;
        max.count = data.participants[i].stickerCount[stick];
      }
    }
    max.sticker = findSticker(max.sticker);
    data.participants[i].favSticker = max;
  }

  //format data for message distribution
  if (contact == "") {
    let distList = []
    for (i = 0; i < data.participants.length; i++) {
      distList = Object.values(data.participants[i].dist);
      data.participants[i].dist = distList;
      data.participants[i].dist.sort((a, b) => (a.count < b.count) ? 1 : -1);
      if (data.participants[i].dist.length > 15) {
        for (j = 15; j < data.participants[i].dist.length; j++) {
          data.participants[i].dist[14].count += data.participants[i].dist[j].count;
        }
        data.participants[i].dist.length = 15;
        data.participants[i].dist[14].title = "Others";
      }
    }
  } else {
    let reactTo = [],
      reactFrom = [];
    for (i = 0; i < data.participants.length; i++) {
      reactTo = Object.values(data.participants[i].react);
      data.participants[i].react = reactTo;
      //reactions calculations
      for (k = 0; k < data.participants[i].react.length; k++) {
        for (j = 0; j < data.participants.length; j++) {
          if (data.participants[j].name == data.participants[i].react[k].name) {
            if (data.participants[j].reactFrom[data.participants[i].name] == undefined) {
              data.participants[j].reactFrom[data.participants[i].name] = {
                name: data.participants[i].name
              };
            }
            data.participants[j].reactFrom[data.participants[i].name].count = data.participants[i].react[k].count;
          } // end if
        } //end j loop
      } //end k loop
    } //end i loop
    for (i = 0; i < data.participants.length; i++) {
      if (data.participants[i].reactFrom != undefined) {
        reactFrom = Object.values(data.participants[i].reactFrom);
        data.participants[i].reactFrom = reactFrom;
      }
    }
  } // end else


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
  name = messagesData.user_name;


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
        if (message.content != undefined && message.content.length != 0 &&
          message.sender_name == name && message.type == 'Generic') {
          message.content.split(/\s+|,|(?<!-|>|=)\.(?!-|>|=)|!|\?|"|(?<!:|=|;|:'|8|-|‑)\(|(?<!:|=|;|:'|8|-|‑|:\^|:c)\)|(?<!D|d):\s|(?<!D|d);\s/).forEach(function(word) {
            word = word.toLowerCase();
            if (wordCount[word] != undefined) {
              wordCount[word] += 1;
            } else {
              wordCount[word] = 1;
            }
          });
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
        if (message.content != undefined && message.content.length != 0 &&
          message.sender_name == name && message.type == 'Generic') {
          message.content.split(/\s+|,|(?<!-|>|=)\.(?!-|>|=)|!|\?|"|(?<!:|=|;|:'|8|-|‑)\(|(?<!:|=|;|:'|8|-|‑|:\^|:c)\)|(?<!D|d):\s|(?<!D|d);\s/).forEach(function(word) {
            word = word.toLowerCase();
            if (word != "" && !stopWords.includes(word)) {
              if (wordCount[word] != undefined) {
                wordCount[word] += 1;
              } else {
                wordCount[word] = 1;
              }
            }
          });
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
  let finalWordsArray = [];
  finalWordsArray = Object.keys(wordCount).map(function(key) {
    return {
      text: key,
      size: wordCount[key]
    };
  });
  finalWordsArray.sort(function(a, b) {
    return b.size - a.size;
  });
  j = 0;
  while (j < 100 && j < finalWordsArray.length) {
    if (stopWords.includes(finalWordsArray[j].text)) {
      finalWordsArray.splice(j, 1);
    } else {
      j++;
    }
  }
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
  mainWindow.webContents.send('dashboardStart', getData('', 0, 0));
  mainWindow.webContents.send('loading', 'done');
}

function findSticker(stickername) {
  var filePath;
  var files = fs.readdirSync(global.startDir)

  files.forEach(function(file) {
    var aPath = global.startDir + '/' + file;
    if (fs.existsSync(aPath + '/' + stickername)) {
      filePath = aPath + '/' + stickername;
    }
  });
  return filePath;
}

function setupMessages(startPath) {
  global.startDir = startPath;
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
                if (messagesData.private[j].thread_path == parsed.thread_path) {
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
                if (messagesData.group[j].thread_path == parsed.thread_path) {
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
              preProcessData();
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
