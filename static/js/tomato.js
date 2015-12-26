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
      };

      ws.onmessage = function(event) {
        var json = JSON.parse(event.data);
        if (json.type === 'status') {
          valid = json.value;
          $('#status').html((valid) ? 'GOOD' : 'BAD');
        }
        else if (json.type === 'score' && valid) {
          var now = (new Date()).getTime();
          series[0].addPoint([now, json.value], true, false);
        }
      };
    }
  }

  /* websocket switch */
  $('#checkbox-websocket').bootstrapSwitch({
    size: 'small',
    labelText: 'WebSocket',
    onColor: 'success',
    offColor: 'warning',
    onSwitchChange: function(event, state) {
      (state) ? connect() : ws.close();
    },
  });

  /* chart */
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
    },
    series: [{
      name: 'Score',
      data: [],
      marker: { enabled: false },
    }],
    title: { text: 'Brain Waves' },
    legend: { enabled: true },
    xAxis: {
      type: 'datetime',
      visible: true,
    },
    yAxis: {
      visible: true,
      min: 0.0,
      max: 100.0,
    },
  });
});
