
import io
import pytest
import util
import cloudstorage
from rex.core import Rex
from rex.storage import get_storage


def setup_function():
    util.remove_storage()
    util.make_storage()
    util.makedirs('p', 'p2/subdir')
    app = Rex('rex.storage',
              storage_credentials={'local': {'key': util.storage_path}},
              storage_mount={
                  '/p': 'local://p',
                  '/other/path': 'local://p2',
                  '/subdir': 'local://p2/subdir/'
              }
    )
    app.on()

def test_add_string():
    data = 'Hello, world!'
    storage = get_storage()
    file = storage.add('/p/some/file.txt', data)
    assert file.url == 'local://p/some/file.txt'
    assert isinstance(file.blob, cloudstorage.Blob)
    assert util.read_file('p/some/file.txt') == data

def test_add_bytes():
    data = 'Bytes Stream'
    storage = get_storage()
    file = storage.add('/p/some/file.txt', data.encode('utf-8'))
    assert file.url == 'local://p/some/file.txt'
    assert isinstance(file.blob, cloudstorage.Blob)
    assert util.read_file('p/some/file.txt') == data

def test_add_text_stream():
    data = 'Text Stream'
    storage = get_storage()
    file = storage.add('/p/some/file.txt', io.StringIO(data))
    assert file.url == 'local://p/some/file.txt'
    assert isinstance(file.blob, cloudstorage.Blob)
    assert util.read_file('p/some/file.txt') == data

def test_add_text_stream():
    data = 'Bytes Stream'
    storage = get_storage()
    file = storage.add('/p/some/file.txt', io.BytesIO(data.encode('utf-8')))
    assert file.url == 'local://p/some/file.txt'
    assert isinstance(file.blob, cloudstorage.Blob)
    assert util.read_file('p/some/file.txt') == data

def test_add_by_url():
    data = 'some data'
    storage = get_storage()
    assert not storage.exists('/subdir/f.txt')
    assert not storage.exists('local://p2/subdir/f.txt')
    storage.add('local://p2/subdir/f.txt', data)
    assert storage.exists('/subdir/f.txt')
    assert storage.exists('local://p2/subdir/f.txt')
    assert util.read_file('p2/subdir/f.txt') == data

def test_open():
    data = b'by path'
    storage = get_storage()
    assert not storage.exists('/subdir/path.txt')
    storage.add('/subdir/path.txt', data)
    assert storage.exists('/subdir/path.txt')
    assert storage.exists('local://p2/subdir/path.txt')
    assert storage.open('/subdir/path.txt').read() == data
    assert storage.open('local://p2/subdir/path.txt').read() == data
    assert storage.open('/subdir/path.txt').url == 'local://p2/subdir/path.txt'

def test_ls():
    storage = get_storage()
    storage.add('/subdir/1.txt', '1')
    storage.add('/subdir/2.txt', '2')
    storage.add('/subdir/dir/x.txt', 'x')
    storage.add('/subdir/dir/y.txt', 'y')
    files = list(storage.ls('/subdir'))
    assert len(files) == 3
    assert ('dir/', None) in files
    files_dict = dict(files)
    assert '1.txt' in files_dict
    assert files_dict['1.txt'].read() == b'1'
    files = list(storage.ls('local://p2/subdir'))
    assert len(files) == 3
    assert ('dir/', None) in files
