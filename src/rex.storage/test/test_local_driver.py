import pytest
import util
import os
from rex.core import Rex
from rex.storage import get_storage, StorageError

def setup_function():
    util.remove_storage()
    util.make_storage()
    util.makedirs('container')
    app = Rex(
        'rex.storage_test',
        storage_credentials={'local': {'key': util.storage_path}},
    )
    app.on()

def test_open_out_of_container():
    storage = get_storage()
    with pytest.raises(StorageError):
        storage.open('/p/../../setup.py')

def test_upload_out_of_container():
    storage = get_storage()
    assert not os.path.exists('should-not-be-here.txt')
    with pytest.raises(StorageError):
        storage.add('/p/../../should-not-be-here.txt', "should not be here\n")
    assert not os.path.exists('should-not-be-here.txt')
