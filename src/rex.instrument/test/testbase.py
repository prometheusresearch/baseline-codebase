
import os
import shutil
import unittest

class TestCase(unittest.TestCase):

    def setUp(self):
        current = os.path.dirname(__file__)
        self.data_dir = os.path.join(current, 'data')
        storage_dir = os.path.join(self.data_dir, 'storage')
        if os.path.exists(storage_dir):
            shutil.rmtree(storage_dir)
        os.mkdir(storage_dir)
        self.storage_dir = storage_dir


    def tearDown(self):
        for file in os.listdir(self.data_dir):
            if file not in ('.', '..'):
                path = os.path.join(self.data_dir, file)
                if os.path.isfile(path):
                    os.unlink(path)
                else:
                    shutil.rmtree(path)
