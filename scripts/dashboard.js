//requires
const {
  dialog
} = require('electron').remote

const {
  ipcRenderer
} = require('electron')

const shell = require('electron').shell;

//helper functions
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

window.graphColors = [
  '#214f91',
  '#6b5899',
  '#9b629a',
  '#c17297',
  '#dc8694',
  '#efa093',
  '#fabc99',
  '#ffdaa8',
  '#cfffc4',
  '#a7eec6',
  '#86dbc7',
  '#6ec7c6',
  '#61b1c0',
  '#5e9cb4',
  '#60718f',
  '#333333',
  '#525252',
  '#747474',
  '#979797',
  '#bcbcbc',
  '#e2e2e2'
]

function hexToRgb(hex, alpha) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return 'rgba(' + parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16) + ", " + alpha + ")";
}

function dashGraphs(data) {
  let i, h, m, j, k,
    msgTime = [],
    msgPct = [],
    dev = [],
    avg, std,
    partiSelectHtml = '',
    activeHtml = '',
    partiListHtml = '',
    rctToHtml = '',
    rctFromHtml = '',
    nickHtml = '',
    wordTotalSelectHtml = '';

  window.names = [];
  window.activeNames = [];
  window.activeLabel = [];
  window.activeTime = [];
  window.activeDeviation = [];
  window.messageTypeTotal = [0, 0, 0, 0, 0, 0];

  //for reacts
  window.reactToData = [];
  window.reactFromData = [];
  window.reactToType = [];
  window.reactFromType = [];
  window.rctToIndex = 0;
  window.rctFromIndex = 0;
  window.rctToPerson = true;
  window.rctFromPerson = true;
  window.reactTotals = [0, 0, 0, 0, 0, 0, 0, 0];
  window.reactToDistData = [];
  window.reactFromDistData = [];

  window.reactions = ['😍', '❤️', '😆', '😮', '😢', '😠', '👍', '👎'];

  for (i = 0; i < window.reactions.length; i++) {
    window.reactToDistData.push({
      label: [],
      data: []
    });
    window.reactFromDistData.push({
      label: [],
      data: []
    });
  }

  //set up label for activetime
  for (i = 0; i < 1440; i++) {
    h = Math.floor(i / 60);
    m = i % 60;
    window.activeLabel.push(
      (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m)
    );
  }


  for (i = 0; i < data.participants.length; i++) {
    partiSelectHtml += '<option>' + data.participants[i].name + '</option>';
    partiListHtml += '<li>' + data.participants[i].name + ((!data.participants[i].active) ? '<span class="removed">   (Inactive)</span>' : '') + '</li>';
    if (i % 2 == 0) {
      wordTotalSelectHtml += '<option>' + data.participants[i].name + '</option>';
    }

    for (j = 0; j < window.messageTypeTotal.length; j++) {
      window.messageTypeTotal[j] += data.participants[i].msgType[j];
    }

    window.names.push(data.participants[i].name);
    if (i < data.participants.length) {
      window.activeNames.push(data.participants[i].name);
      activeHtml += '<option>' + data.participants[i].name + '</option>';
    }

    if (data.details.type != "N/A") {
      nickHtml += '<option>' + data.participants[i].name + ' (' + data.participants[i].nickname_history.length + ')</option>';
      if (data.participants[i].react.length != 0) {
        rctToHtml += '<option value="' + i + '">' + data.participants[i].name + '</option>';
        window.reactToType.push([0, 0, 0, 0, 0, 0, 0, 0]);
        window.reactToData.push({
          labels: [],
          datasets: []
        });
        for (j = 0; j < window.reactions.length; j++) {
          window.reactToData[window.reactToData.length - 1].datasets.push({
            label: window.reactions[j],
            data: [],
            borderColor: window.graphColors[j],
            pointBackgroundColor: window.graphColors[j],
            backgroundColor: window.graphColors[j]
          });
          window.reactToDistData[j].label.push(data.participants[i].name);
        }

        for (j = 0; j < data.participants[i].react.length; j++) {
          window.reactToData[window.reactToData.length - 1].labels.push(data.participants[i].react[j].name);
          for (k = 0; k < data.participants[i].react[j].count.length; k++) {
            if (j == 0) {
              window.reactToDistData[k].data.push(0);
            }
            window.reactToType[window.reactToType.length - 1][k] += data.participants[i].react[j].count[k];
            window.reactToData[window.reactToData.length - 1].datasets[k].data.push(data.participants[i].react[j].count[k]);
            //add to totals
            window.reactTotals[k] += data.participants[i].react[j].count[k];
            window.reactToDistData[k].data[window.reactToDistData[k].data.length - 1] += data.participants[i].react[j].count[k];
          }
        }
      }
      if (data.participants[i].reactFrom.length != 0) {
        rctFromHtml += '<option value="' + i + '">' + data.participants[i].name + '</option>';
        window.reactFromType.push([0, 0, 0, 0, 0, 0, 0, 0]);
        window.reactFromData.push({
          labels: [],
          datasets: []
        });
        for (j = 0; j < window.reactions.length; j++) {
          window.reactFromData[window.reactFromData.length - 1].datasets.push({
            label: window.reactions[j],
            data: [],
            borderColor: window.graphColors[j],
            pointBackgroundColor: window.graphColors[j],
            backgroundColor: window.graphColors[j]
          });
          window.reactFromDistData[j].label.push(data.participants[i].name);
        }
        for (j = 0; j < data.participants[i].reactFrom.length; j++) {
          window.reactFromData[window.reactFromData.length - 1].labels.push(data.participants[i].reactFrom[j].name);
          for (k = 0; k < data.participants[i].reactFrom[j].count.length; k++) {
            if (j == 0) {
              window.reactFromDistData[k].data.push(0);
            }
            window.reactFromType[window.reactFromType.length - 1][k] += data.participants[i].reactFrom[j].count[k];
            window.reactFromData[window.reactFromData.length - 1].datasets[k].data.push(data.participants[i].reactFrom[j].count[k]);
            window.reactFromDistData[k].data[window.reactFromDistData[k].data.length - 1] += data.participants[i].reactFrom[j].count[k];
          }
        }
      }
    }
    msgTime.push({
      label: data.participants[i].name,
      data: data.participants[i].msgTime,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 2,
      hidden: true
    });
    msgPct.push({
      label: data.participants[i].name,
      data: data.participants[i].msgPct,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: window.graphColors[i],
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 2
    });
    window.activeTime.push({
      label: data.participants[i].name,
      data: data.participants[i].hourCount,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 2,
      hidden: true
    });
    dev = [];
    avg = data.participants[i].hourCount.reduce((a, b) => a + b, 0) / 1440;
    std = Math.sqrt(data.participants[i].hourCount.reduce(function(sq, n) {
      return sq + Math.pow(n - m, 2);
    }, 0) / (1439));
    for (j = 0; j < 1440; j++) {
      dev.push(Math.round(((data.participants[i].hourCount[j] - avg) / std + Number.EPSILON) * 100) / 100);
    }
    window.activeDeviation.push({
      label: data.participants[i].name,
      data: [...dev],
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 2,
      hidden: true
    });

    if (data.details.type == 'Group') {
      if (data.participants[i].proximity != undefined) {
        data.participants[i].proxAvg = [];
        for (j = 0; j < data.participants[i].proximity.length; j++) {
          if (i != j) {
            data.participants[i].proxAvg.push(1 / (data.participants[i].proximity[j].sum / data.participants[i].proximity[j].count) + Number.EPSILON);
          }
        }
      }
    }

  } //end for loop

  msgTime.unshift({
    label: "Total",
    data: data.msgTotal,
    borderColor: "#92d0de",
    pointBackgroundColor: "#92d0de",
    backgroundColor: "rgba(255,255,255, 0)",
    borderWidth: 1,
    pointRadius: 0,
    pointHoverRadius: 2,
  });
  window.activeTime.unshift({
    label: "Total",
    data: data.activeTotal,
    borderColor: "#92d0de",
    pointBackgroundColor: "#92d0de",
    backgroundColor: "rgba(255,255,255, 0)",
    borderWidth: 1,
    pointRadius: 0,
    pointHoverRadius: 2,
  });
  dev = [];
  avg = window.activeTime[0].data.reduce((a, b) => a + b, 0) / 1440;
  std = Math.sqrt(window.activeTime[0].data.reduce(function(sq, n) {
    return sq + Math.pow(n - m, 2);
  }, 0) / (1439));
  for (j = 0; j < 1440; j++) {
    dev.push(Math.round(((window.activeTime[0].data[j] - avg) / std + Number.EPSILON) * 100) / 100);
  }
  window.activeDeviation.unshift({
    label: 'Total',
    data: [...dev],
    borderColor: "#92d0de",
    pointBackgroundColor: "#92d0de",
    backgroundColor: "rgba(255,255,255, 0)",
    borderWidth: 1,
    pointRadius: 0,
    pointHoverRadius: 2,
  });

  if (window.msgSent) {
    window.msgSent.destroy();
    window.msgType.destroy();
    window.msgTime.destroy();
    window.msgPct.destroy();
    window.msgActive.destroy();
    window.reactToBar.destroy();
    window.reactFromBar.destroy();
    window.reactTotal.destroy();
    window.reactToDist.destroy();
    window.reactFromDist.destroy();
  }
  if (window.msgProx) {
    window.msgProx.destroy();
  }

  window.msgType = pieChart(document.getElementById('msgTypePie'), window.messageTypeTotal, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers'], true);
  window.msgTime = lineChart(document.getElementById('msgLine'), msgTime, data.timeLabel, false, data.dateUnit);
  window.msgPct = lineChart(document.getElementById('msgPctLine'), msgPct, data.timeLabel, true, data.dateUnit);
  window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeTime, window.activeLabel, 'Message Count');

  document.getElementById("messageTypeSelect").selectedIndex = -1;
  document.getElementById("messageActiveSelect").selectedIndex = 0;
  document.getElementById("reactToTypeSelect").selectedIndex = 0;
  document.getElementById("reactFromTypeSelect").selectedIndex = 0;
  document.getElementById("reactToDistSelect").selectedIndex = 0;
  document.getElementById("reactFromDistSelect").selectedIndex = 0;
  document.getElementById('messageTypeSelect').innerHTML = '<option>Total</option>' + partiSelectHtml;
  document.getElementById('participantList').innerHTML = partiListHtml;
  document.getElementById('chatTitle').innerText = data.details.title;
  document.getElementById('chatType').innerText = data.details.type;
  document.getElementById('detailDRange').innerText = data.details.range;
  document.getElementById('firstDate').innerText = data.details.firstTime;

  if (data.details.type == 'Group') {
    document.getElementById('messageProxSelect').innerHTML = activeHtml;
    document.getElementById('messageProxSelect').style = "";
    document.getElementById('msgProxTitle').innerText = "Message Proximity for ";
    window.msgProx = vertBarChart(document.getElementById('msgProxResp'), data.participants[0].proxAvg, allButOne(window.activeNames, 0), 'Proximity');
    window.reactToBar = stackedBar(document.getElementById('reactToChart'), window.reactToData[0]);
    window.reactFromBar = stackedBar(document.getElementById('reactFromChart'), window.reactFromData[0]);
    window.reactToDist = pieChart(document.getElementById('reactToDistChart'), window.reactToDistData[0].data, window.reactToDistData[0].label, false);
    window.reactFromDist = pieChart(document.getElementById('reactFromDistChart'), window.reactFromDistData[0].data, window.reactFromDistData[0].label, false);
    document.getElementById('reactFromTypeSpan').style = "";
    document.getElementById('reactToTypeSpan').style = "";
    document.getElementById('reactToTitle').innerText = "Reactions to ";
    document.getElementById('reactFromTitle').innerText = "Reactions from ";
    document.getElementById('reactToSelect').innerHTML = rctToHtml;
    document.getElementById('reactFromSelect').innerHTML = rctFromHtml;
    document.getElementById('nicknameSelect').innerHTML = '<option>Group (' + data.title_history.length + ')</option>' + nickHtml;
    document.getElementById('messageWordsSelect').innerHTML = partiSelectHtml;
    document.getElementById('stickerSelect').innerHTML = partiSelectHtml;
  } else if (data.details.type == 'DM') {
    document.getElementById('messageProxSelect').style = "Display: none";
    document.getElementById('msgProxTitle').innerText = "Average Response Time";
    window.msgProx = vertBarChart(document.getElementById('msgProxResp'), [
      Math.round((data.participants[0].responseTime.sum / data.participants[0].responseTime.count / 1000 + Number.EPSILON) * 100) / 100,
      Math.round((data.participants[1].responseTime.sum / data.participants[1].responseTime.count / 1000 + Number.EPSILON) * 100) / 100,
    ], window.names, 'Average Response Time (s)');
    window.rctToPerson = false;
    window.reactToBar = pieChart(document.getElementById('reactToChart'), window.reactToType[window.rctToIndex], window.reactions, false);
    window.rctFromPerson = false;
    window.reactFromBar = pieChart(document.getElementById('reactFromChart'), window.reactFromType[window.rctFromIndex], window.reactions, false);
    window.reactToDist = pieChart(document.getElementById('reactToDistChart'), window.reactToDistData[0].data, window.reactToDistData[0].label, false);
    window.reactFromDist = pieChart(document.getElementById('reactFromDistChart'), window.reactFromDistData[0].data, window.reactFromDistData[0].label, false);
    document.getElementById('reactFromTypeSpan').style = "display: none;";
    document.getElementById('reactToTypeSpan').style = "display: none;";
    document.getElementById('reactToTitle').innerText = "Reactions to ";
    document.getElementById('reactFromTitle').innerText = "Reactions from ";
    document.getElementById('reactToSelect').innerHTML = rctToHtml;
    document.getElementById('reactFromSelect').innerHTML = rctFromHtml;
    document.getElementById('nicknameSelect').innerHTML = nickHtml;
    document.getElementById('messageWordsSelect').innerHTML = partiSelectHtml;
    document.getElementById('stickerSelect').innerHTML = partiSelectHtml;
  } else {
    window.reactToType = [data.participants[0].rctCount, data.participants[2].rctCount];
    window.reactFromType = [data.participants[1].rctCount, data.participants[3].rctCount];
    for (i = 0; i < window.reactions.length; i++) {
      window.reactToDistData[i].label = ['DM', 'Group'];
      window.reactFromDistData[i].label = ['DM', 'Group'];
      window.reactToDistData[i].data.push(data.participants[0].rctCount[i]);
      window.reactToDistData[i].data.push(data.participants[2].rctCount[i]);
      window.reactFromDistData[i].data.push(data.participants[1].rctCount[i]);
      window.reactFromDistData[i].data.push(data.participants[3].rctCount[i]);
      window.reactTotals[i] += data.participants[0].rctCount[i] + data.participants[2].rctCount[i] + data.participants[1].rctCount[i] + data.participants[3].rctCount[i];
    }
    window.rctToPerson = false;
    window.reactToBar = pieChart(document.getElementById('reactToChart'), window.reactToType[window.rctToIndex], window.reactions, false);
    window.rctFromPerson = false;
    window.reactFromBar = pieChart(document.getElementById('reactFromChart'), window.reactFromType[window.rctFromIndex], window.reactions, false);
    window.reactToDist = pieChart(document.getElementById('reactToDistChart'), window.reactToDistData[0].data, window.reactToDistData[0].label, false);
    window.reactFromDist = pieChart(document.getElementById('reactFromDistChart'), window.reactFromDistData[0].data, window.reactFromDistData[0].label, false);
    document.getElementById('reactToTitle').innerText = "Reactions sent in ";
    document.getElementById('reactFromTitle').innerText = "Reactions received in ";
    document.getElementById('reactFromTypeSpan').style = "display: none;";
    document.getElementById('reactToTypeSpan').style = "display: none;";
    document.getElementById('reactToSelect').innerHTML = '<option value=0>DM</option> <option value=1>Group</option>';
    document.getElementById('reactFromSelect').innerHTML = '<option value=0>DM</option> <option value=1>Group</option>';
    document.getElementById('messageProxSelect').style = "";
    document.getElementById('msgProxTitle').innerText = "Message Distribution for ";
    document.getElementById('messageProxSelect').innerHTML = partiSelectHtml;
    document.getElementById('messageWordsSelect').innerHTML = wordTotalSelectHtml;
    document.getElementById('stickerSelect').innerHTML = wordTotalSelectHtml;
    let distCount = [],
      distNames = [];
    for (i = 0; i < data.participants[0].dist.length; i++) {
      distCount.push(data.participants[0].dist[i].count);
      distNames.push(data.participants[0].dist[i].title);
    }
    window.msgProx = pieChart(document.getElementById('msgProxResp'), distCount, distNames, true);
  }
  window.reactTotal = smallPieChart(document.getElementById('reactTotalChart'), window.reactTotals, window.reactions, false);
  msgWordsSelect(0);
  nameHistorySelect(0);
  stickerSelect(0);
  msgTotalSelect(0);
  document.getElementById('msgTotalSelect').value = 0;
  document.getElementById('dash-loading-back').style = "display: none";
}

function msgTotalSelect(index) {
  if (window.msgSent != undefined) {
    window.msgSent.destroy();
  }
  let msgTotal = 0,
    msgSent = [];
  if (index == 0) {
    for (i = 0; i < window.dashData.participants.length; i++) {
      msgTotal += window.dashData.participants[i].msgCount;
      msgSent.push(window.dashData.participants[i].msgCount);
    }
  } else {
    index -= 1;
    for (i = 0; i < window.dashData.participants.length; i++) {
      msgTotal += window.dashData.participants[i].msgType[index];
      msgSent.push(window.dashData.participants[i].msgType[index]);
    }
  }
  window.msgSent = pieChart(document.getElementById('msgSentPie'), msgSent, window.names, true);
  document.getElementById('msgTotal').innerText = ' (' + msgTotal + ')';
}

function stickerSelect(index) {
  let htmlStr = '';
  if (index == 1 && window.dashData.details.type == 'N/A') {
    index = 2
  }
  if (window.dashData.participants[index].favSticker.sticker != '') {
    htmlStr = '<img src="' + window.dashData.participants[index].favSticker.sticker + '" style="max-width:100%"></img><br><div>Sent: ' +
      window.dashData.participants[index].favSticker.count + ' times</div>';
  }

  document.getElementById('stickerImg').innerHTML = (htmlStr != '' ? htmlStr : "<br>No stickers sent in this time range.");
}

function nameHistorySelect(index) {
  let htmlStr = '',
    tempDate, list;
  if (window.dashData.details.type == 'Group') {
    if (index == 0) {
      list = window.dashData.title_history;
    } else {
      index -= 1;
      list = window.dashData.participants[index].nickname_history;
    }
  } else {
    list = window.dashData.participants[index].nickname_history;
  }
  for (var i = 0; list != undefined && i < list.length; i++) {
    htmlStr += '<li>';
    tempDate = new Date(list[i].time);
    htmlStr += '<div class="nickDate"><strong>' + tempDate.toLocaleDateString() + '</strong></div>';
    htmlStr += '<div class="nickname">' + list[i].name + '</div>';
    if (list[i].sender != undefined) {
      htmlStr += '<div class="nickSender">' + list[i].sender + '</div>';
    }
    htmlStr += '</li>';
  }
  if (htmlStr == '') {
    htmlStr = '<div>No names to display</div>';
  }
  document.getElementById('nicknamelist').innerHTML = htmlStr;
}

function msgWordsSelect(index) {
  let htmlStr = '';
  if (index == 1 && !(window.dashData.details.type == 'Group' || window.dashData.details.type == 'DM')) {
    index = 2
  }
  for (var i = 0; window.dashData.participants[index].wordCount != undefined && i < window.dashData.participants[index].wordCount.length; i++) {
    if (window.dashData.participants[index].wordCount[i] != undefined) {
      htmlStr += "<li>" + window.dashData.participants[index].wordCount[i].text +
        ' <span class="count"> ' + window.dashData.participants[index].wordCount[i].size + '</span>' +
        '</li>'
    }
  }
  document.getElementById('wordsList').innerHTML = (htmlStr != '' ? htmlStr : "No messages sent in this time range.");
}

function msgTypeSelect(index) {
  window.msgType.destroy();
  if (index != 0) {
    window.msgType = pieChart(document.getElementById('msgTypePie'), window.dashData.participants[index - 1].msgType, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers'], true);
  } else {
    window.msgType = pieChart(document.getElementById('msgTypePie'), window.messageTypeTotal, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers'], true);
  }
}

function rctToSelect(index) {
  window.reactToBar.destroy();
  window.rctToIndex = index;
  if (window.rctToPerson) {
    window.reactToBar = stackedBar(document.getElementById('reactToChart'), window.reactToData[index]);
  } else {
    window.reactToBar = pieChart(document.getElementById('reactToChart'), window.reactToType[index], window.reactions, false);
  }
}

function rctFromSelect(index) {
  window.reactFromBar.destroy();
  window.rctFromIndex = index;
  if (window.rctFromPerson) {
    window.reactFromBar = stackedBar(document.getElementById('reactFromChart'), window.reactFromData[index]);
  } else {
    window.reactFromBar = pieChart(document.getElementById('reactFromChart'), window.reactFromType[window.rctFromIndex], window.reactions, false);
  }
}

function rctToTypeSelect(index) {
  window.reactToBar.destroy();
  if (index == 0) {
    window.rctToPerson = true;
    window.reactToBar = stackedBar(document.getElementById('reactToChart'), window.reactToData[window.rctToIndex]);
  } else {
    window.rctToPerson = false;
    window.reactToBar = pieChart(document.getElementById('reactToChart'), window.reactToType[window.rctToIndex], window.reactions, false);
  }
}

function rctFromTypeSelect(index) {
  window.reactFromBar.destroy();
  if (index == 0) {
    window.rctFromPerson = true;
    window.reactFromBar = stackedBar(document.getElementById('reactFromChart'), window.reactFromData[window.rctFromIndex]);
  } else {
    window.rctFromPerson = false;
    window.reactFromBar = pieChart(document.getElementById('reactFromChart'), window.reactFromType[window.rctFromIndex], window.reactions, false);
  }
}

function rctFromDistSelect(index) {
  window.reactFromDist.destroy()
  window.reactFromDist = pieChart(document.getElementById('reactFromDistChart'), window.reactFromDistData[index].data, window.reactFromDistData[index].label, false);
}

function rctToDistSelect(index) {
  window.reactToDist.destroy();
  window.reactToDist = pieChart(document.getElementById('reactToDistChart'), window.reactToDistData[index].data, window.reactToDistData[index].label, false);
}


function msgProxSelect(index) {
  window.msgProx.destroy();
  if (window.dashData.details.type == 'Group') {
    window.msgProx = vertBarChart(document.getElementById('msgProxResp'), window.dashData.participants[index].proxAvg, allButOne(window.activeNames, index), 'Proximity');
  } else {
    let distCount = [],
      distNames = [];
    for (var i = 0; i < window.dashData.participants[index].dist.length; i++) {
      distCount.push(window.dashData.participants[index].dist[i].count);
      distNames.push(window.dashData.participants[index].dist[i].title);
    }
    window.msgProx = pieChart(document.getElementById('msgProxResp'), distCount, distNames, true);
  }
}

function msgActiveSelect(index) {
  window.msgActive.destroy();
  if (index == 1) {
    window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeDeviation, window.activeLabel, 'Std. Deviation');
  } else {
    window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeTime, window.activeLabel, 'Messages Count');
  }
}

function timeChart(ctx, data, label, yAxis) {
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: label,
      datasets: data,
    },
    options: {
      scales: {
        xAxes: [{
          type: "time",
          time: {
            parser: 'HH:mm',
            unit: 'hour'
          },
          scaleLabel: {
            display: true,
            labelString: "Time"
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: yAxis
          }
        }]
      },
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12
        },
        padding: 20
      },
      tooltips: {
        displayColors: true,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 12,
        bodyAlign: 'center',
        bodySpacing: 4,
        intersect: false
      },
      plugins: {
        datalabels: {
          display: false,
        },
        crosshair: {
          line: {
            color: '#222', // crosshair line color
            width: 1 // crosshair line width
          },
          sync: {
            enabled: false
          },
          zoom: {
            enabled: false
          },
          callbacks: {
            beforeZoom: function(start, end) { // called before zoom, return false to prevent zoom
              return false;
            },
            afterZoom: function(start, end) { // called after zoom
            }
          }
        }
      }
    }
  });
}

function lineChart(ctx, data, label, stack, dateUnit) {
  if (dateUnit == "month") {
    timeFormat = 'MM-DD-YYYY'
  } else if (dateUnit == "day") {
    timeFormat = 'MM-DD-YYYY HH:mm'
  } else if (dateUnit == "hour") {
    timeFormat = 'MM-DD-YYYY HH:mm'
  }
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: label,
      datasets: data,
    },
    options: {
      scales: {
        xAxes: [{
          type: "time",
          time: {
            parser: timeFormat,
            unit: dateUnit
          },
          scaleLabel: {
            display: true,
            labelString: "Time"
          }
        }],
        yAxes: [{
          stacked: stack,
          ticks: {
            min: stack ? 0 : undefined,
            max: stack ? 100 : undefined
          },
          scaleLabel: {
            display: true,
            labelString: stack ? "Percent" : "Message Count"
          }
        }]
      },
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12
        },
        padding: 20
      },
      tooltips: {
        displayColors: true,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 12,
        bodyAlign: 'center',
        bodySpacing: 4,
        intersect: false
      },
      plugins: {
        datalabels: {
          display: false,
        },
        crosshair: {
          line: {
            color: '#222', // crosshair line color
            width: 1 // crosshair line width
          },
          sync: {
            enabled: false
          },
          zoom: {
            enabled: false
          },
          callbacks: {
            beforeZoom: function(start, end) { // called before zoom, return false to prevent zoom
              return false;
            },
            afterZoom: function(start, end) { // called after zoom
            }
          }
        }
      }
    }
  });
}

function vertBarChart(ctx, data, label, yAxis) {
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: label,
      datasets: [{
        data: data,
        backgroundColor: window.graphColors
      }],
    },
    options: {
      animation: {
        duration: 0 // general animation time
      },
      scales: {
        xAxes: [],
        yAxes: [{
          ticks: {
            min: 0
          },
          scaleLabel: {
            display: true,
            labelString: yAxis
          }
        }]
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        display: false
      },
      tooltips: {
        displayColors: true,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 12,
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

function pieChart(ctx, data, label, legendBox) {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: label,
      datasets: [{
        label: 'Messages sent',
        data: data,
        backgroundColor: window.graphColors
      }],
    },
    options: {
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        display: true,
        position: 'right',
        labels: {
          boxWidth: 12
        },
        padding: 20
      },
      tooltips: {
        displayColors: legendBox,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 12,
        bodyAlign: 'center',
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          formatter: (value, ctx) => {
            let sum = 0;
            let dataArr = ctx.chart.data.datasets[0].data;
            dataArr.map(data => {
              sum += data;
            });
            let percentage = "";
            if ((value * 100 / sum).toFixed(0) > 0) {
              percentage = (value * 100 / sum).toFixed(0) + "%";
            }
            return percentage;
          },
          color: '#fff'
        },
        crosshair: false
      }
    }
  });
}

function smallPieChart(ctx, data, label, legendBox) {
  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: label,
      datasets: [{
        data: data,
        backgroundColor: window.graphColors
      }],
    },
    options: {
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        display: false,
        position: 'right',
        labels: {
          boxWidth: 12
        },
        padding: 20
      },
      tooltips: {
        displayColors: legendBox,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 12,
        bodyAlign: 'center',
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          formatter: (value, ctx) => {
            let sum = 0;
            let dataArr = ctx.chart.data.datasets[0].data;
            dataArr.map(data => {
              sum += data;
            });
            let percentage = (value * 100 / sum).toFixed(0) + "%";
            return percentage;
          },
          color: '#fff'
        },
        crosshair: false
      }
    }
  });
}

function stackedBar(ctx, data) {
  return new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      tooltips: {
        displayColors: false,
        callbacks: {
          mode: 'x',
        },
      },
      scales: {
        xAxes: [{
          stacked: true,
          gridLines: {
            display: false,
          }
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
          type: 'linear',
        }]
      },
      animation: {
        duration: 0 // general animation time
      },
      hover: {
        animationDuration: 0 // duration of animations when hovering an item
      },
      responsiveAnimationDuration: 0, // animation duration after a resize
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12
        }
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

function allButOne(arr, index) {
  return arr.filter(function(value, arrIndex) {
    return index !== arrIndex;
  });
}

//document ready script
$(document).ready(function() {
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
      start: start._d.getTime(),
      end: end._d.getTime()
    };
  });

  $('#dateRange').on('apply.daterangepicker', function(ev, picker) {
    $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
  });

  $('#dateRange').on('cancel.daterangepicker', function(ev, picker) {
    $(this).val('');
    window.date = {
      start: 0,
      end: 0
    };
  });
  ipcRenderer.on('dashboard', (event, arg) => {
    console.log(arg);
    window.dashData = arg;
    dashGraphs(arg);
  });
  ipcRenderer.on('contacts', (event, arg) => {
    window.contactList = arg;
    let htmlStr = '',
      i, name;
    for (i = 0; i < arg.length; i++) {
      name = arg[i].name;
      if (name != '') {
        htmlStr += '<li><a href="#" onclick="convoClick(\'' +
          escapeJs(arg[i].id) +
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

  document.getElementById('convoSearch').addEventListener('focus', function() {
    document.getElementById('convoList').style = "";
  });
  document.getElementById('convoSearch').addEventListener('blur', function() {
    setTimeout(function() {
      document.getElementById('convoList').style = "display: none";
    }, 100);
  });
  Chart.defaults.scale.gridLines.display = true;
  Chart.defaults.scale.ticks.display = true;
  ipcRenderer.send('dashboard', 'ready');
  document.getElementById('daterangelabel').innerText = "All Time";
  document.getElementById('convonamelabel').innerText = "All conversations";
  document.getElementById('dash-loading-back').style = "";
  console.log('Dashboard opened');
});

//function submit the dashboard search form
function dashSubmit() {
  if ($('#dateRange').val() == "") {
    window.date = {
      start: 0,
      end: 0
    };
    document.getElementById('daterangelabel').innerText = "All Time";
  } else {
    let tempD1, tempD2;
    tempD1 = new Date(window.date.start);
    tempD2 = new Date(window.date.end);
    document.getElementById('daterangelabel').innerText = tempD1.toLocaleDateString() + " to " + tempD2.toLocaleDateString();
  }
  if ($('#convoSearch').val() == "") {
    window.dashConvo = "";
    ipcRenderer.send('dashboard', ['', window.date.start, window.date.end]);
    document.getElementById('convonamelabel').innerText = "All conversations";
  } else {
    if (window.dashConvo == "") {
      for (var i = 0; i < window.contactList.length; i++) {
        if ($('#convoSearch').val() == window.contactList[i].name) {
          window.dashConvo = window.contactList[i];
          break;
        }
      }
    }
    if (window.dashConvo == "") {
      window.alert('No such conversation found, please check your inputs');
      return;
    } else {
      ipcRenderer.send('dashboard', [window.dashConvo.id, window.date.start, window.date.end]);
      document.getElementById('convonamelabel').innerText = window.dashConvo.name;
    }
  }

  document.getElementById('dash-loading-back').style = "";
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
function convoClick(contactId) {
  let contact;
  for (var i = 0; i < window.contactList.length; i++) {
    if (contactId == window.contactList[i].id) {
      window.dashConvo = window.contactList[i];
      break;
    }
  }
  contact = window.dashConvo.name;
  console.log("Convo clicked: " + contact);
  $('#convoSearch').val(contact);
}
