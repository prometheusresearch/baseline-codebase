#
# Copyright (c) 2014, Prometheus Research, LLC
#


"""
This package provides a storage for uploaded files.
"""


from rex.core import (get_settings, Setting, Initialize, Validate, StrVal,
        MaybeVal, Error, cached)
from rex.web import HandleLocation, authorize
from webob import Response
from webob.static import FileIter, BLOCK_SIZE
from webob.exc import HTTPMethodNotAllowed, HTTPNotFound, HTTPUnauthorized
import re
import os
import io
import datetime
import uuid
import mimetypes
import shutil
import cgi
import collections


def sanitize_filename(filename):
    """
    Sanitizes a string to make it safe for use as a filename.

    Any non-alphanumeric characters are removed; the length is restricted
    to 128 bytes.
    """
    assert isinstance(filename, str)
    # Strip whitespaces and non-alphanumeric characters.
    filename = os.path.basename(filename)
    filename = filename.strip()
    filename = filename.replace(' ', '_')
    filename = re.sub(r'[^\w.-]', '', filename, flags=re.U)
    # Deal with weird names.
    if not filename or filename.startswith('.'):
        filename = '_'+filename
    if '.' not in filename or filename.endswith('.'):
        filename = filename+'.dat'
    # Limit the length.
    while len(filename.encode('utf-8')) > 128:
        l = len(filename)
        filename = filename[:l//3]+'...'+filename[-l//3:]
    return filename


class OpenFileApp:
    # Like `webob.static.FileApp`, but takes an open file object instead.

    def __init__(self, name, file, stat):
        self.name = name
        self.file = file
        self.stat = stat

    def __call__(self, req):
        # Adapted from `FileApp.__call__()`.
        if 'wsgi.file_wrapper' in req.environ:
            app_iter = req.environ['wsgi.file_wrapper'](self.file, BLOCK_SIZE)
        else:
            app_iter = FileIter(self.file)
        last_modified = self.stat.st_mtime
        content_length = self.stat.st_size
        content_type, content_encoding = mimetypes.guess_type(self.name)
        content_disposition = "attachment; filename=%s" \
                % sanitize_filename(self.name)
        accept_ranges = 'bytes'
        return Response(
                app_iter=app_iter,
                last_modified=last_modified,
                content_length=content_length,
                content_type=content_type,
                content_encoding=content_encoding,
                content_disposition=content_disposition,
                accept_ranges=accept_ranges,
                conditional_response=True)


class Storage:
    """
    Abstract interface for the attachment storage.
    """

    def add(self, name, content):
        """
        Adds an attachment to the storage.

        `name`
            The name of the attachment (the filename).

        `content`
            The attachment content; either a string or an open file object.

        Returns an opaque attachment handle.
        """
        raise NotImplementedError

    def reserve(self, name):
        """
        Reserves an attachment handle without adding the attachment to the storage.

        `name`
            The name of the attachment (the filename).

        Returns an opaque attachment handle or ``None`` if the storage does not
        support this feature.
        """
        return None

    def open(self, handle):
        """
        Gets an attachment by attachment handle.

        Returns an open file object.
        """
        raise NotImplementedError

    def remove(self, handle):
        """
        Deletes an attachment.
        """
        raise NotImplementedError

    def stat(self, handle):
        """
        Gets information about the attachment.

        Returns a named tuple in format produced by ``os.stat()``.
        """
        raise NotImplementedError

    def __iter__(self):
        """
        Generates handles for all attachments in the storage.
        """
        raise NotImplementedError

    def upload_link(self, handle):
        """
        Generates a URL for uploading the content of the handle.

        Returns ``None`` if not supported by the storage backend.
        """
        return None

    def download_link(self, handle):
        """
        Generates a URL for downloading the content of the handle.

        Returns ``None`` if not supported by the storage backend.
        """
        return None

    def route(self, handle):
        """
        Returns a WSGI application that serves the given attachment.
        """
        name = os.path.basename(handle)
        file = self.open(handle)
        stat = self.stat(handle)
        return OpenFileApp(name, file, stat)


class PresignedLink:
    """
    Represents a pre-signed link to a storage service.

    `url`
        The URL.

    `fields`
        If set, a list of fields to be submitted in the POST body.
    """

    __slots__ = ('url', 'fields')

    def __init__(self, url, fields=None):
        self.url = url
        self.fields = fields

    def __call__(self, req):
        data = {'url': self.url}
        if self.fields is not None:
            data['fields'] = self.fields
        return Response(json=data)

    def __repr__(self):
        args = [repr(self.url)]
        if self.fields is not None:
            args.append(repr(self.fields))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class LocalStorage(Storage):
    """
    Stores attachments in the local file system.

    `attach_dir`
        Directory where attachments are stored.  Must exist and be writable.
    """

    # Attachment handles must match the pattern:
    #   /YYYY/MM/DD/{uuid}/{filename}
    handle_re = re.compile(r'''
        \A
        / [0-9]{4}
        / [0-9]{2}
        / [0-9]{2}
        / [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
        / [\w-][\w.-]*
        \Z''', re.X|re.U)

    def __init__(self, attach_dir):
        self.attach_dir = attach_dir

    def add(self, name, content):
        if isinstance(content, str):
            content = content.encode('utf-8')
        # Sanitize the file name.
        name = sanitize_filename(name)
        # The directory where we save the file:
        #   `{attach_dir}/YYYY/MM/DD/{uuid}/`.
        target_dir = self.attach_dir
        # Create `/YYYY/MM/DD` directories.
        today = datetime.date.today()
        for fmt in ('%Y', '%m', '%d'):
            target_dir = os.path.join(target_dir, today.strftime(fmt))
            try:
                os.mkdir(target_dir)
            except OSError:
                if not os.path.isdir(target_dir):
                    raise
        # Create a temporary directory: `/YYYY/MM/DD/{uuid}.adding/`.
        random_uuid = str(uuid.uuid4())
        target_dir = os.path.join(target_dir, random_uuid)
        tmp_dir = target_dir+'.adding'
        os.mkdir(tmp_dir)
        # Save the attachment to the temporary directory.
        path = os.path.join(tmp_dir, name)
        with open(path, 'wb') as stream:
            if hasattr(content, 'read'):
                shutil.copyfileobj(content, stream)
            else:
                stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        # Rename `/YYYY/MM/DD/{uuid}.adding/` to `/YYYY/MM/DD/{uuid}/`.
        os.rename(tmp_dir, target_dir)
        # Generate and return the attachment handle (which coincides with
        # the path to the attachment relative to `attach_dir`).
        handle = '/'+today.strftime('%Y/%m/%d')+'/'+random_uuid+'/'+name
        return handle

    def abspath(self, handle):
        # Converts an attachment handle to a path.  Verifies that the handle
        # is well-formed, but does not check if the file exists.
        if not self.handle_re.match(handle):
            raise Error("Ill-formed attachment handle:", handle)
        return os.path.join(self.attach_dir, handle[1:])

    def open(self, handle):
        path = self.abspath(handle)
        try:
            return open(path, 'rb')
        except IOError:
            if not os.path.exists(path):
                raise Error("Attachment does not exist:", handle) from None
            raise

    def remove(self, handle):
        # Protect against ill-formed and unknown handles.
        path = self.abspath(handle)
        if not os.path.exists(path):
            raise Error("Attachment does not exist:", handle)
        # Start with renaming the attachment directory.
        target_dir = os.path.dirname(path)
        name = os.path.basename(path)
        tmp_dir = target_dir+'.removing'
        tmp_path = os.path.join(tmp_dir, name)
        try:
            os.rename(target_dir, tmp_dir)
        except OSError:
            # Race condition?
            if not os.path.exists(path):
                raise Error("Attachment does not exist:", handle)
            raise
        # Remove the attachment and the temporary directory.
        os.unlink(tmp_path)
        os.rmdir(tmp_dir)

    def stat(self, handle):
        path = self.abspath(handle)
        try:
            return os.stat(path)
        except OSError:
            if not os.path.exists(path):
                raise Error("Attachment does not exist:", handle)
            raise

    def __iter__(self):
        # Emit all files that have a well-formed handle for a path.
        for handle in self._listdir(self.attach_dir):
            if self.handle_re.match(handle):
                yield handle

    def _listdir(self, base_dir):
        # Emits handles for all files in the given directory.
        for path in sorted(os.listdir(base_dir)):
            handle = '/'+path
            path = os.path.join(base_dir, path)
            if os.path.isfile(path):
                yield handle
            elif os.path.isdir(path):
                prefix = handle
                for handle in self._listdir(path):
                    yield prefix+handle

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.attach_dir)


class NoCloseFile:
    # Workaround for https://github.com/boto/s3transfer/issues/80

    def __init__(self, _file):
        self._file = _file

    def read(self, amount=None):
        return self._file.read(amount)

    def seek(self, offset, whence=0):
        return self._file.seek(offset, whence)

    def tell(self):
        return self._file.tell()

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self):
        pass


class S3Storage(Storage):
    """
    Stores attachments in a remote S3 server.
    """

    handle_re = LocalStorage.handle_re

    def __init__(self, name, endpoint=None, region=None, access_key=None, secret_key=None):
        self.name = name
        self.endpoint = endpoint
        self.region = region
        self.access_key = access_key
        self.secret_key = secret_key

    def add(self, name, content):
        name = sanitize_filename(name)
        if isinstance(content, bytes):
            content = io.BytesIO(content)
        else:
            content = NoCloseFile(content)
        today = datetime.date.today()
        random_uuid = str(uuid.uuid4())
        handle = '/'+today.strftime('%Y/%m/%d')+'/'+random_uuid+'/'+name
        obj = self.get_object(handle)
        obj.upload_fileobj(content)
        return handle

    def reserve(self, name):
        name = sanitize_filename(name)
        today = datetime.date.today()
        random_uuid = str(uuid.uuid4())
        handle = '/'+today.strftime('%Y/%m/%d')+'/'+random_uuid+'/'+name
        return handle

    def open(self, handle):
        obj = self.get_object(handle, load=True)
        content = io.BytesIO()
        obj.download_fileobj(content)
        content.seek(0)
        return content

    def remove(self, handle):
        obj = self.get_object(handle, load=True)
        obj.delete()

    def stat(self, handle):
        obj = self.get_object(handle, load=True)
        size = obj.content_length
        st_mtime = int((obj.last_modified.replace(tzinfo=None) - datetime.datetime(1970, 1, 1)).total_seconds())
        return os.stat_result((0, 0, 0, 0, 0, 0, size, st_mtime, st_mtime, st_mtime))

    def __iter__(self):
        bucket = self.get_bucket()
        for obj in bucket.objects.all():
            handle = '/'+obj.key
            if self.handle_re.match(handle):
                yield handle

    def upload_link(self, handle):
        obj = self.get_object(handle, load=False)
        data = obj.meta.client.generate_presigned_post(
                Bucket=obj.bucket_name,
                Key=obj.key)
        url = data['url']
        fields = data['fields']
        if self.endpoint == 'https://storage.googleapis.com':
            fields['GoogleAccessId'] = fields['AWSAccessKeyId']
            del fields['AWSAccessKeyId']
        return PresignedLink(url, fields)

    def download_link(self, handle):
        obj = self.get_object(handle)
        url = obj.meta.client.generate_presigned_url(
                ClientMethod='get_object',
                Params={'Bucket': obj.bucket_name, 'Key': obj.key})
        if self.endpoint == 'https://storage.googleapis.com':
            url = url.replace('?AWSAccessKeyId=', '?GoogleAccessId=')
        return PresignedLink(url)

    def get_bucket(self):
        return get_bucket(self.name,
                          endpoint=self.endpoint,
                          region=self.region,
                          access_key=self.access_key,
                          secret_key=self.secret_key)

    def get_object(self, handle, load=False):
        if not self.handle_re.match(handle):
            raise Error("Ill-formed attachment handle:", handle)
        bucket = self.get_bucket()
        obj = bucket.Object(handle[1:])
        if load:
            import botocore
            try:
                obj.load()
            except botocore.exceptions.ClientError as e:
                if e.response['Error']['Code'] == '404':
                    raise Error("Attachment does not exist:", handle)
                raise
        return obj

    def __repr__(self):
        args = [repr(self.name)]
        if self.endpoint is not None:
            args.append("endpoint=%r" % self.endpoint)
        if self.region is not None:
            args.append("region=%r" % self.region)
        if self.access_key is not None:
            args.append("access_key=%r" % self.access_key)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


def get_bucket(name, endpoint=None, region=None, access_key=None, secret_key=None):
    import boto3, botocore
    session = boto3.session.Session(aws_access_key_id=access_key,
                                    aws_secret_access_key=secret_key,
                                    region_name=region)
    signature_version = 's3v4'
    if endpoint == 'https://storage.googleapis.com':
        signature_version = 's3'
        # Do not append 'encoding=url' to the query string.
        session.events.unregister('before-parameter-build.s3.ListObjects',
                                  botocore.handlers.set_list_objects_encoding_type_url)
    s3 = session.resource('s3',
                          endpoint_url=endpoint,
                          config=botocore.config.Config(signature_version=signature_version))
    return s3.Bucket(name)


class AttachDirSetting(Setting):
    """
    Directory where to save uploaded files and other attachments.

    Either `attach_dir` or `attach_s3_bucket` must be specified.

    Example::

        attach_dir: /srv/rexdb/attachments
    """

    name = 'attach_dir'
    validate = StrVal()
    default = None


class AttachS3BucketSetting(Setting):
    """
    The name of the S3 bucket holding the attachment storage.

    Either `attach_dir` or `attach_s3_bucket` must be specified.

    Example::

        attach_s3_bucket: attachments
    """
    name = 'attach_s3_bucket'
    validate = StrVal()
    default = None


class AttachS3EndpointSetting(Setting):
    """
    The URL of the S3 endpoint.

    By default, assumes Amazon S3 service.  To use Google Cloud Storage (GCS),
    specify `https://storage.googleapis.com`.

    Example::

        attach_s3_endpoint: http://minio:9000
    """
    name = 'attach_s3_endpoint'
    validate = MaybeVal(StrVal())
    default = None


class AttachS3RegionSetting(Setting):
    """
    The region for Amazon S3 and GCS services.
    """
    name = 'attach_s3_region'
    validate = MaybeVal(StrVal())
    default = None


class AttachS3AccessKeySetting(Setting):
    """
    The access key to the S3 server.
    """
    name = 'attach_s3_access_key'
    validate = MaybeVal(StrVal())
    default = None


class AttachS3SecretKeySetting(Setting):
    """
    The secret key to the S3 server.
    """
    name = 'attach_s3_secret_key'
    validate = MaybeVal(StrVal())
    default = None


class InitializeAttach(Initialize):
    # Verifies that the attachment storage is configured correctly.

    def __call__(self):
        get_storage()


class HandleAttachLocation(HandleLocation):
    """
    Serves attachments by handle.
    """

    path = '*'

    def __call__(self, req):
        # Check if the request has access to the service.
        if not authorize(req, self.package()):
            raise HTTPUnauthorized()
        # Allow only GET and HEAD requests.
        if req.method not in ('GET', 'HEAD'):
            raise HTTPMethodNotAllowed()
        # Forward the request to the gateway object.
        storage = get_storage()
        try:
            handler = storage.route(req.path_info)
        except Error:
            raise HTTPNotFound()
        return handler(req)


@cached
def get_storage():
    """
    Returns an attachment storage object for the current Rex application.
    """
    settings = get_settings()
    if settings.attach_dir is not None and settings.attach_s3_bucket is not None:
        raise Error("Only one of the parameters must be set:",
                    "attach_dir, attach_s3_bucket")
    if settings.attach_dir is None and settings.attach_s3_bucket is None:
        raise Error("At least of the parameters must be set:",
                    "attach_dir, attach_s3_bucket")
    if settings.attach_dir is not None:
        attach_dir = settings.attach_dir
        if not os.path.isdir(attach_dir):
            raise Error(
                "Parameter attach_dir must point to an existing directory:",
                attach_dir)
        if not os.access(attach_dir, os.R_OK|os.W_OK|os.X_OK):
            raise Error("The attach_dir directory is not writable:", attach_dir)
        return LocalStorage(settings.attach_dir)
    else:
        bucket = get_bucket(name=settings.attach_s3_bucket,
                            endpoint=settings.attach_s3_endpoint,
                            region=settings.attach_s3_region,
                            access_key=settings.attach_s3_access_key,
                            secret_key=settings.attach_s3_secret_key)
        if bucket.creation_date is None:
            raise Error("Parameter attach_s3_bucket must refer to an existing S3 bucket:",
                        settings.attach_s3_bucket)
        return S3Storage(name=settings.attach_s3_bucket,
                         endpoint=settings.attach_s3_endpoint,
                         region=settings.attach_s3_region,
                         access_key=settings.attach_s3_access_key,
                         secret_key=settings.attach_s3_secret_key)


class AttachmentVal(Validate):
    """
    Accepts an HTML form field containing an uploaded file.

    Produces a pair: the file name and an open file object.
    """
    # TODO: permitted file extensions, validate images?

    Attachment = collections.namedtuple('Attachment', 'name content')

    def __call__(self, data):
        if (isinstance(data, cgi.FieldStorage) and
                data.filename is not None and data.file is not None):
            return self.Attachment(data.filename, data.file)
        if (isinstance(data, tuple) and len(data) == 2 and
                isinstance(data[0], str) and
                hasattr(data[1], 'read')):
            return self.Attachment(*data)
        error = Error("Expected an uploaded file")
        error.wrap("Got:", repr(data))
        raise error


def upload(attachment):
    """
    Adds the given attachment to the storage.

    `attachment`
        A ``cgi.FieldStorage`` instance that contains the uploaded file
        or a pair with two elements: the file name and the file content.

    *Returns:* attachment handle.
    """
    if isinstance(attachment, cgi.FieldStorage):
        name, content = attachment.filename, attachment.file
    else:
        name, content = attachment
    storage = get_storage()
    return storage.add(name, content)


def download(handle):
    """
    Returns an HTTP handler that produces the attachment with the given handle.
    """
    storage = get_storage()
    # FIXME: 404 if not found or invalid?
    return storage.route(handle)


