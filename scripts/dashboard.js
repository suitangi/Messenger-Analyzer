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

function dashGraphs() {
  pieChart(document.getElementById('msgSentPie'), [20, 120], ['Sent', 'Received']);
  pieChart(document.getElementById('msgTypePie'), [200, 20, 23, 22, 65, 9], ['Texts', 'Photos', 'Links', 'Gifs', 'Videos', 'Stickers']);
}

function loadContact() {

}

function pieChart(ctx, data, label) {
  var msgSentPie = new Chart(ctx, {
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
      }
    }
  });
}
