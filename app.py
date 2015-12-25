import logging
import os.path
import tornado.escape
import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.options import define, options
define('port', default=8000, help='run on the given port', type=int)


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

    def publish(self, message):
        for c in self.clients:
            c.write_message(message)


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

    def on_message(self, message):
        logging.error('Received undefined message: %s' % message)
        # TODO
        self.application.publish(message)  # simple echo


if __name__ == '__main__':
    tornado.options.parse_command_line()
    logging.info('Listening on port %d.' % options.port)
    httpserver = tornado.httpserver.HTTPServer(Application())
    httpserver.listen(options.port)
    tornado.ioloop.IOLoop().instance().start()
