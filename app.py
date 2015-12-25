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
from liblo import ServerError
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
            'values': args,
        })

    @make_method('/muse/elements/alpha_absolute', 'ffff')
    def alpha_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'alpha',
            'values': args,
        })

    @make_method('/muse/elements/beta_absolute', 'ffff')
    def beta_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'beta',
            'values': args,
        })

    @make_method('/muse/elements/gamma_absolute', 'ffff')
    def gamma_callback(self, path, args):
        self.app.publish({
            'op': 'data',
            'type': 'gamma',
            'values': args,
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

    def on_close(self):
        logging.info('WebSocket closed.')
        self.app.clients.remove(self)

    def on_message(self, message):
        json = tornado.escape.json_decode(message)
        op = json.get('op')

        if op == 'muse-start':
            if not self.app.muse:
                try:
                    self.app.muse = MuseServerThread(app=self.app)
                    self.app.muse.start()
                    logging.info('Muse started.')
                    self.app.publish({
                        'op': 'muse-start',
                        'success': True,
                    })
                except ServerError as e:
                    self.app.muse = None
                    logging.error('Muse error: %s' % e)
                    self.app.publish({
                        'op': 'muse-start',
                        'success': False,
                    })
            else:
                logging.error('Muse already started.')
                self.app.publish({
                    'op': 'muse-start',
                    'success': False,
                })

        elif op == 'muse-stop':
            if isinstance(self.app.muse, ServerThread):
                self.app.muse.stop()
                self.app.muse = None
                logging.info('Muse stopped.')
                self.app.publish({
                    'op': 'muse-stop',
                    'success': True,
                })
            else:
                logging.error('Muse already stopped.')
                self.app.publish({
                    'op': 'muse-stop',
                    'success': False,
                })

        else:
            logging.error('Received undefined message: %s' % message)
            self.app.publish({
                'op': op,
                'success': False,
            })


if __name__ == '__main__':
    tornado.options.parse_command_line()
    logging.info('Listening on port %d.' % options.port)
    httpserver = tornado.httpserver.HTTPServer(Application())
    httpserver.listen(options.port)
    tornado.ioloop.IOLoop().instance().start()
