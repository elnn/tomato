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
      };

      ws.onclose = function() {
        log('WebSocket closed.');
        $('#btn-connect').removeClass('disabled');
      };

      ws.onmessage = function(event) {
        var json = JSON.parse(event.data);
        /* TODO */
        log(JSON.stringify(json));
      };
    }
  }

  $('#btn-connect').click(function() {
    if ($(this).hasClass('disabled')) {
      log('WebSocket already connected.');
    }
    else {
      log('Connecting to WebSocket server...');
      $('#btn-connect').addClass('disabled');
      connect();
    }
  });

  $('#btn-hello').click(function() {
    if (!ws) {
      log('WebSocket not initialized.');
    }
    else {
      ws.send(JSON.stringify({ message: 'Hello, World!' }));
    }
  });
});
