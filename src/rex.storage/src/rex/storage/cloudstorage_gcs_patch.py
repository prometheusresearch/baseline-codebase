import os

from cloudstorage import Driver
from cloudstorage.drivers.google import GoogleStorageDriver as GCSDriver
from google.cloud import storage


class GoogleStorageDriver(GCSDriver):
    def __init__(self, *args, **kwargs):
        # The __init__ in cloudstorage for this driver forces use of a JSON
        # file containing the credentials. This prevents usage in GKE
        # environments where this is unnecessary. So, this override skips the
        # enforcement of the JSON file's existance.

        super(Driver, self).__init__(*args, **kwargs)

        key = kwargs.get('key')
        if key:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key

        self._client = storage.Client()

    def validate_credentials(self):
        # No-op this because the cloudstorage package thinks that listing
        # buckets is a universal solution to ensuring that the credentials
        # work.
        pass

