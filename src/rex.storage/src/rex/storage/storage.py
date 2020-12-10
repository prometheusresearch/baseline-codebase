import io
import mimetypes
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
    """
    Retrieves the primary interface to the rex.storage system.

    :rtype: rex.storage.Storage
    """

    return Storage()


class Mount:
    """
    Represents a mounted container in the rex.storage system.
    """

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
        """
        Builds a Path object for the given object name on this Mount.

        :param name: the name of the object
        :type name: str
        :rtype: rex.storage.Path
        """

        return Path(self, '').join(*name)

    def __iter__(self):
        return get_storage().object_list(self.path_prefix)

    def __str__(self):
        return self.path_prefix

    def __repr__(self):
        return f'{self.__class__.__name__}({self.path_prefix!r})'


class Path:
    """
    Represents a full location to an object in the rex.storage system.
    """

    def __init__(self, mount, name):
        self._blob = None

        #: The rex.storage.Mount that this Path is a part of.
        self.mount = mount

        #: The name of the object relative to its mount point.
        self.name = name

    @property
    def url_prefix(self):
        """
        The mount point where the object is located, in URL form.
        """
        return self.mount.url_prefix

    @property
    def url_full(self):
        """
        The full path of the object, in URL form.
        """
        return join(self.mount.url_prefix, self.name)

    @property
    def path_prefix(self):
        """
        The mount point where the object is located, in filepath form.
        """
        return self.mount.path_prefix

    @property
    def path_full(self):
        """
        The full path of the object, in filepath form.
        """
        return join(self.mount.path_prefix, self.name)

    @property
    def file_name(self):
        """
        The name of the file this object represents.
        """
        return os.path.basename(self.name)

    @property
    def dir_name(self):
        """
        The name of the directory that this object is in.
        """
        return os.path.dirname(self.name)

    @property
    def container_location(self):
        """
        The full path of the object, relative to the root of the container.
        """
        return join(self.mount.base_path, self.name).lstrip('/')

    @property
    def blob(self):
        """
        The cloudstorage.Blob object that represents this Path.
        """
        if not self._blob:
            self._blob = self.mount.container.get_blob(self.container_location)
        return self._blob

    def __getattr__(self, name):
        # Expose a controlled set of attributes from the underlying blob
        BLOB_PROPS = (
            'size',
            'created_at',
            'modified_at',
        )
        if name in BLOB_PROPS:
            return getattr(self.blob, name)
        raise AttributeError(name)

    def download(self, file_or_path):
        """
        Downloads the object to the specified location.

        :param file_or_path: the location to download the file to
        :type file_or_path: file-like object|str
        """
        return get_storage().download(self, file_or_path)

    def get(self, encoding=None):
        """
        Retrieves the object from the system.

        :param encoding:
            if the content of the object is text, this is the encoding to use
            to decode the bytes when reading it
        :type encoding: str
        :rtype: rex.storage.File
        """
        return get_storage().get(self, encoding=encoding)

    def delete(self):
        """
        Deletes the object from the container.
        """
        return get_storage().delete(self)

    def join(self, *parts):
        """
        Returns a new Path object with the specified parts appended.

        :rtype: rex.storage.Path
        """
        return Path(
            self.mount,
            join(self.name, *parts).lstrip('/'),
        )

    def pop(self):
        """
        Returns a new Path object with the last part of the path removed.

        :rtype: rex.storage.Path
        """
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
    """
    A file-like object representing an object in the rex.storage system.
    """

    def __init__(self, path, fobj=None):
        #: The rex.storage.Path that this file corresponds to.
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
    """
    The core interface of the rex.storage API.
    """

    def __init__(self):
        #: A mapping of the available mount points to their rex.storage.Mount
        #: representations.
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
        """
        Creates a Path object that represents the specified path.

        The specified path is expected to be in either URL form (e.g.,
        "scheme://container/path/to/file.ext") or filepath form (e.g.,
        "/mount/point/file.ext").

        :param storage_path: the path to parse
        :type storage_path: str|rex.storage.Path
        :rtype: rex.storage.Path
        """

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

    def put(self, storage_path, content, encoding=None, content_type=None):
        """
        Stores content to an object in the system.

        :param storage_path: the location to store the content in
        :type storage_path: str|rex.storage.Path
        :param content: the content to store in the container
        :type content: bytes|str|io.IOBase
        :param encoding:
            if the content is a ``str`` or ``io.TextIOBase``, this is the
            encoding scheme to use when marshalling it into bytes; defaults to
            ``utf-8`` if not specified
        :type encoding: str
        :param content_type:
            a MIME type that describes the contents of the file; if not
            specified, a guess will be made, falling back to
            ``application/octet-stream`` if a good guess could not be made
        :type content_type: str
        :rtype: rex.storage.File
        """

        path = self.parse_path(storage_path)

        encoding = encoding or 'utf-8'
        if not content_type:
            content_type = mimetypes.guess_type(path.container_location)[0]
        content_type = content_type or 'application/octet-stream'

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
                content_type=content_type,
            )
        except cloudstorage.exceptions.NotFoundError as exc:
            raise StorageError(str(exc))

        return File(path)

    def download(self, storage_path, file_or_path):
        """
        Retrieves an object from the system and stores its contents to the
        specified location.

        :param storage_path: the path of the object to retrieve
        :type storage_path: str|rex.storage.Path
        :param file_or_path: the location to download the file to
        :type file_or_path: file-like object|str
        """

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
        """
        Retrieves an object from the system.

        :param storage_path: the path of the object to retrieve
        :type storage_path: str|rex.storage.Path
        :param encoding:
            if the content of the object is text, this is the encoding to use
            to decode the bytes when reading it
        :type encoding: str
        :rtype: rex.storage.File
        """

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
        """
        Determines whether or not the specified path is an actual object in
        the system.

        :param storage_path: the path of the object check for
        :type storage_path: str|rex.storage.Path
        """
        return len(list(self.object_list(storage_path))) == 1

    def delete(self, storage_path):
        """
        Deletes the object at the specified path from the container.

        :param storage_path: the path of the object to delete
        :type storage_path: str|rex.storage.Path
        """

        path = self.parse_path(storage_path)

        try:
            blob = path.mount.container.get_blob(path.container_location)
            blob.delete()
        except cloudstorage.exceptions.NotFoundError:
            pass

    def object_list(self, storage_path):
        """
        A generator that returns the objects that exist at the specified path.

        :param storage_path: the path to look for objects in
        :type storage_path: str|rex.storage.Path
        :rtype: iter(rex.storage.Path)
        """
        path = self.parse_path(storage_path)
        mount_root = path.mount.base_path.lstrip('/')
        for blob in path.mount.container:
            if not blob.name.startswith(path.container_location):
                continue
            yield path.mount.path(blob.name[len(mount_root):])

    def object_tree(self, storage_path):
        """
        Returns a nested dictionary that provides a simple representation of
        the objects that exist at the specified path.

        :param storage_path: the path to look for objects in
        :type storage_path: str|rex.storage.Path
        :rtype: dict
        """

        tree = {}

        storage_path = self.parse_path(storage_path)
        prefix_len = len(storage_path.name)
        if prefix_len:
            prefix_len += 1

        for path in self.object_list(storage_path):
            parts = path.name[prefix_len:].split('/')

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
