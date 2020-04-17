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
  let i, h, m, j,
    msgTime = [],
    msgSent = [],
    msgPct = [],
    names = [],
    dev = [],
    avg, std,
    msgTotal = 0,
    msgTypeListHtml = '',
    partiListHtml = '';

  window.activeLabel = [];
  window.activeTime = [];
  window.activeDeviation = [];

  for (i = 0; i < 1440; i++) {
    h = Math.floor(i / 60);
    m = i % 60;
    window.activeLabel.push(
      (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m)
    );
  }


  for (i = 0; i < data.participants.length; i++) {

    msgTypeListHtml += '<option value="' + i + '">' + data.participants[i].name + '</option>';
    partiListHtml += '<li>' + data.participants[i].name + ((!data.participants[i].active) ? '<span class="removed">  (Inactive)</span>' : '') + '</li>';
    msgTotal += data.participants[i].msgCount;

    names.push(data.participants[i].name);
    msgTime.push({
      label: data.participants[i].name,
      data: data.participants[i].msgTime,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 1,
      hidden: true
    });
    msgPct.push({
      label: data.participants[i].name,
      data: data.participants[i].msgPct,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: window.graphColors[i],
      borderWidth: 1,
      pointRadius: 1
    });
    window.activeTime.push({
      label: data.participants[i].name,
      data: data.participants[i].hourCount,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 1,
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
      pointRadius: 1,
      hidden: true
    });
    msgSent.push(data.participants[i].msgCount);

  } //end for loop

  msgTime.unshift({
    label: "Total",
    data: data.msgTotal,
    borderColor: "#92d0de",
    pointBackgroundColor: "#92d0de",
    backgroundColor: "rgba(255,255,255, 0)",
    borderWidth: 1,
    pointRadius: 1
  });
  window.activeTime.unshift({
    label: "Total",
    data: data.activeTotal,
    borderColor: "#92d0de",
    pointBackgroundColor: "#92d0de",
    backgroundColor: "rgba(255,255,255, 0)",
    borderWidth: 1,
    pointRadius: 1
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
    pointRadius: 1
  });

  if (window.msgSent) {
    window.msgSent.destroy();
    window.msgType.destroy();
    window.msgTime.destroy();
    window.msgPct.destroy();
    window.msgActive.destroy();
  }
  window.msgSent = pieChart(document.getElementById('msgSentPie'), msgSent, names);
  window.msgType = pieChart(document.getElementById('msgTypePie'), data.participants[0].msgType, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
  window.msgTime = lineChart(document.getElementById('msgLine'), msgTime, data.timeLabel, false, data.dateUnit);
  window.msgPct = lineChart(document.getElementById('msgPctLine'), msgPct, data.timeLabel, true, data.dateUnit);
  window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeTime, window.activeLabel, false, 'hour');
  document.getElementById("messageActiveSelect").selectedIndex = 0;
  document.getElementById('msgTotal').innerText = ' (' + msgTotal + ' Total)';
  document.getElementById('messageTypeSelect').innerHTML = msgTypeListHtml;
  document.getElementById('participantList').innerHTML = partiListHtml;
  document.getElementById('chatTitle').innerText = data.details.title;
  document.getElementById('chatType').innerText = data.details.type;
  document.getElementById('detailDRange').innerText = data.details.range;

}


function msgTypeSelect(index) {
  window.msgType.destroy();
  window.msgType = pieChart(document.getElementById('msgTypePie'), window.dashData.participants[index].msgType, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
}

function msgActiveSelect(index) {
  console.log('tet');
  window.msgActive.destroy();
  if (index == 1) {
    window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeDeviation, window.activeLabel, false, 'hour');
  } else {
    window.msgActive = timeChart(document.getElementById('msgActiveTime'), window.activeTime, window.activeLabel, false, 'hour');
  }
}

function timeChart(ctx, data, label) {
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
            format: 'HH:mm',
            unit: 'hour'
          },
          scaleLabel: {
            display: true,
            labelString: "Time"
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
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          display: false,
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
            format: timeFormat,
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
        bodySpacing: 4
      },
      plugins: {
        datalabels: {
          display: false,
        }
      }
    }
  });
}

function pieChart(ctx, data, label) {
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
        displayColors: true,
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
        }
      }
    }
  });
}
