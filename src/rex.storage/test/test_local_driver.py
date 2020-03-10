import datetime
import io
import pytest
import util
import os
import tempfile
from rex.core import Rex
from rex.storage import get_storage, StorageError


def setup_function():
    util.reset_storage()


@pytest.fixture(scope="module")
def rex():
    return Rex(
        "rex.storage_test",
        storage_credentials={
            "local": {
                "key": util.storage_path,
            }
        },
        storage_mount={
            "/other-p": {
                "url": "local://test-input",
                "key": util.storage_path,
            }
        },
    )


@pytest.fixture(autouse=True)
def with_rex(rex):
    with rex:
        yield


def test_open_out_of_container():
    storage = get_storage()
    with pytest.raises(StorageError) as exc:
        storage.get("/p/../../setup.py")
    assert 'outside the container' in str(exc.value)


def test_inline_config():
    storage = get_storage()
    data = storage.get("/other-p/1.txt").read()
    assert data == b"1.txt"


def test_upload_out_of_container():
    storage = get_storage()
    assert not os.path.exists("should-not-be-here.txt")
    with pytest.raises(StorageError) as exc:
        storage.put(
            "/p/../../should-not-be-here.txt",
            "should not be here\n",
        )
    assert 'outside the container' in str(exc.value)


def test_object_list():
    objects = sorted([
        obj.name
        for obj in get_storage().object_list('/other-p')
    ])
    assert objects == [
        '1.txt',
        'dir1/subdir/2.txt',
        'dir1/subdir/3.txt',
        'dir2/4.txt',
        'dir2/5.txt',
    ]

    objects = sorted([
        obj.name
        for obj in get_storage().object_list('/other-p/dir2')
    ])
    assert objects == [
        '4.txt',
        '5.txt',
    ]


def test_mount_iter():
    objects = sorted([
        obj.name
        for obj in get_storage().mounts['/other-p/']
    ])
    assert objects == [
        '1.txt',
        'dir1/subdir/2.txt',
        'dir1/subdir/3.txt',
        'dir2/4.txt',
        'dir2/5.txt',
    ]


def test_object_tree():
    tree = util.flatten_object_tree(
        get_storage().object_tree('/other-p')
    )
    assert tree == \
        {'1.txt': '1.txt',
         'dir1/': {'subdir/': {'2.txt': 'dir1/subdir/2.txt',
                               '3.txt': 'dir1/subdir/3.txt'}},
         'dir2/': {'4.txt': 'dir2/4.txt', '5.txt': 'dir2/5.txt'}}


    tree = util.flatten_object_tree(
        get_storage().object_tree('/other-p/dir2')
    )
    assert tree == \
        {'4.txt': '4.txt', '5.txt': '5.txt'}


def test_exists():
    assert get_storage().exists('/other-p/1.txt') is True
    assert get_storage().exists('/other-p/doesntexist') is False


def test_put():
    file = get_storage().put("/other-p/string.txt", "foobar")
    assert file.path.name == "string.txt"
    assert file.read() == b"foobar"

    file = get_storage().put("/other-p/bytes.txt", b"foobar")
    assert file.path.name == "bytes.txt"
    assert file.read() == b"foobar"

    sio = io.StringIO()
    sio.write("foobar")
    file = get_storage().put("/other-p/sio.txt", sio)
    assert file.path.name == "sio.txt"
    assert file.read() == b"foobar"

    temp = tempfile.TemporaryFile(mode='w+t', encoding='utf-8')
    temp.write("foobar")
    temp.seek(0)
    file = get_storage().put("/other-p/textio.txt", temp)
    assert file.path.name == "textio.txt"
    assert file.read() == b"foobar"


def test_get():
    file = get_storage().get('/other-p/1.txt')
    assert file.path.name == '1.txt'
    content = file.read()
    assert content == b"1.txt"

    file = get_storage().get('/other-p/1.txt', encoding='utf8')
    assert file.path.name == '1.txt'
    content = file.read()
    assert isinstance(content, str)
    assert content == "1.txt"


def test_download():
    temp = tempfile.TemporaryFile()
    file = get_storage().download('/other-p/1.txt', temp)
    temp.seek(0)
    content = temp.read()
    assert content == b"1.txt"

    temp = tempfile.NamedTemporaryFile()
    temp.close()
    file = get_storage().download('/other-p/1.txt', temp.name)
    content = open(temp.name, 'rb').read()
    assert content == b"1.txt"
    os.remove(temp.name)


def test_driver_iter():
    driver = get_storage().mounts['/p/'].container.driver
    containers = sorted([
        container.name
        for container in driver
    ])
    assert containers == [
        'bar',
        'container',
        'foo',
        'test-input',
    ]


def test_driver_regions():
    driver = get_storage().mounts['/p/'].container.driver
    assert driver.regions == []


def test_container_cdn():
    container = get_storage().mounts['/p/'].container
    assert container.enable_cdn() == False
    assert container.disable_cdn() == False


def test_container_cdn_url():
    container = get_storage().mounts['/p/'].container
    assert container.cdn_url.endswith("test-storage/container")


def test_container_contains():
    container = get_storage().mounts['/other-p/'].container
    assert "1.txt" in container
    assert "doesntexist" not in container


def test_blob_cdn_url():
    container = get_storage().mounts['/other-p/'].container
    blob = container.get_blob("1.txt")
    assert blob.cdn_url.endswith("test-storage/test-input/1.txt")


def test_delete():
    target_file = '/other-p/delete-me.txt'
    file = get_storage().put(target_file, "foobar")
    assert get_storage().exists(target_file) is True
    get_storage().delete(target_file)
    assert get_storage().exists(target_file) is False

def test_delete_nonexistant():
    target_file = '/other-p/doesntexist'
    assert get_storage().exists(target_file) is False
    get_storage().delete(target_file)
    assert get_storage().exists(target_file) is False


def test_path_attrs():
    path = get_storage().parse_path('/other-p/1.txt')
    assert path.size == 5
    assert isinstance(path.created_at, datetime.datetime)
    assert isinstance(path.modified_at, datetime.datetime)

