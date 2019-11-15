import pytest

from rex.core import Rex
from rex.storage import get_storage, StorageError

import util


def setup_function():
    util.reset_storage()


@pytest.fixture(scope="module")
def rex():
    return Rex(
        'rex.storage',
        storage_credentials={
            'local': {
                'key': util.storage_path,
            }
        },
        storage_mount={
            '/test1': 'local://foo',
            '/test2/': 'local://bar/subbar',
        }
    )


@pytest.fixture(autouse=True)
def with_rex(rex):
    with rex:
        yield


def test_mounts():
    storage = get_storage()
    assert len(storage.mounts) == 2
    assert '/test1/' in storage.mounts
    assert '/test2/' in storage.mounts


def test_mount_props():
    mount = get_storage().mounts['/test1/']
    assert mount.path_prefix == '/test1/'
    assert mount.url_prefix == 'local://foo/'
    assert mount.base_path == ''

    mount = get_storage().mounts['/test2/']
    assert mount.path_prefix == '/test2/'
    assert mount.url_prefix == 'local://bar/subbar/'
    assert mount.base_path == 'subbar/'


def test_mount_path():
    mount = get_storage().mounts['/test1/']
    path = mount.path('stuff.csv')
    assert path is not None
    assert path.name == 'stuff.csv'
    assert path.mount == mount

    path = mount.path('some', 'subdir', 'stuff.csv')
    assert path is not None
    assert path.name == 'some/subdir/stuff.csv'
    assert path.mount == mount


def test_path_props():
    mount = get_storage().mounts['/test2/']
    path = mount.path('some', 'subdir', 'stuff.csv')

    assert path.url_prefix == 'local://bar/subbar/'
    assert path.url_full == 'local://bar/subbar/some/subdir/stuff.csv'
    assert path.path_prefix == '/test2/'
    assert path.path_full == '/test2/some/subdir/stuff.csv'
    assert path.file_name == 'stuff.csv'
    assert path.dir_name == 'some/subdir'
    assert path.container_location == 'subbar/some/subdir/stuff.csv'


def test_path_join():
    mount = get_storage().mounts['/test1/']
    path = mount.path('foo')

    path2 = path.join('stuff.csv')
    assert path2.name == 'foo/stuff.csv'

    path2 = path.join('bar', 'stuff.csv')
    assert path2.name == 'foo/bar/stuff.csv'

    path2 = path.join('bar/baz', 'stuff.csv')
    assert path2.name == 'foo/bar/baz/stuff.csv'


def test_path_addoper():
    mount = get_storage().mounts['/test1/']
    path = mount.path('foo')

    path = path + 'bar'
    assert path.name == 'foo/bar'

    path = path + 'baz/stuff.csv'
    assert path.name == 'foo/bar/baz/stuff.csv'


def test_path_pop():
    mount = get_storage().mounts['/test1/']
    path = mount.path('foo/bar/baz.dat')

    path = path.pop()
    assert path.name == 'foo/bar/'

    path = path.pop()
    assert path.name == 'foo/'

    path = path.pop()
    assert path.name == ''

    path = path.pop()
    assert path.name == ''


def test_parse_path():
    path = get_storage().parse_path('/test1/stuff.csv')
    assert path.name == 'stuff.csv'

    path = get_storage().parse_path('/test1/')
    assert path.name == ''

    path = get_storage().parse_path('/test1')
    assert path.name == ''

    path = get_storage().parse_path('local://foo/stuff.csv')
    assert path.name == 'stuff.csv'

    path = get_storage().parse_path('local://foo/')
    assert path.name == ''

    path = get_storage().parse_path('local://foo')
    assert path.name == ''

    path1 = get_storage().parse_path('/test1/stuff.csv')
    path2 = get_storage().parse_path(path1)
    assert path2 == path1

    with pytest.raises(StorageError) as exc:
        path = get_storage().parse_path('/doesntexist')
    assert 'is not configured' in str(exc.value)

