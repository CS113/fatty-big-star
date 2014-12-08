#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify
import csv


app = Flask(__name__, static_url_path='/static')
app.config.from_object('config')


@app.route('/api/highscore_send', methods=['POST'])
def highscores_send():
    """Input POST requests highscores/username data and logs
    it into a file. This can easily be hacked!

    Usernames are converted into lowercase, so they are not
    case sensitive
    """
    FAIL_RESPONSE = jsonify({'status': False})
    SUCCESS_RESPONSE = jsonify({'status': True})
    score_dd = {}

    if 'name' not in request.form or \
       'score' not in request.form:
        return FAIL_RESPONSE

    username = request.form['name']
    username = username.lower()
    username = username.strip()
    username = username[:app.config['MAX_USERNAME']]

    if not username:
        return FAIL_RESPONSE

    try:
        score = int(request.form['score'])
    except ValueError:
        return FAIL_RESPONSE

    # 'rb+' allows us to read and write into the file on one
    # file access
    with open(app.config['HIGHSCORES_URI'], 'rb+') as csvfile:
        rd = csv.reader(csvfile)
        score_dd = {row[0]: int(row[1]) for row in rd}

        if len(score_dd) > app.config['MAX_HIGHSCORE_ENTRIES']:
            return FAIL_RESPONSE

        score = min(app.config['MAX_SCORE'], score)
        if username not in score_dd or score > score_dd[username]:
            score_dd[username] = score

        # empty out the entire file and write anew
        csvfile.seek(0)
        csvfile.truncate()
        wr = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)

        for k, v in score_dd.items():
            wr.writerow([k, v])

    return SUCCESS_RESPONSE


@app.route('/api/highscore_get', methods=['GET'])
def highscores_get():
    """Retrieve highscores data in JSON format.

    Actual scores are stored as a list of two-tuples (just lists
    with 2 elems in client JS). This endpoint performs sorting for
    now (not efficient). TODO: Cache scores and sort on a cronjob.
    """
    with open(app.config['HIGHSCORES_URI'], 'rb') as csvfile:
        rd = csv.reader(csvfile)
        scores = sorted([row for row in rd],
                        key=lambda x: int(x[1]),
                        reverse=True)
        scores = scores[:25]
    return jsonify({'scores': scores})


app.debug = app.config['DEBUG']

if __name__ == '__main__':
    app.run()
