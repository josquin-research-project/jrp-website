"""Fail-closed verification of single-use Turnstile tokens. Never log secrets/tokens."""
import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen

HOSTNAMES = {'www.josqu.in', 'josqu.in', 'josquin.stanford.edu'}
ACTION = 'jrp-search'

class VerificationFailed(Exception):
    pass

class VerificationUnavailable(Exception):
    pass

def verify(token):
    if not isinstance(token, str) or not token or len(token) > 2048:
        raise VerificationFailed('Please complete the verification and try again.')
    secret = os.environ.get('TURNSTILE_SECRET', '')
    if not secret:
        raise VerificationUnavailable('Search verification is temporarily unavailable.')
    request = Request('https://challenges.cloudflare.com/turnstile/v0/siteverify',
                      data=urlencode({'secret': secret, 'response': token}).encode(),
                      headers={'Content-Type': 'application/x-www-form-urlencoded'}, method='POST')
    try:
        with urlopen(request, timeout=10) as response:
            result = json.load(response)
    except Exception:
        raise VerificationUnavailable('Search verification is temporarily unavailable.') from None
    if not isinstance(result, dict) or result.get('success') is not True or result.get('hostname') not in HOSTNAMES or result.get('action') != ACTION:
        raise VerificationFailed('Verification expired or failed. Please try the search again.')
