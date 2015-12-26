$(function() {
  var ws;
  var valid = false;
  var series = null;

  function log(message) {
    var now = new Date();
    var hh = ('0' + now.getHours()).slice(-2);
    var mm = ('0' + now.getMinutes()).slice(-2);
    var ss = ('0' + now.getSeconds()).slice(-2);
    var timestamp = '[' + hh + ':' + mm + ':' + ss + ']';
    $('#message-box').prepend(timestamp + ' ' + message + '\n');
  }

  function connect() {
    var websocket = window['WebSocket'] || window['MozWebSocket'];
    var host = document.location.host;

    if (!websocket) {
      log('WebSocket not supported.');
    }
    else {
      ws = new websocket('ws://' + host + '/ws');

      ws.onopen = function() {
        log('WebSocket opened.');
      };

      ws.onclose = function() {
        log('WebSocket closed.');
      };

      ws.onmessage = function(event) {
        var json = JSON.parse(event.data);
        if (json.op === 'data') {
          if (json.type === 'status') {
            valid = json.value[0] && json.value[1];
            var bs = ['#status-sensor-left', '#status-sensor-right'];
            var cs = ['btn-warning', 'btn-success'];
            for (var i = 0; i < 2; ++i) {
              var status = json.value[i];
              $(bs[i]).addClass(cs[status]).removeClass(cs[1-status]);
            }
          }
          else if (valid && series) {
            var idx = -1;
            if (json.type === 'alpha') { idx = 0; }

            if (idx > -1) {
              var now = (new Date()).getTime();
              var shift = (series[idx].data.length >= 100);
              series[idx].addPoint([now, json.value], true, shift);
            }
          }
        }
        else if (json.op === 'message') {
          log(json.value);
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
    series: [
      {
        name: 'Alpha',
        data: [],
        marker: { enabled: false },
      },
    ],
    title: { text: 'Brain Waves' },
    legend: { enabled: true },
    xAxis: {
      type: 'datetime',
      visible: true,
    },
    yAxis: {
      visible: true,
      min: 0.0,
      max: 1.0,
    },
  });
});
