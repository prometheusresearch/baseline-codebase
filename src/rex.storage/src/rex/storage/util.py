import re

from rex.core import (
    Validate, Error,
    RecordVal, UnionVal, PathVal, MapVal, OnScalar, OnMap, StrVal, AnyVal
)
from .errors import StorageError
from .driver import DRIVERS, is_url


RE_URL = re.compile(
    r'^(?P<service>.+?)://(?P<container>[^/]+)/(?P<path>.*)$',
)


def parse_url(url):
    match = RE_URL.match(url)
    if match is None:
        raise StorageError(
            f'URL `{url}` does not match the regexp: `{RE_URL.pattern}`'
        )
    service = match.group('service')
    if service not in DRIVERS:
        drivers = ", ".join(DRIVERS.keys())
        raise StorageError(f'No driver for `{url}`. Use one of: {drivers}')
    return (service, match.group('container'), match.group('path'))


NO_VALUE = object()


class ServiceConfigVal(Validate):

    _validate = RecordVal(
        ('key', PathVal(), NO_VALUE),
        ('secret', StrVal(), NO_VALUE),
        ('salt', StrVal(), NO_VALUE),
    )

    def __call__(self, value):
        value = self._validate(value)
        value = value._asdict()
        for key, val in list(value.items()):
            if val is NO_VALUE:
                del value[key]
        return value


class StorageVal(Validate):
    storage_val_pre = UnionVal(
        (OnMap, MapVal(StrVal(), AnyVal())),
        (OnScalar, StrVal()),
    )

    def __call__(self, storage):
        storage = self.storage_val_pre(storage)
        if isinstance(storage, str):
            url = storage
            config = {}
        else:
            if 'url' not in storage:
                raise Error(f'Expected `"url"` key:', storage)
            url = storage.pop('url')
            config = storage
        if not url.endswith('/'):
            url += '/'
        url = url.strip()
        service, _container, _path = parse_url(url)
        if service in ('local', 'rex'):
            config = ServiceConfigVal()(config)
        return {**config, 'url': url}


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


def join(*args):
    res = []
    for arg in args:
        arg = arg.strip()
        if arg.startswith('/') or is_url(arg):
            res = []  # abs path remove all previous parts
        parts = (arg[:-1] if arg.endswith('/') else arg).split('/')
        for part in parts:
            if part == '.':
                continue
            if part == '..':
                if res and res[-1]:
                    res.pop(-1)
                else:
                    raise StorageError(
                        'Cannot use relative paths to access files outside the'
                        ' container'
                    )
            else:
                res.append(part)
    return '/'.join(res)

