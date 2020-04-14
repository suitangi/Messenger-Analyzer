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

function dashGraphs(data) {
  let i,
      msgTime = [];

  for (i = 0; i < data.participants.length; i++ ) {
    msgTime.push({
      label: data.participants[i].name,
      data: data.participants[i].msgTime,
      borderColor: window.graphColors[i],
      pointBackgroundColor: window.graphColors[i],
      backgroundColor: "rgba(255,255,255, 0)",
      borderWidth: 1,
      pointRadius: 1
    });
  }
  console.log(msgTime);
  pieChart(document.getElementById('msgSentPie'), [20, 120], ['Sent', 'Received']);
  pieChart(document.getElementById('msgTypePie'), [200, 20, 23, 22, 65, 9], ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
  lineChart(document.getElementById('msgLine'), msgTime, data.timeLabel);
}

function loadContact() {

}

function lineChart(ctx, data, label) {
  console.log(data);
  console.log(label);
  let chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: label,
      datasets: data,
    },
    options: {
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
