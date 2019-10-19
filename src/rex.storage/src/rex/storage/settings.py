
from rex.core import (
    Error, RecordVal, MapVal, AnyVal, ChoiceVal, Setting, StrVal,
    PathVal, MaybeVal)

from .util import (
    normalize_mount_point,
    StorageVal,
    ServiceConfigVal,
)
from .errors import StorageError

class StorageCredentials(Setting):
    """
    The default credentials for storage drivers.
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
                storage = StorageVal()(storage)
            except StorageError as e:
                errors.append(e.message)
                continue
            if mount_point in mount:
                errors.append(f'Mount point `{path}` is already defined. '
                               'Check trailing slash.')
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

