

import os
import fcntl
import tempfile
import shutil

class FileLock(object):

    def __init__(self, filename, create=False):
        self.filename = filename
        self.descriptor = None
        if create:
            if not os.path.isfile(self.filename):
                open(self.filename, 'a').close()
        else:
            if not os.path.isfile(self.filename):
                raise IOError("File %s does not exist" % self.filename)

    def __enter__(self):
        self.descriptor = open(self.filename, 'r')
        fcntl.flock(self.descriptor, fcntl.LOCK_EX)

    def __exit__(self, *args, **kwds):
        fcntl.flock(self.descriptor, fcntl.LOCK_UN)
        self.descriptor.close()
        self.descriptor = None


