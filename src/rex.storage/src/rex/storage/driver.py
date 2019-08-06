import cloudstorage
from .cloudstorage_local_patch import LocalDriver

DRIVERS = {
    's3': cloudstorage.get_driver_by_name('S3'),
    'gcs': cloudstorage.get_driver_by_name('GOOGLESTORAGE'),
    'local': LocalDriver,
}

def get_driver(driver):
    return DRIVERS.get(driver)

_URL_PREFIX = set([p + '://' for p in DRIVERS])
def is_url(s):
    for prefix in _URL_PREFIX:
        if s.startswith(prefix):
            return True
    return False
