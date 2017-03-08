#
# Copyright (c) 2013-2017, Prometheus Research, LLC
#


import raven
import os
import urlparse


def get_sentry_config(public=False, sync=False):
    """
    Returns a dictionary with configuration for the Sentry error tracker.

    `public`
        If set, strip the private key from the DSN.
    `sync`
        If set, use a blocking HTTP client.
    """
    if not os.environ.get('SENTRY_DSN'):
        return {}
    tags = {}
    for key in sorted(os.environ):
        value = os.environ[key]
        if key.startswith('SENTRY_') and value:
            tags[key[7:].lower()] = value
    dsn = tags.pop('dsn')
    if public:
        url = urlparse.urlsplit(dsn)
        netloc = url.host or ''
        if url.port:
            netloc = '%s:%s' % (netloc, url.port)
        if url.username:
            netloc = '%s@%s' % (url.username, netloc)
        dsn = urlparse.urlunsplit(
                (url.scheme, netloc, url.path, url.query, url.fragment))
    config = { 'dsn': dsn }
    if tags:
        config['tags'] = tags
    if sync:
        config['transport'] = raven.transport.http.HTTPTransport
    return config


def get_sentry(sync=False):
    """
    Returns a client for the Sentry error tracker.
    """
    config = get_sentry_config(sync=sync)
    return raven.Client(**config)


