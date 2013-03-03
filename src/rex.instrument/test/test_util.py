import os
from testbase import TestCase 

from rex.instrument.util import FileLock

class TestFileLock(TestCase):

    def setUp(self):
        super(TestFileLock, self).setUp()
        self.filename = os.path.join(self.data_dir, 'lock')
        open(self.filename, 'w').close()

    def test_basic(self):
        lock = FileLock(self.filename) 
        with lock:
            self.assertEqual(1,1)

    def test_create_file_if_not_exists(self):
        filename = os.path.join(self.data_dir, 'lock2')
        with FileLock(filename, create=True):
            self.assertTrue(os.path.isfile(filename))
        filename = os.path.join(self.data_dir, 'lock3')
        with self.assertRaises(IOError):
            with FileLock(filename, create=False):
                pass

    def test_simultaneous_process(self):
        lock = FileLock(self.filename)
        import subprocess
        import sys
        import time
        line = '%s -c "%s"' % (sys.executable, """\
from rex.forms.model.util import FileLock
import time
with FileLock('%s'):
    time.sleep(2)
""" % self.filename)
        proc = subprocess.Popen(line, shell=True)
        start = time.time()
        time.sleep(1)
        with lock:
            self.assertGreater(time.time() - start, 2)

    def test_simultaneous_threads(self):
        lock = FileLock(self.filename)
        import time
        from threading import Thread
        def get_callable(filename):
            def call(*args, **kwds):
                with FileLock(filename):
                    time.sleep(2)
            return call
        thread = Thread(target=get_callable(self.filename))
        thread.daemon = True
        thread.start()
        start = time.time()
        time.sleep(1)
        with lock:
            self.assertGreater(time.time() - start, 2)

    def tearDown(self):
        if os.path.isfile(self.filename):
            os.unlink(self.filename)
        super(TestFileLock, self).tearDown()
