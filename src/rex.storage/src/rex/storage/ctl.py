
import os
from pathlib import Path
from rex.ctl import RexTask, argument, log, fail
from rex.core import StrVal
from .storage import get_storage


class Upload(RexTask):
    """
    Uploads local files to the external storage.
    """

    name = "storage-upload"

    class arguments:
        src = argument(check=StrVal(), plural=True)
        dst = argument(check=StrVal())

    def __call__(self):
        with self.make(ensure=False, initialize=False):
            paths = self.validate_src()
            storage = get_storage()
            if len(paths) == 1 and not self.dst.endswith('/'):
                self.upload_file(list(paths)[0][0], self.dst)
            else:
                for path, target in sorted(paths):
                    self.upload_file(path, storage.join(self.dst, target))

    def validate_src(self):
        paths = set()
        for filename in self.src:
            path = (Path.cwd() / filename).resolve(strict=True)
            if path.is_file():
                paths.add((path, path.name))
            elif path.is_dir():
                target = Path(path.name)
                for (dir, _, files) in os.walk(str(path), topdown=True):
                    for f in files:
                        p = Path(dir) / f
                        relative = p.relative_to(path)
                        paths.add((p, str(target / relative)))
            else:
                raise fail(f'Filename `{filename}` is not a file or directory')
        return paths

    def upload_file(self, path, dst):
        log(f'Uploading `{path}` to `{dst}`')
        storage = get_storage()
        with open(str(path), 'rb') as f:
            storage.put(dst, f)

