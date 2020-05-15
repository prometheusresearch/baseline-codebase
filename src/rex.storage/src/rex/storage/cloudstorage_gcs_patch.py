import base64
import codecs
import os

from cloudstorage import Driver, Blob
from cloudstorage.drivers.google import GoogleStorageDriver as GCSDriver
from google.cloud import storage


GOOG_CREDS = 'GOOGLE_APPLICATION_CREDENTIALS'


class GoogleStorageDriver(GCSDriver):
    def __init__(self, *args, **kwargs):
        # The __init__ in cloudstorage for this driver forces use of a JSON
        # file containing the credentials. This prevents usage in GKE
        # environments where this is unnecessary. So, this override skips the
        # enforcement of the JSON file's existance.

        super(GCSDriver, self).__init__(*args, **kwargs)

        original_key = os.environ.get(GOOG_CREDS, None)
        desired_key = kwargs.get('key')
        if desired_key:
            os.environ[GOOG_CREDS] = desired_key

        try:
            self._client = storage.Client()
        finally:
            if original_key is not None:
                os.environ[GOOG_CREDS] = original_key
            elif os.environ.get(GOOG_CREDS):
                del os.environ[GOOG_CREDS]


    def validate_credentials(self):
        # No-op this because the cloudstorage package thinks that listing
        # buckets is a universal solution to ensuring that the credentials
        # work.
        pass

    def _make_blob(self, container, blob):
        etag_bytes = base64.b64decode(blob.etag)

        try:
            etag = etag_bytes.hex()
        except AttributeError:
            # Python 3.4: 'bytes' object has no attribute 'hex'
            etag = codecs.encode(etag_bytes, "hex_codec").decode("ascii")

        # There are situations where GCS won't return an MD5 to use here, so
        # this patch avoids a crash.
        md5_hash = None
        if blob.md5_hash:
            md5_bytes = base64.b64decode(blob.md5_hash)

            try:
                md5_hash = md5_bytes.hex()
            except AttributeError:
                # Python 3.4: 'bytes' object has no attribute 'hex'
                md5_hash = codecs.encode(md5_bytes, "hex_codec").decode("ascii")

        return Blob(
            name=blob.name,
            checksum=md5_hash,
            etag=etag,
            size=blob.size,
            container=container,
            driver=self,
            acl=blob.acl,
            meta_data=blob.metadata,
            content_disposition=blob.content_disposition,
            content_type=blob.content_type,
            cache_control=blob.cache_control,
            created_at=blob.time_created,
            modified_at=blob.updated,
        )

