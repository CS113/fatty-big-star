#!/usr/bin/env python2.7
"""
/config.py will be storing all the module configs.
"""

import os
_basedir = os.path.abspath(os.path.dirname(__file__))

DEBUG = True
ADMINS = frozenset(['lucasyangpersonal@gmail.com'])
SECRET_KEY = 'This does not matter, our flask backend is just '\
             'serving API requests'

CSRF_ENABLED = True
CSRF_SESSION_KEY = "dfdgjnsdkwendsspongbobsquidwarddfd"

ROOT_URL = "http://fatty.lucasou.com"

HIGHSCORES_URI = '/home/lucas/www/fatty-big-star/'\
                 'backend/flask-highscores-env/'\
                 'flask-highscores/highscores.csv'

MAX_USERNAME = 25
MAX_SCORE = 1000000
MAX_HIGHSCORE_ENTRIES = 10000;
