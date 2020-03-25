import cloudstorage

from .cloudstorage_gcs_patch import GoogleStorageDriver
from .cloudstorage_local_patch import LocalDriver
from .rex import RexDriver


DRIVERS = {
    's3': cloudstorage.get_driver_by_name('S3'),
    'gcs': GoogleStorageDriver,
    'local': LocalDriver,
    'rex': RexDriver,
}


def get_driver(driver):
    return DRIVERS.get(driver)


_URL_PREFIX = {p + '://' for p in DRIVERS}


def is_url(value):
    for prefix in _URL_PREFIX:
        if value.startswith(prefix):
            return True
    return False

