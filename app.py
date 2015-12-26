import logging
import os.path
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options
define('app_port', default=8000, type=int)
define('osc_port', default=5000, type=int)

from liblo import make_method
from liblo import ServerThread


class MuseServerThread(ServerThread):

    def __init__(self, app, osc_port=5000):
        ServerThread.__init__(self, osc_port)
        self.app = app

    @make_method('/muse/elements/is_good', 'iiii')
    def status_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'status',
            'value': [args[0], args[3]],
        })

    @make_method('/muse/elements/experimental/concentration', 'f')
    def concentration_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'concentration',
            'value': args[0],
        })


class Application(tornado.web.Application):

    def __init__(self):
        base_dir = os.path.dirname(__file__)

        settings = {
            'static_path': os.path.join(base_dir, 'static'),
            'template_path': os.path.join(base_dir, 'templates'),
            'compiled_template_cache': False,
            'static_hash_cache': False,
        }

        handlers = [
            (r'/', MainHandler),
            (r'/ws', WebSocketHandler),
        ]

        self.clients = set()

        tornado.web.Application.__init__(self, handlers, **settings)

    def publish(self, json):
        for c in self.clients:
            c.write_message(tornado.escape.json_encode(json))


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        self.render('main.html')


class WebSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        logging.info('WebSocket opened.')
        self.application.clients.add(self)

    def on_close(self):
        logging.info('WebSocket closed.')
        self.application.clients.remove(self)


if __name__ == '__main__':
    try:
        tornado.options.parse_command_line()
        app = Application()
        osc = MuseServerThread(app, options.osc_port)
        osc.start()
        httpserver = tornado.httpserver.HTTPServer(app)
        httpserver.listen(options.app_port)
        tornado.ioloop.IOLoop().instance().start()
    except KeyboardInterrupt:
        osc.stop()
        tornado.ioloop.IOLoop().instance().stop()
