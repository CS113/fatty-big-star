# Refer to the following link for help:
# http://docs.gunicorn.org/en/latest/settings.html

# Generally we recommend (2 x $num_cores) + 1 as the
# number of workers to start off with.
command = '/home/lucas/www/fatty-big-star/backend/'\
          'flask-highscores-env/bin/gunicorn'
pythonpath = '/home/lucas/www/fatty-big-star/backend/'\
             'flask-highscores-env/flask-highscores'
bind = '127.0.0.1:8046'
workers = 1
user = 'lucas'
#accesslog = '/home/lucas/logs/fatty.lucasou.com/gunicorn-access.log'
#errorlog = '/home/lucas/logs/fatty.lucasou.com/gunicorn-error.log'
