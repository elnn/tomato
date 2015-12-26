import logging
import os.path
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options
define('port', default=8000, help='run on the given port', type=int)

from liblo import make_method
from liblo import ServerThread


class MuseServerThread(ServerThread):

    def __init__(self, port=5000, app=None):
        ServerThread.__init__(self, port)
        self.app = app

    @make_method('/muse/elements/is_good', 'iiii')
    def status_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'status',
            'value': [args[0], args[3]],
        })

    @make_method('/muse/elements/alpha_relative', 'ffff')
    def alpha_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'alpha',
            'value': [args[0], args[3]],
        })

    @make_method(None, None)
    def fallback(self, path, args, types, src):
        pass


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
        self.muse = None

        tornado.web.Application.__init__(self, handlers, **settings)

    def publish(self, json):
        for c in self.clients:
            c.write_message(tornado.escape.json_encode(json))


class MainHandler(tornado.web.RequestHandler):

    def get(self):
        self.render('main.html')


class WebSocketHandler(tornado.websocket.WebSocketHandler):

    @property
    def app(self):
        return self.application

    def open(self):
        logging.info('WebSocket opened.')
        self.app.clients.add(self)

        assert(self.app.muse is None)
        self.app.muse = MuseServerThread(app=self.app)
        self.app.muse.start()
        logging.info('Muse started.')
        self.app.publish({
            'op': 'message',
            'value': 'Muse started.',
        })

    def on_close(self):
        logging.info('WebSocket closed.')
        self.app.clients.remove(self)

        assert(isinstance(self.app.muse, ServerThread))
        self.app.muse.stop()
        self.app.muse = None
        logging.info('Muse stopped.')

    def on_message(self, message):
        logging.error('Received undefined message: %s' % message)


if __name__ == '__main__':
    tornado.options.parse_command_line()
    logging.info('Listening on port %d.' % options.port)
    httpserver = tornado.httpserver.HTTPServer(Application())
    httpserver.listen(options.port)
    tornado.ioloop.IOLoop().instance().start()
