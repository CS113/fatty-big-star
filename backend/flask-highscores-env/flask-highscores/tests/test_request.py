#!/usr/bin/env python
"""
Here is a minimal testing suite for basic server side
operations. e.g. some sample URLs
"""
import requests

# This response is destined to fail and send back a
# a single fail red X image.
SEND_URI = 'http://fatty.lucasou.com/api/highscore_send'
GET_URI = 'http://fatty.lucasou.com/api/highscore_get'

resp = requests.post(SEND_URI, data={'name': 'lucas ou-yang', 'score': 100})
print resp.json()

resp = requests.post(SEND_URI, data={'name': 'lucas jackson', 'score': 900})
print resp.json()

resp = requests.post(SEND_URI, data={'name': 'whatanimal', 'score': 102})
print resp.json()

resp = requests.get(GET_URI)
print resp.json()
