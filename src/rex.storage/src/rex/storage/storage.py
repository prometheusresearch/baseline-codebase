
import io
import os
import cloudstorage
from rex.core import get_settings, cached
from .util import parse_url
from .driver import get_driver, is_url
from .errors import StorageError

@cached
def get_storage():
    storage = Storage()
    storage.verify()
    return storage


class Storage:

    def __init__(self):
        self.mount = {}
        settings = get_settings()
        for path, storage in settings.storage_mount.items():
            self.mount[path] = {**storage}
            if len(self.mount[path]) == 1: # only 'url' is defined
                (service, _c, _n) = parse_url(storage['url'])
                credentials = settings.storage_credentials.get(service, {})
                for key, value in credentials.items():
                    self.mount[path][key] = value
        self.cfg = {}
        for path, storage in self.mount.items():
            (service, container, _) = parse_url(storage['url'])
            self.cfg[path] = self.cfg[f'{service}://{container}/'] = \
                dict((k, v) for k,v in storage.items() if k != 'url')

    def verify(self):
        for prefix in self.url_prefixes:
            (service, container, _) = parse_url(prefix)
            self.get_container(f'{service}://{container}/')

    def add(self, path_or_url, content):
        """
        Adds data to the storage.

        `path_or_url`
            The filename or URL of the BLOB.
            Examples:
            - /some/path/file.txt
            - s3://bucket/file.txt

        `content`
            The attachment content; either a string or a file-like object.
        """
        (prefix, name) = self.get_target(path_or_url)
        if isinstance(content, io.TextIOBase):
            content = content.read().encode('utf-8')
        if isinstance(content, str):
            content = io.BytesIO(content.encode('utf-8'))
        elif isinstance(content, bytes):
            content = io.BytesIO(content)
        container = self.get_container(prefix)
        try:
            blob = container.upload_blob(content, blob_name=name)
        except cloudstorage.exceptions.NotFoundError as exc:
            raise StorageError(str(exc))
        return File(url=prefix + name, blob=blob, fp=content)

    def get_blob(self, path_or_url):
        (prefix, name) = self.get_target(path_or_url)
        container = self.get_container(prefix)
        try:
            return container.get_blob(name)
        except cloudstorage.exceptions.NotFoundError as exc:
            raise StorageError(str(exc))

    def download(self, url=None, blob=None):
        if url is None and blob is None:
            raise StorageError('Cannot download, since url & blob both are None')
        if blob is None:
            blob = self.get_blob(url)
        buf = io.BytesIO()
        blob.download(buf)
        buf.seek(0)
        return buf

    def open(self, path_or_url):
        blob = self.get_blob(path_or_url)
        buf = self.download(blob=blob)
        (prefix, name) = self.get_target(path_or_url)
        return File(url=prefix + name, blob=blob, fp=buf)

    def exists(self, path_or_url):
        """
        Checks if file or directory exists
        """
        for name in self.ls(path_or_url):
            return True
        return False

    def is_file(self, path_or_url):
        (prefix, name) = self.get_target(path_or_url)
        container = self.get_container(prefix)
        return name in container

    def is_dir(self, path_or_url):
        return self.exists(path_or_url) and not self.is_file(path_or_url)

    def get_target(self, path_or_url):
        # normalize file or directory
        parts = path_or_url.split('/')
        if len(parts) <= 2: # '/path' should become '/path/'
            path_or_url += '/'
        url_prefix = None
        name = None
        if path_or_url.startswith('/'):
            for prefix in self.path_prefixes:
                if path_or_url.startswith(prefix):
                    url_prefix = self.mount[prefix]['url']
                    name = path_or_url[len(prefix):]
                    break
        else:
            for prefix in self.url_prefixes:
                if path_or_url.startswith(prefix):
                    url_prefix = prefix
                    name = path_or_url[len(prefix):]
                    break
        if url_prefix is None:
            raise StorageError(f'`{path_or_url}` is not found '
                                'in the mount table.')
        (service, container, subdir) = parse_url(url_prefix)
        return (f'{service}://{container}/', subdir + name)

    def join(self, *args):
        res = []
        for arg in args:
            arg = arg.strip()
            if arg.startswith('/') or is_url(arg):
                res = [] # abs path remove all previous parts
            parts = (arg[:-1] if arg.endswith('/') else arg).split('/')
            for part in parts:
                if part == '.':
                    continue
                elif part == '..':
                    if len(res) and res[-1]:
                        res.pop(-1)
                    # TODO: decide if we should raise here?
                else:
                    res.append(part)
        return '/'.join(res)

    def pop_segment(self, path_or_url):
        path_or_url = path_or_url.strip()
        path_or_url = path_or_url[:-1] if path_or_url.endswith('/') \
                                       else path_or_url
        parts = path_or_url.split('/')
        if len(parts) == 1:
            return path_or_url, None
        else:
            return '/'.join(parts[:-1]), parts[-1] or None

    def list_objects(self, path_or_url):
        (prefix, name) = self.get_target(path_or_url)
        container = self.get_container(prefix)
        for blob in container:
            if blob.name == name:
                yield (os.path.basename(name),
                       File(url=prefix + name, blob=blob))
            elif not name:
                yield (blob.name, File(url=prefix+blob.name, blob=blob))
            elif blob.name.startswith(name):
                res = blob.name[len(name):]
                if name.endswith('/'):
                    yield (res, File(url=prefix+blob.name, blob=blob))
                elif res.startswith('/'):
                    yield (res[1:], File(url=prefix+blob.name, blob=blob))

    def ls(self, path_or_url):
        seen = set()
        for (name, f) in self.list_objects(path_or_url):
            parts = name.split('/')
            if len(parts) == 1:
                yield (name, f)
            else:
                dir = parts[0] + '/'
                if dir not in seen:
                    seen.add(dir)
                    yield (dir, None)

    @property
    def path_prefixes(self):
        return sorted((path for path in self.mount), key=lambda p: -len(p))

    @property
    def url_prefixes(self):
        return sorted((s['url'] for s in self.mount.values()),
                      key=lambda u: -len(u))

    def get_container(self, prefix):
        (service, container, _) = parse_url(prefix)
        driver = get_driver(service)
        try:
            storage = driver(**self.cfg[prefix])
            storage.validate_credentials()
            return storage.get_container(container)
        except cloudstorage.exceptions.NotFoundError:
            raise StorageError(f'"{container}" not found')
        except cloudstorage.exceptions.CredentialsError as exc:
            raise StorageError(f'Could not verify connection to storage: {exc}')



class File:

    def __init__(self, url, blob, fp=None):
        self.url = url
        self.blob = blob
        self.fp = fp

    def __getattribute__(self, attr):
        if attr == 'url':
            return object.__getattribute__(self, 'url')
        elif attr == 'blob':
            return object.__getattribute__(self, 'blob')
        else:
            fp = object.__getattribute__(self, 'fp')
            if fp is None:
                fp = self.fp = get_storage().download(url=self.url)
            return getattr(fp, attr)
