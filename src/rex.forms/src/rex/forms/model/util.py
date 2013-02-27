

import os
import fcntl
import tempfile
import shutil


def savefile(filename, data):
    f = tempfile.NamedTemporaryFile(delete=False)
    f.write(data)
    f.close()
    try:
        shutil.move(f.name, filename)
    finally:
        os.unlink(f.name)


class FileLock(object):

    def __init__(self, filename, create=False):
        self.filename = filename
        self.descriptor = None
        if create and not os.path.isfile(self.filename):
            open(self.filename, 'w').close()

    def __enter__(self):
        self.descriptor = open(self.filename, 'r')
        fcntl.flock(self.descriptor, fcntl.LOCK_EX)

    def __exit__(self, *args, **kwds):
        fcntl.flock(self.descriptor, fcntl.LOCK_UN)
        self.descriptor.close()
        self.descriptor = None


