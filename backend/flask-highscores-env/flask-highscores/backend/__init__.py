#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify


app = Flask(__name__, static_url_path='/static')
app.config.from_object('config')


@app.route('/api/highscore_send', methods=['POST'])
def main():
    """Input POST requests highscores/username data and logs
    it into a file. This can easily be hacked!
    """
    # text = request.form['text']
    return jsonify({'test': 'some val'})


app.debug = app.config['DEBUG']

if __name__ == '__main__':
    app.run()
