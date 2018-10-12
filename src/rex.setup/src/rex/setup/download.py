#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


from .generate import Generate
import os, os.path
import urllib.request, urllib.error, urllib.parse
import io
import zipfile
import hashlib
import time
import distutils.log, distutils.errors


class GenerateDownload(Generate):
    # Downloads files; unpacks ZIP archives.

    scheme = ('http', 'https')

    def __call__(self):
        url, md5_hash = parse_url(self.url)
        distutils.log.info("downloading %s into %s" % (url, self.target))
        data = download(url, md5_hash=md5_hash)
        # If the URL is a ZIP archive, unpack it into
        # the target directory.
        if url.endswith('.zip'):
            archive = zipfile.ZipFile(io.BytesIO(data))
            entries = archive.infolist()
            assert entries
            # Find the common prefix to strip from all filenames
            # in the archive.
            common = os.path.commonprefix(
                    [entry.filename for entry in entries])
            if '/' in common:
                common = common.rsplit('/', 1)[0]
            else:
                common = ''
            # Unpack each entry.
            for entry in entries:
                filename = entry.filename[len(common):]
                if filename.startswith('/'):
                    filename = filename[1:]
                if not filename:
                    continue
                filename = os.path.join(self.target, filename)
                dirname = os.path.dirname(filename)
                if not os.path.exists(dirname):
                    os.makedirs(dirname)
                if not filename.endswith('/'):
                    stream = open(filename, 'wb')
                    stream.write(archive.read(entry))
                    stream.close()
        # If the URL is not an archive, save it as a file
        # to the target directory.
        else:
            filename = os.path.join(self.target, os.path.basename(url))
            stream = open(filename, 'wb')
            stream.write(data)
            stream.close()


def parse_url(url):
    # Extract the MD5 hash from the URL.
    md5_hash = None
    if '#' in url:
        url, fragment = url.split('#', 1)
        if fragment.startswith('md5='):
            md5_hash = fragment.split('=', 1)[1]
    return url, md5_hash


def download(url, md5_hash=None):
    # Download the URL (try several times for reliability).
    attempts = 3
    while True:
        try:
            stream = urllib.request.urlopen(url)
            data = stream.read()
            stream.close()
        except Exception as exc:
            if attempts > 0:
                attempts -= 1
                time.sleep(1.0)
                continue
            raise distutils.errors.DistutilsSetupError(
                    "failed to download %s: %s" % (url, exc))
        else:
            break
    digest = hashlib.md5(data).hexdigest()
    # Verify the MD5 hash.
    if not md5_hash:
        distutils.log.warn("missing md5 signature for %s" % url)
    elif digest != md5_hash:
        raise distutils.errors.DistutilsSetupError(
                "md5 signature does not match for %s"
                " (expected: %s, got %s)"
                % (url, md5_hash, digest))
    return data
