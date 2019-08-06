import re

from .errors import StorageError
from .driver import DRIVERS

RE_URL = r'^(?P<service>.+?)://(?P<container>[^/]+)/(?P<path>.*)$'
re_url = re.compile(RE_URL)

def parse_url(url):
    match = re.match(RE_URL, url)
    if match is None:
        raise StorageError(f'URL `{url}` does not match the regexp: `{RE_URL}`')
    service = match.group('service')
    if service not in DRIVERS:
        drivers = ", ".join(DRIVERS.keys())
        raise StorageError(f'No driver for `{url}`. Use one of: {drivers}')
    return (service, match.group('container'), match.group('path'))

def normalize_url(url):
    url = url.strip()
    parse_url(url)
    return url

def normalize_storage(storage):
    if isinstance(storage, str):
        storage = {'url': storage}
    if not isinstance(storage, dict):
        raise StorageError(f'Expected string or dict, got: `{storage}`')
    if 'url' not in storage:
        raise StorageError(f'Expected `"url"` key: `{storage}`')
    if not storage['url'].endswith('/'):
        storage['url'] += '/'
    storage['url'] = normalize_url(storage['url'])
    return storage


def normalize_path(path):
    path = path.strip()
    if not path.startswith("/"):
        raise StorageError(f'Path `{path}` should start with "/"')
    if path == "/":
        raise StorageError(f'Path cannot be root')
    return path


def normalize_mount_point(path):
    path = normalize_path(path)
    return path if path.endswith("/") else path + "/"



