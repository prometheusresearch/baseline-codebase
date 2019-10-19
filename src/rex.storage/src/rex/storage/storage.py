
import io
import os.path
import tempfile

from collections import OrderedDict

import cloudstorage

from rex.core import get_settings, cached

from .util import parse_url, join
from .driver import get_driver
from .errors import StorageError


@cached
def get_storage():
    storage = Storage()
    return storage


class Mount:
    def __init__(self, path_prefix, **config):
        self.path_prefix = path_prefix
        self.config = config
        self.url_prefix = self.config.pop('url')
        service, container_name, base_path = parse_url(self.url_prefix)
        self.base_path = base_path

        try:
            driver = get_driver(service)
            storage = driver(**self.config)
            storage.validate_credentials()
            self.container = storage.get_container(container_name)
        except cloudstorage.exceptions.NotFoundError:
            raise StorageError(f'"{container_name}" not found')
        except cloudstorage.exceptions.CredentialsError as exc:
            raise StorageError(
                f'Could not verify connection to storage: {exc}'
            )

    def path(self, *name):
        return Path(self, '').join(*name)

    def __iter__(self):
        return get_storage().object_list(self.path_prefix)

    def __str__(self):
        return self.path_prefix

    def __repr__(self):
        return f'{self.__class__.__name__}({self.path_prefix!r})'


class Path:
    def __init__(self, mount, name):
        self.mount = mount
        self.name = name

    @property
    def url_prefix(self):
        return self.mount.url_prefix

    @property
    def url_full(self):
        return join(self.mount.url_prefix, self.name)

    @property
    def path_prefix(self):
        return self.mount.path_prefix

    @property
    def path_full(self):
        return join(self.mount.path_prefix, self.name)

    @property
    def file_name(self):
        return os.path.basename(self.name)

    @property
    def dir_name(self):
        return os.path.dirname(self.name)

    @property
    def container_location(self):
        return join(self.mount.base_path, self.name).lstrip('/')

    def download(self, file_or_path):
        return get_storage().download(self, file_or_path)

    def get(self, encoding=None):
        return get_storage().get(self, encoding=encoding)

    def join(self, *parts):
        return Path(
            self.mount,
            join(self.name, *parts).lstrip('/'),
        )

    def pop(self):
        name = self.name
        if name.endswith('/'):
            name = name[:-1]
        name = os.path.dirname(name)
        if name:
            name += '/'
        return Path(self.mount, name)

    def __add__(self, other):
        return self.join(other)

    def __str__(self):
        return self.name

    def __repr__(self):
        return f'{self.__class__.__name__}({self.mount!r}, {self.name!r})'


class File:
    def __init__(self, path, fobj=None):
        self.path = path
        self._fobj = fobj

    def __getattr__(self, attr):
        if not self._fobj:
            self._fobj = get_storage().get(self.path)._fobj
        return getattr(self._fobj, attr)

    def __str__(self):
        return self.path.name

    def __repr__(self):
        return f'{self.__class__.__name__}({self.path!r})'


class Storage:
    def __init__(self):
        self.mounts = {}

        # Translate the configuration into Mounts
        for path, config in get_settings().storage_mount.items():  # noqa: no-member
            config = dict(config)
            if len(config) == 1:  # only 'url' is defined
                service, _, _ = parse_url(config['url'])
                config.update(
                    get_settings().storage_credentials[service] or {}  # noqa: no-member
                )
            self.mounts[path] = Mount(path, **config)

        # Index the Mounts for faster lookups later.
        self._path_prefixes = OrderedDict(
            sorted(
                self.mounts.items(),
                key=lambda item: -len(item[0]),
            )
        )
        self._url_prefixes = OrderedDict(
            sorted(
                {
                    mount.url_prefix: mount
                    for mount in self.mounts.values()
                }.items(),
                key=lambda item: -len(item[0]),
            )
        )

    def parse_path(self, storage_path):
        if isinstance(storage_path, Path):
            return storage_path

        storage_path = storage_path.strip()

        if storage_path.startswith('/'):
            for prefix in self._path_prefixes:
                if storage_path.startswith(prefix):
                    return Path(
                        self._path_prefixes[prefix],
                        storage_path[len(prefix):],
                    )

            mount = self._path_prefixes.get(
                storage_path + '/'
            )
            if mount:
                return Path(mount, '')

        else:
            for prefix in self._url_prefixes:
                if storage_path.startswith(prefix):
                    return Path(
                        self._url_prefixes[prefix],
                        storage_path[len(prefix):],
                    )

            mount = self._url_prefixes.get(
                storage_path + '/'
            )
            if mount:
                return Path(mount, '')

        raise StorageError(
            f'A mount point for "{storage_path}" is not configured'
        )

    def join(self, *parts):  # noqa: no-self-use
        return join(*parts)

    def put(self, storage_path, content, encoding=None):
        path = self.parse_path(storage_path)

        encoding = encoding or 'utf-8'

        if isinstance(content, bytes):
            content = io.BytesIO(content)
        elif isinstance(content, str):
            content = io.BytesIO(content.encode(encoding))
        elif isinstance(content, io.StringIO):
            content = io.BytesIO(content.getvalue().encode(
                content.encoding or encoding,
            ))
        elif isinstance(content, io.TextIOBase):
            # This is not optimal, as it requires us to read the whole thing
            # into memory.
            content = io.BytesIO(
                content.read().encode(content.encoding or encoding),
            )

        try:
            path.mount.container.upload_blob(
                content,
                blob_name=path.container_location,
            )
        except cloudstorage.exceptions.NotFoundError as exc:
            raise StorageError(str(exc))

        return File(path)

    def download(self, storage_path, file_or_path):
        path = self.parse_path(storage_path)

        if isinstance(file_or_path, str):
            file = open(file_or_path, 'wb')
        else:
            file = file_or_path

        try:
            blob = path.mount.container.get_blob(path.container_location)
        except cloudstorage.exceptions.NotFoundError as exc:
            raise StorageError(str(exc))

        blob.download(file)

    def get(self, storage_path, encoding=None):
        tmp = tempfile.TemporaryFile()

        path = self.parse_path(storage_path)
        self.download(path, tmp)
        tmp.seek(0)

        if encoding:
            tmp = io.TextIOWrapper(
                io.BufferedReader(tmp),
                encoding=encoding,
            )

        return File(path, fobj=tmp)

    def exists(self, storage_path):
        return len(list(self.object_list(storage_path))) > 0

    def object_list(self, storage_path):
        path = self.parse_path(storage_path)
        mount_root = path.container_location.lstrip('/')
        for blob in path.mount.container:
            if not mount_root:
                yield path.join(blob.name)
            elif blob.name.startswith(mount_root):
                yield path.join(blob.name[len(mount_root):])

    def object_tree(self, storage_path):
        tree = {}

        for path in self.object_list(storage_path):
            parts = path.name.split('/')

            scope = tree
            while parts:
                part = parts.pop(0)
                if parts:
                    dirname = part + '/'
                    if dirname not in scope:
                        scope[dirname] = {}
                    scope = scope[dirname]
                else:
                    scope[part] = path

        return tree

