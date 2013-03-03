
import os
import shutil
import unittest

class TestCase(unittest.TestCase):

    def setUp(self):
        current = os.path.dirname(__file__)
        self.data_dir = os.path.join(current, 'data')
        if os.path.isdir(self.data_dir):
            shutil.rmtree(self.data_dir)
        os.mkdir(self.data_dir)
        storage_dir = os.path.join(self.data_dir, 'storage')
        if os.path.exists(storage_dir):
            shutil.rmtree(storage_dir)
        os.mkdir(storage_dir)
        self.storage_dir = storage_dir


    def tearDown(self):
        if os.path.isdir(self.data_dir):
            shutil.rmtree(self.data_dir)
