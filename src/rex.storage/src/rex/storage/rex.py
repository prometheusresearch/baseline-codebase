import os
import shutil

from datetime import datetime, timezone
from stat import S_ISDIR
from typing import Iterable, Dict, List

import xattr

from cloudstorage import Driver, Container, Blob, messages
from cloudstorage.exceptions import (
    CloudStorageError,
    NotFoundError,
)
from cloudstorage.helpers import (
    read_in_chunks,
)
from cloudstorage.typed import (
    ContentLength,
    ExtraOptions,
    FileLike,
    FormPost,
    MetaData,
)

from rex.core import get_packages


def _get_all_packages() -> Iterable[str]:
    return [
        package.name
        for package in get_packages()
        if package.static
    ]


def _get_file_path(package: str, name: str) -> str:
    return get_packages()[package].abspath(name)


class RexDriver(Driver):
    """
    Driver for interacting with the static directories of RexDB packages as if
    they were storage containers.
    """

    name = 'REX'
    hash_type = 'md5'
    url = ''

    def __init__(self):
        super(RexDriver, self).__init__(key=None)

    def __iter__(self) -> Iterable[Container]:
        for package in _get_all_packages():
            yield self._make_container(package)

    def __len__(self) -> int:
        return len(_get_all_packages())

    def get_container(self, container_name: str) -> Container:
        return self._make_container(container_name)

    @property
    def regions(self) -> List[str]:
        # Not applicable.
        return []

    @staticmethod
    def _normalize_parameters(
            params: Dict[str, str],
            normalizers: Dict[str, str]) -> Dict[str, str]:
        return params.copy()  # pragma: no cover

    def validate_credentials(self) -> None:
        # No credentials to validate.
        return None

    def create_container(
            self,
            container_name: str,
            acl: str = None,
            meta_data: MetaData = None) -> Container:
        # Cannot create a RexDB package at runtime.
        raise NotImplementedError

    def patch_container(self, container: Container) -> None:
        # Cannot modify a RexDB package at runtime.
        raise NotImplementedError

    def delete_container(self, container: Container) -> None:
        # Cannot delete a RexDB package at runtime.
        raise NotImplementedError

    def container_cdn_url(self, container: Container) -> str:
        return get_packages()[container.name].abspath('/')

    def enable_container_cdn(self, container: Container) -> bool:
        # Not supported.
        return False

    def disable_container_cdn(self, container: Container) -> bool:
        # Not supported.
        return False

    def upload_blob(  # noqa: too-many-arguments
            self,
            container: Container,
            filename: FileLike,
            blob_name: str = None,
            acl: str = None,
            meta_data: MetaData = None,
            content_type: str = None,
            content_disposition: str = None,
            cache_control: str = None,
            chunk_size: int = 1024,
            extra: ExtraOptions = None) -> Blob:
        # Cannot modify a RexDB package at runtime.
        raise NotImplementedError

    def get_blob(self, container: Container, blob_name: str) -> Blob:
        return self._make_blob(container, blob_name)

    def get_blobs(self, container: Container) -> Iterable[Blob]:
        pkg = get_packages()[container.name]
        container_path = pkg.abspath('/')
        for folder, _, files in pkg.walk('/'):
            for name in files:
                full_path = os.path.join(folder, name)
                object_name = os.path.relpath(full_path, container_path)
                yield self._make_blob(container, object_name)

    def patch_blob(self, blob: Blob) -> None:
        # Cannot modify a RexDB package at runtime.
        raise NotImplementedError

    def delete_blob(self, blob: Blob) -> None:
        # Cannot modify a RexDB package at runtime.
        raise NotImplementedError

    def download_blob(
            self,
            blob: Blob,
            destination: FileLike) -> None:
        blob_path = _get_file_path(blob.container.name, blob.name)

        if isinstance(destination, str):
            base_name = os.path.basename(destination)
            if not base_name and not os.path.exists(destination):
                raise CloudStorageError(
                    'Path %s does not exist.' % destination
                )

            if not base_name:
                file_path = os.path.join(destination, blob.name)
            else:
                file_path = destination

            shutil.copy(blob_path, file_path)

        else:
            with open(blob_path, 'rb') as blob_file:
                for data in read_in_chunks(blob_file):
                    destination.write(data)

    def generate_blob_download_url(
            self,
            blob: Blob,
            expires: int = 3600,
            method: str = 'GET',
            content_disposition: str = None,
            extra: ExtraOptions = None) -> str:
        # Not supported
        raise NotImplementedError

    def blob_cdn_url(self, blob: Blob) -> str:
        return _get_file_path(blob.container.name, blob.name)

    def generate_container_upload_url(  # noqa: too-many-arguments
            self, container: Container,
            blob_name: str,
            expires: int = 3600,
            acl: str = None,
            meta_data: MetaData = None,
            content_disposition: str = None,
            content_length: ContentLength = None,
            content_type: str = None,
            cache_control: str = None,
            extra: ExtraOptions = None) -> FormPost:
        # Not supported
        raise NotImplementedError

    def _make_container(self, folder_name: str) -> Container:
        return Container(
            name=folder_name,
            driver=self,
        )

    def _make_blob(self, container: Container, object_name: str) -> Blob:
        full_path = _get_file_path(container.name, object_name)

        try:
            stat = os.stat(str(full_path))
        except FileNotFoundError:
            raise NotFoundError(messages.BLOB_NOT_FOUND % (object_name,
                                                           container.name))
        else:
            if S_ISDIR(stat.st_mode):
                raise NotFoundError(messages.BLOB_NOT_FOUND % (object_name,
                                                               container.name))

        meta_data = {}
        content_type = None
        content_disposition = None
        cache_control = None

        try:
            attributes = xattr.xattr(full_path)

            for attr_key, attr_value in attributes.items():
                value_str = None

                try:
                    value_str = attr_value.decode('utf-8')
                except UnicodeDecodeError:
                    pass

                if attr_key.startswith(self._OBJECT_META_PREFIX + 'metadata'):
                    meta_key = attr_key.split('.')[-1]
                    meta_data[meta_key] = value_str
                elif attr_key.endswith('content_type'):
                    content_type = value_str
                elif attr_key.endswith('content_disposition'):
                    content_disposition = value_str
                elif attr_key.endswith('cache_control'):
                    cache_control = value_str
        except OSError:
            pass

        return Blob(
            name=object_name,
            checksum=None,
            etag=None,
            size=stat.st_size,
            container=container,
            driver=self,
            acl=None,
            meta_data=meta_data,
            content_disposition=content_disposition,
            content_type=content_type,
            cache_control=cache_control,
            created_at=datetime.fromtimestamp(stat.st_ctime, timezone.utc),
            modified_at=datetime.fromtimestamp(stat.st_mtime, timezone.utc),
        )

    _OBJECT_META_PREFIX = 'user.'

