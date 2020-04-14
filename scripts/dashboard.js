window.graphColors = [
  '#214f91',
  '#4d3296',
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
  let i,
      msgTime = [],
      msgSent = [],
      msgPct = [],
      names = [];

  for (i = 0; i < data.participants.length; i++ ) {

    names.push(data.participants[i].name);
    msgTime.push({
      label: data.participants[i].name,
      data: data.participants[i].msgTime,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 1
    });
    msgPct.push({
      label: data.participants[i].name,
      data: data.participants[i].msgPct,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 1
    });
    msgSent.push(data.participants[i].msgCount);
  }


  pieChart(document.getElementById('msgSentPie'), msgSent, names);
  pieChart(document.getElementById('msgTypePie'), data.participants[0].msgType, ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
  lineChart(document.getElementById('msgLine'), msgTime, data.timeLabel, false);
  lineChart(document.getElementById('msgPctLine'), msgPct, data.timeLabel, true);

  document.getElementById('chatTitle').innerText = data.details.title;
  document.getElementById('chatType').innerText = data.details.type;
  document.getElementById('detailDRange').innerText = data.details.range;
}

function loadContact() {

}

function lineChart(ctx, data, label, stack) {
  let chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: label,
      datasets: data,
    },
    options: {
      scales: {
            yAxes: [{
                stacked: stack
            }]
      },
      legend: {
        display: true,
        position: 'bottom',
        boxWidth: 30,
        padding: 20
      },
      tooltips: {
        displayColors: true,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 16,
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
  let chart = new Chart(ctx, {
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
      legend: {
        display: true,
        position: 'right',
        boxWidth: 30,
        padding: 20
      },
      tooltips: {
        displayColors: true,
        bodyFontFamily: "'Muli', sans-serif",
        bodyFontSize: 16,
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
