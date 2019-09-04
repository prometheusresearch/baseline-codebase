#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .core import env, debug, fail
import sys
import os
import shutil
import shlex
import subprocess


def cp(src_path, dst_path):
    """Copy a file or a directory."""
    debug("cp {} {}", src_path, dst_path)
    if os.path.isfile(src_path):
        shutil.copy2(src_path, dst_path)
    elif os.path.islink(src_path):
        link = os.readlink(src_path)
        os.symlink(link, dst_path)
    else:
        if os.path.exists(dst_path):
            dst_path = os.path.join(dst_path, os.path.basename(src_path))
        os.mkdir(dst_path)
        for filename in os.listdir(src_path):
            with env(debug=False):
                cp(os.path.join(src_path, filename),
                   os.path.join(dst_path, filename))


def mv(src_path, dst_path):
    """Rename a file."""
    debug("mv {} {}", src_path, dst_path)
    os.rename(src_path, dst_path)


def rm(path):
    """Remove a file."""
    debug("rm {}", path)
    os.unlink(path)


def rmtree(path):
    """Remove a directory tree."""
    debug("rmtree {}", path)
    shutil.rmtree(path)


def mktree(path):
    """Create a directory tree."""
    if not os.path.isdir(path):
        debug("mktree {}", path)
        os.makedirs(path)


def exe(cmd, cd=None, environ=None):
    """Execute the command replacing the current process."""
    debug("{}", cmd)
    if isinstance(cmd, str):
        cmd = shlex.split(cmd)
    if environ:
        overrides = environ
        environ = os.environ.copy()
        environ.update(overrides)
    if cd:
        os.chdir(cd)
    if hasattr(sys, 'exitfunc'):
        sys.exitfunc()
    try:
        if environ:
            os.execvpe(cmd[0], cmd, environ)
        else:
            os.execvp(cmd[0], cmd)
    except OSError as exc:
        raise fail(str(exc))


def sh(cmd, data=None, cd=None, environ=None):
    """Execute a command using shell."""
    if cd is None:
        debug("{}", cmd)
    else:
        debug("cd {}; {}", cd, cmd)
    stream = subprocess.PIPE
    if env.debug:
        stream = None
    if environ:
        overrides = environ
        environ = os.environ.copy()
        environ.update(overrides)
    proc = subprocess.Popen(cmd, shell=True, stdin=stream,
                            stdout=stream, stderr=stream,
                            cwd=cd, env=environ)
    proc.communicate(data)
    if proc.returncode != 0:
        raise fail("`{}`: non-zero exit code", cmd)


def pipe(cmd, data=None, cd=None, environ=None):
    """Execute the command, return the output."""
    if cd is None:
        debug("| {}", cmd)
    else:
        debug("$ cd {}; | {}", cd, cmd)
    stream = subprocess.PIPE
    if environ:
        overrides = environ
        environ = os.environ.copy()
        environ.update(overrides)
    proc = subprocess.Popen(cmd, shell=True,
                            stdout=stream, stderr=stream,
                            cwd=cd, env=environ)
    out, err = proc.communicate(data)
    if proc.returncode != 0:
        if env.debug:
            if out:
                sys.stdout.write(out)
            if err:
                sys.stderr.write(err)
        raise fail("`{}`: non-zero exit code", cmd)
    return out

