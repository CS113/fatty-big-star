#!/usr/bin/env python
import sys
sys.path.insert(0, '/home/lucas/www/fatty-big-star/'
                   'backend/flask-highscores-env/flask-highscores')

from werkzeug.contrib.fixers import ProxyFix
from werkzeug.debug import DebuggedApplication

from backend import app

app.wsgi_app = ProxyFix(app.wsgi_app)
application = DebuggedApplication(app, True)
