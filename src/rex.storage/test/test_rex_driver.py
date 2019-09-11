import pytest
import util

from rex.core import Rex
from rex.storage import get_storage, StorageError, File


@pytest.fixture(scope="module")
def rex():
    return Rex(
        "rex.storage_test",
        storage_credentials={"local": {"key": util.storage_path}},
    )


@pytest.fixture(autouse=True)
def with_rex(rex):
    # Wrap each test case with `with rex: ...`
    with rex:
        yield


def test_add():
    with pytest.raises(NotImplementedError):
        get_storage().add("/rst/newfile", "foobar")


def test_get_blob():
    blob = get_storage().get_blob("/rst/stuff/foo")
    assert blob is not None
    assert blob.name == "stuff/foo"


def test_download():
    buf = get_storage().download("/rst/stuff/foo")
    assert buf.read() == b"hello\n"


def test_open():
    file = get_storage().open("/rst/stuff/foo")
    assert isinstance(file, File)


def test_exists():
    assert get_storage().exists("/rst/stuff/foo") is True
    assert get_storage().exists("/rst/doesntexist") is False


def test_is_file():
    assert get_storage().is_file("/rst/stuff/foo") is True
    assert get_storage().is_file("/rst/stuff") is False


def test_is_dir():
    assert get_storage().is_dir("/rst/stuff/foo") is False
    assert get_storage().is_dir("/rst/stuff") is True


def test_get_target():
    target = get_storage().get_target("/rst/stuff/foo")
    assert target == ("rex://rex.storage_test/", "stuff/foo")


def test_list_objects():
    objects = dict(get_storage().list_objects("/rst/stuff"))
    assert "foo" in objects
    assert "bar" in objects
    assert "subdir/baz" in objects
    assert len(objects) == 3

    objects = dict(get_storage().list_objects("/rst"))
    assert "settings.yaml" in objects
    assert "stuff/foo" in objects
    assert "stuff/bar" in objects
    assert "stuff/subdir/baz" in objects
    assert len(objects) == 4


def test_ls():
    objects = dict(get_storage().ls("/rst/stuff"))
    assert objects["foo"] is not None
    assert objects["bar"] is not None
    assert objects["subdir/"] is None
    assert len(objects) == 3

    objects = dict(get_storage().ls("/rst"))
    assert objects["settings.yaml"] is not None
    assert objects["stuff/"] is None
    assert len(objects) == 2


def test_driver_iter():
    driver = get_storage().get_container("rex://rex.storage_test/").driver
    containers = list(driver)
    assert len(containers) == 1
    assert containers[0].name == "rex.storage_test"
    assert len(driver) == 1


def test_driver_regions():
    driver = get_storage().get_container("rex://rex.storage_test/").driver
    assert driver.regions == []


def test_container_cdn():
    container = get_storage().get_container("rex://rex.storage_test/")
    assert container.enable_cdn() == False
    assert container.disable_cdn() == False


def test_container_cdn_url():
    container = get_storage().get_container("rex://rex.storage_test/")
    assert container.cdn_url.endswith("share/rex/rex.storage_test")


def test_container_contains():
    container = get_storage().get_container("rex://rex.storage_test/")
    assert "stuff/foo" in container
    assert "doesntexist" not in container


def test_blob_cdn_url():
    container = get_storage().get_container("rex://rex.storage_test/")
    blob = container.get_blob("stuff/foo")
    assert blob.cdn_url.endswith("share/rex/rex.storage_test/stuff/foo")
