
import pytest
import util
from rex.core import Rex, get_settings, Error


def setup_module():
    util.make_storage()

def teardown_module():
    util.remove_storage()


def test_empty():
    with Rex('rex.storage'):
        settings = get_settings()
        assert settings.storage_credentials == {}
        assert settings.storage_mount == {}


def test_credentials(snapshot):
    with pytest.raises(Error) as excinfo:
        Rex('rex.storage', storage_credentials={
            'azure': {'key': '1', 'secret': '2'}
        })
    snapshot.assert_match(str(excinfo.value))


def test_mount_errors(snapshot):
    with pytest.raises(Error) as excinfo:
        Rex('rex.storage',
            storage_credentials={'local': {'key': util.storage_path}},
            storage_mount={
                '/': 'local://x/1', # no root mount
                '../some/path': 'local://x/2', # should start with /
                '/bad-url': 'azure://some/path',
                '/bad-url-2': 'some-junk-here',
                '/good/': 'local://x/1',
                '/good': 'local://x/2',
            }
        )
    snapshot.assert_match(str(excinfo.value))

def test_mount_ok(snapshot):
    app = Rex('rex.storage',
        storage_credentials={'local': {'key': util.storage_path}},
        storage_mount={
            '/path1': 'local://bucket1/',
            '/path2/': 'local://bucket1/subpath'
        }
    )
    app.on()
    snapshot.assert_match(get_settings().storage_mount)

