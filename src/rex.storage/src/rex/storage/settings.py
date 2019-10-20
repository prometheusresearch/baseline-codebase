
from rex.core import (
    Error,
    RecordVal,
    MapVal,
    AnyVal,
    Setting,
    StrVal,
    MaybeVal,
)

from .util import (
    normalize_mount_point,
    StorageVal,
    ServiceConfigVal,
)
from .errors import StorageError


class StorageCredentials(Setting):
    """
    The default credentials for ``rex.storage`` drivers. This is used when the
    mount points in the ``storage_mount`` setting don't explicitly define their
    credentials.

    The ``s3`` driver is used when connecting to Amazon S3 buckets. It requires
    the ``key`` property to specify the Access Key and the ``secret`` property
    to specify the Secret Access Key.

    The ``gcs`` driver is used when connecting to Google Cloud Storage
    containers. It requires the ``key`` property to specify the path on the
    local file system to JSON file that contains the Google service account
    credentials.

    The ``local`` driver is used when accessing the local file system. It
    requires the ``key`` property to specify the path on the local file system
    that serves as the root of the storage location.

    The ``rex`` driver requires no properties.

    Example::

        storage_credentials:
            s3:
                key: SOME_ACCESS_KEY
                secret: SUPER_SECRET_KEY
            gcs:
                key: /path/to/credentials.json
            local:
                key: /path/to/root/of/storage
    """

    name = 'storage_credentials'
    validate = RecordVal(
        ('s3', MaybeVal(MapVal(StrVal(), AnyVal())), None),
        ('gcs', MaybeVal(MapVal(StrVal(), AnyVal())), None),
        ('rex', MaybeVal(ServiceConfigVal()), None),
        ('local', MaybeVal(ServiceConfigVal()), None),
    )
    default = validate.record_type(s3=None, gcs=None, local=None, rex=None)


class StorageMount(Setting):
    """
    Mount table for the ``rex.storage`` virtual file system. Mapping, where:

        - Keys denote the path starting with '/'
        - Values are either just cloud URLs or mappings that specify the cloud
          URLs along with required credentials
        - If specific credentials are not provided, then the respective driver
          credentials from the ``storage_credentials`` setting are used to
          connect

    Example::

        storage_mount:
            /some-dir: s3://some-s3-bucket/
            /other-dir:
                url: local://my-local-storage/
                key: /real/filesystem/path
    """

    name = 'storage_mount'
    default = {}

    def validate(self, value):
        if not isinstance(value, dict):
            raise Error("Dictionary is expected")
        mount = {}
        errors = []
        for (path, storage) in value.items():
            try:
                mount_point = normalize_mount_point(path)
                storage = StorageVal()(storage)
            except StorageError as exc:
                errors.append(str(exc))
                continue

            if mount_point in mount:
                errors.append(
                    f'Mount point `{path}` is already defined. Check trailing'
                    ' slash.'
                )
                continue

            mount[mount_point] = storage

        if errors:
            raise Error("\n".join(errors))

        return mount

    def merge(self, old_value, new_value):
        map_val = MapVal()
        value = {}
        value.update(map_val(old_value))
        value.update(map_val(new_value))
        return value

