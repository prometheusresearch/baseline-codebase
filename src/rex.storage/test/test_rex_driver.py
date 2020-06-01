import datetime

import pytest
import util

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
    )


@pytest.fixture(autouse=True)
def with_rex(rex):
    with rex:
        yield


def test_object_list():
    objects = sorted([
        obj.name
        for obj in get_storage().object_list('/rst/stuff')
    ])
    assert objects == [
        'stuff/bar',
        'stuff/foo',
        'stuff/subdir/baz',
    ]

    objects = sorted([
        obj.name
        for obj in get_storage().object_list('/rst')
    ])
    assert objects == [
        'settings.yaml',
        'stuff/bar',
        'stuff/foo',
        'stuff/subdir/baz',
    ]


def test_mount_iter():
    objects = sorted([
        obj.name
        for obj in get_storage().mounts['/rst/']
    ])
    assert objects == [
        'settings.yaml',
        'stuff/bar',
        'stuff/foo',
        'stuff/subdir/baz',
    ]


def test_object_tree():
    tree = util.flatten_object_tree(
        get_storage().object_tree('/rst/stuff')
    )
    assert tree == {
        'bar': 'stuff/bar',
        'foo': 'stuff/foo',
        'subdir/': {
            'baz': 'stuff/subdir/baz',
        },
    }

    tree = util.flatten_object_tree(
        get_storage().object_tree('/rst')
    )
    assert tree == {
        'settings.yaml': 'settings.yaml',
        'stuff/': {
            'bar': 'stuff/bar',
            'foo': 'stuff/foo',
            'subdir/': {
                'baz': 'stuff/subdir/baz',
            },
        },
    }


def test_exists():
    assert get_storage().exists('/rst/stuff/bar') is True
    assert get_storage().exists('/rst/doesntexist') is False


def test_put():
    with pytest.raises(NotImplementedError):
        get_storage().put("/rst/newfile", "foobar")


def test_get():
    file = get_storage().get('/rst/stuff/foo')
    assert file.path.name == 'stuff/foo'
    content = file.read()
    assert content == b"hello\n"

    file = get_storage().get('/rst/stuff/foo', encoding='utf8')
    assert file.path.name == 'stuff/foo'
    content = file.read()
    assert isinstance(content, str)
    assert content == "hello\n"


def test_driver_iter():
    driver = get_storage().mounts['/rst/'].container.driver
    containers = list(driver)
    assert len(containers) == 1
    assert containers[0].name == "rex.storage_test"
    assert len(driver) == 1


def test_driver_regions():
    driver = get_storage().mounts['/rst/'].container.driver
    assert driver.regions == []


def test_container_cdn():
    container = get_storage().mounts['/rst/'].container
    assert container.enable_cdn() == False
    assert container.disable_cdn() == False


def test_container_cdn_url():
    container = get_storage().mounts['/rst/'].container
    assert container.cdn_url.endswith("share/rex/rex.storage_test")


def test_container_contains():
    container = get_storage().mounts['/rst/'].container
    assert "stuff/foo" in container
    assert "doesntexist" not in container


def test_blob_cdn_url():
    container = get_storage().mounts['/rst/'].container
    blob = container.get_blob("stuff/foo")
    assert blob.cdn_url.endswith("share/rex/rex.storage_test/stuff/foo")


def test_path_attrs():
    path = get_storage().parse_path('/rst/stuff/foo')
    assert path.size == 6
    assert isinstance(path.created_at, datetime.datetime)
    assert isinstance(path.modified_at, datetime.datetime)

