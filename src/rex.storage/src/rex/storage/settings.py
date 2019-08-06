
from rex.core import Error, MapVal, AnyVal, ChoiceVal, Setting, StrVal

from .driver import DRIVERS
from .util import normalize_mount_point, normalize_storage
from .errors import StorageError

ServiceVal = ChoiceVal(*DRIVERS.keys())

class StorageCredentials(Setting):
    """
    The default credentials for storage drivers.
    Mapping, following keys are possible:
    - s3: Amazon S3
    - gcs: Google Cloud Service
    - local: local file system
    The values for each key are specific to a service.
    All the keys can be present at the same time.
    """

    name = 'storage_credentials'
    validate = MapVal(ServiceVal, MapVal(StrVal(), AnyVal()))
    default = {}


class StorageMount(Setting):
    """
    Mount table for the virtual file system. Mapping, where:
        - keys denote the path starting with '/'
        - values are either just cloud URLs or cloud URLs with required credentials
        - if specific credentials are not provided, then the respective driver
          credentials from the ``storage_credentials`` are used to connect.

    Example::

        storage_mount:
            /attach: s3://attach-bucket/
            /other-dir:
                url: local://my-local-storage/
                key: ./real/filysystem/path
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
                storage = normalize_storage(storage)
            except StorageError as e:
                errors.append(e.message)
                continue
            if mount_point in mount:
                errors.append(f'Mount point `{path}` is already defined. '
                               'Check treainling slash.')
                continue
            mount[mount_point] = storage
        if errors:
            raise Error("\n".join(errors))
        return mount
