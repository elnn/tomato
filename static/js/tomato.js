$(function() {
  var ws;

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
        $('#toggle-muse').bootstrapToggle('enable');
      };

      ws.onclose = function() {
        log('WebSocket closed.');
        $('#toggle-websocket').bootstrapToggle('off');
        $('#toggle-muse').bootstrapToggle('disable');
      };

      ws.onmessage = function(event) {
        var json = JSON.parse(event.data);
        if (json.op === 'data') {
          if (json.type === 'status') {
            chart.isActive = true;
            for (var i = 0; i < 4; i++) {
              if (!json.values[i]) {
                chart.isActive = false;
                $('#status-' + i).addClass('btn-danger');
                $('#status-' + i).removeClass('btn-success');
              }
              else {
                $('#status-' + i).addClass('btn-success');
                $('#status-' + i).removeClass('btn-danger');
              }
            }
          }
          else if (chart.isActive && json.type === 'alpha') {
            chart.addAlpha(json.values);
          }
          else if (chart.isActive && json.type === 'beta') {
            /* TODO */
          }
          else if (chart.isActive && json.type == 'gamma') {
            chart.addGamma(json.values);
          }
        }
        else if (json.op === 'muse-start') {
          if (json.success) {
            log('Muse started.');
          }
          else {
            log('Muse failed to start.');
          }
        }
        else if (json.op === 'muse-stop') {
          if (json.success) {
            log('Muse stopped.');
          }
          else {
            log('Muse failed to stop.');
          }
        }
      };
    }
  }

  $('#toggle-websocket').change(function() {
    if ($(this).prop('checked')) {
      connect();
    }
    else {
      ws.close();
    }
  });

  $('#toggle-muse').change(function() {
    if ($(this).prop('checked')) {
      ws.send(JSON.stringify({ op: 'muse-start' }));
    }
    else {
      ws.send(JSON.stringify({ op: 'muse-stop' }));
    }
  });
});