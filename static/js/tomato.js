$(function() {
  var ws;
  var valid = false;
  var series = null;
  var bucket = null;
  var t0;

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
        series.setData([], false);
        bucket = [];
        t0 = (new Date()).getTime();
        for (var i = 0; i < 30; ++i) {
          var t = t0 + 1000 * 60 * i;
          bucket.push({ size: 0, sum: 0.0 });
          series.addPoint([t, 0.0], false);
        }
        series.chart.redraw();
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
          var idx = Math.floor((now - t0) / 1000 / 60);
          if (0 <= idx && idx < 30) {
            bucket[idx].size += 1;
            bucket[idx].sum += Math.max(5.0, json.value);
            var m = bucket[idx].sum / bucket[idx].size;
            series.data[idx].update(m, true);
          }
          else {
            // Force to close the connection.
            $('#checkbox-connection').bootstrapSwitch('state', false);
          }
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
      type: 'column',
      animation: Highcharts.svg,
      events: {
        load: function() {
          series = this.series[0];
        }
      },
      style: {
        fontFamily: 'Lato, sans-serif',
      },
    },
    series: [{
      name: 'Score',
      data: [],
    }],
    title: {
      text: null,
    },
    tooltip: {
      formatter: function() {
        return Highcharts.numberFormat(this.y, 1);
      },
    },
    legend: {
      enabled: true,
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      min: 0.0,
      max: 100.0,
      title: {
        text: null,
      },
    },
  });
});
