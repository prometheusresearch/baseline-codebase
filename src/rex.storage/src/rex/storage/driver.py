import cloudstorage

from .cloudstorage_local_patch import LocalDriver
from .rex import RexDriver


DRIVERS = {
    's3': cloudstorage.get_driver_by_name('S3'),
    'gcs': cloudstorage.get_driver_by_name('GOOGLESTORAGE'),
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

