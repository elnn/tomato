var Chart = function () {
  this.series = [0, 0, 0, 0];
  this.isActive = false;

  this.addAlpha = function (values) {
    var x = (new Date()).getTime();
    var y = (values[1] + values[2]) / 2.;
    chart.series[0].addPoint([x, y], true, true);
    chart.series[2].addPoint([x, y > .9 ? 1 : 0], true, true);
  };

  this.addGamma = function (values) {
    var x = (new Date()).getTime();
    var y = (values[1] + values[2]) / 2.;
    chart.series[1].addPoint([x, y], true, true);
    chart.series[3].addPoint([x, y > .9 ? 1 : 0], true, true);
  };
}

var chart = new Chart();

var timeWindow = 100;

$(document).ready(function () {
  Highcharts.setOptions({
    global: {
      useUTC: false,
    },
  });

  var initData = function(n, init) {
    var data = [],
      time = (new Date()).getTime(),
      i;

    for (i = -n; i < 0; i++) {
      data.push({
        x: time + i * 1000,
        y: init || 0.5
      });
    }

    return data;
  };

  var drawChart = function(id, idx, options) {
    $(id).highcharts({
      chart: {
        type: options.type || 'spline',
        animation: Highcharts.svg,
        events: {
          load: function() {
            console.log(this.series);
            chart.series[idx] = this.series[0];
          }
        },
      },
      series: {
        marker: { enabled: false },
        name: options.name || null,
        data: initData(timeWindow, options.initValue || 0),
      },
      title: { text: options.title || null },
      xAxis: {
        type: 'datetime',
        visible: options.xAxisVisible || true,
      },
      yAxis: {
        visible: options.yAxisVisible || true,
        max: options.yMax || null,
        min: options.yMin || null,
      },
      legend: { enabled: false },
      exporting: { enabled: false },
      colors: options.colors || null,
    });
  };

  drawChart('#alpha', 0, {
    title: 'Relaxation',
    name: 'Alpha',
    initValue: 0.5,
  });

  drawChart('#alpha-active', 2, {
    type: 'area',
    xAxisVisible: false,
    yAxisVisible: false,
    yMax: 1.0,
    yMin: 0.5,
    name: 'Alpha-Activation',
    initValue: 0.0,
  });

  drawChart('#gamma', 1, {
    title: 'Concentration',
    name: 'Gamma',
    initValue: 0.5,
    colors: ['#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
  });

  drawChart('#gamma-active', 3, {
    type: 'area',
    xAxisVisible: false,
    yAxisVisible: false,
    yMax: 1.0,
    yMin: 0.5,
    name: 'Gamma-Activation',
    initValue: 0.0,
    colors: ['#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1'],
  });
});