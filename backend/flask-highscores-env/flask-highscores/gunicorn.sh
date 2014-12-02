#!/bin/bash

exec /home/lucas/www/fatty-big-star/backend/flask-highscores-env/bin/gunicorn -c /home/lucas/www/fatty-big-star/backend/flask-highscores-env/flask-highscores/configs/gunicorn_config.py backend.wsgi;
