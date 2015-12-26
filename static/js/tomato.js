$(function() {
  var ws;
  var valid = false;
  var series = null;

  function connect() {
    var websocket = window['WebSocket'] || window['MozWebSocket'];
    var host = document.location.host;

    if (!websocket) {
      console.log('WebSocket not supported.');
    }
    else {
      ws = new websocket('ws://' + host + '/ws');

      ws.onopen = function() {
        console.log('WebSocket opened.');
      };

      ws.onclose = function() {
        console.log('WebSocket closed.');
        valid = false;
        $('#checkbox-sensor').bootstrapSwitch('state', valid);
      };

      ws.onmessage = function(event) {
        var json = JSON.parse(event.data);
        if (json.type === 'status') {
          valid = json.value;
          $('#checkbox-sensor').bootstrapSwitch('state', valid);
        }
        else if (json.type === 'score' && valid) {
          var now = (new Date()).getTime();
          series[0].addPoint([now, json.value], true, false);
        }
      };
    }
  }

  $('#checkbox-connection').bootstrapSwitch({
    state: false,
    onSwitchChange: function(event, state) {
      (state) ? connect() : ws.close();
    },
  });

  $('#checkbox-sensor').bootstrapSwitch({
    state: false,
  });

  Highcharts.setOptions({
    global: {
      useUTC: false,
    },
  });

  $('#chart').highcharts({
    chart: {
      type: 'spline',
      animation: Highcharts.svg,
      events: {
        load: function() {
          series = this.series;
        }
      },
      style: {
        fontFamily: 'Lato, sans-serif',
      },
    },
    series: [{
      name: 'Score',
      data: [],
      marker: { enabled: false },
    }],
    title: { text: null },
    legend: { enabled: true },
    xAxis: {
      visible: true,
      type: 'datetime',
    },
    yAxis: {
      visible: true,
      min: 0.0,
      max: 100.0,
    },
  });
});
