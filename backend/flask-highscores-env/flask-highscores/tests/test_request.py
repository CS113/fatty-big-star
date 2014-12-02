"""
Here is a minimal testing suite for basic server side
operations. e.g. some sample URLs
"""
import requests

# This response is destined to fail and send back a
# a single fail red X image.
resp = requests.post('http://fatty.lucasou.com/api/highscore_send',
                     data={'text': ''})

print resp.json()
