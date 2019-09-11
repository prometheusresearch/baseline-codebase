import pytest
import util
import os
from rex.core import Rex
from rex.storage import get_storage, StorageError


def setup_function():
    util.remove_storage()
    util.make_storage()
    util.makedirs("container")


def test_open_out_of_container():
    app = Rex(
        "rex.storage_test",
        storage_credentials={"local": {"key": util.storage_path}},
    )
    with app:
        storage = get_storage()
        with pytest.raises(StorageError):
            storage.open("/p/../../setup.py")


def test_storage_credentials_config():
    util.remove_storage()
    util.make_storage()
    util.ensure_test_input_dir()
    app = Rex(
        "rex.storage_test",
        storage_credentials={"local": {"key": util.storage_path}},
        storage_mount={"/other-p": "local://test-input"},
    )
    with app:
        storage = get_storage()
        data = storage.open("/other-p/1.txt").read()
        assert data == b"1.txt"


def test_inline_config():
    util.remove_storage()
    util.make_storage()
    util.ensure_test_input_dir()
    app = Rex(
        "rex.storage_test",
        storage_mount={
            "/other-p": {"url": "local://test-input", "key": util.storage_path}
        },
    )
    with app:
        storage = get_storage()
        data = storage.open("/other-p/1.txt").read()
        assert data == b"1.txt"


def test_upload_out_of_container():
    app = Rex(
        "rex.storage_test",
        storage_credentials={"local": {"key": util.storage_path}},
    )
    with app:
        storage = get_storage()
        assert not os.path.exists("should-not-be-here.txt")
        with pytest.raises(StorageError):
            storage.add(
                "/p/../../should-not-be-here.txt", "should not be here\n"
            )
        assert not os.path.exists("should-not-be-here.txt")
