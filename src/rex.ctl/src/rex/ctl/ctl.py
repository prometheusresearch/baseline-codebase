#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error
from .core import run, Failure, fail, env
import sys
import os
import shutil
import tempfile
import signal
import shlex
import subprocess
import traceback
import atexit


class Ctl:
    """
    Wraps a ``rex`` invocation.

    `cmd`
        Command-line parameters.
    `input`
        Input data.
    """

    def __init__(self, cmd, input=''):
        if isinstance(cmd, str):
            cmd = shlex.split(cmd)
        self.cmd = cmd
        self.input = input
        self.pid = None
        self.tmpdir = None
        self.tmpin = None
        self.tmpout = None
        self.start()

    def start(self):
        assert self.pid is None
        self.tmpdir = tempfile.mkdtemp()
        self.tmpin = '%s/input' % self.tmpdir
        self.tmpout = '%s/output' % self.tmpdir
        with open(self.tmpin, 'w') as stream:
            stream.write(self.input)
        try:
            self.pid = os.fork()
        except OSError:
            shutil.rmtree(self.tmpdir)
            self.tmpdir = self.tmpin = self.tmpout = None
            raise
        if self.pid == 0:
            try:
                stdin = open(self.tmpin, 'r')
                stdout = open(self.tmpout, 'a')
                #stderr = open(self.tmpout, 'a', 0)
                sys.stdin = os.fdopen(0, 'r')
                sys.stdout = os.fdopen(1, 'w')
                sys.stderr = os.fdopen(2, 'w')
                os.dup2(stdin.fileno(), sys.stdin.fileno())
                os.dup2(stdout.fileno(), sys.stdout.fileno())
                os.dup2(stdout.fileno(), sys.stderr.fileno())
                sys.argv = ['rex']+self.cmd
                with env():
                    try:
                        try:
                            run(sys.argv)
                        except (Error, IOError) as exc:
                            raise fail(str(exc))
                    except Failure as exc:
                        print(exc, file=sys.stderr)
                        raise
                    except Exception:
                        traceback.print_exc()
                        raise
                    finally:
                        sys.stdout.flush()
                        sys.stderr.flush()
                        atexit._run_exitfuncs()
            except:
                os._exit(1)
            else:
                os._exit(0)

    def wait(self, expect=0):
        """
        Waits for the process exit; returns the output of the process.

        `expect`
            The expected exit code.
        """
        assert self.pid is not None
        pid, exitcode = os.waitpid(self.pid, 0)
        exitcode >>= 8
        with open(self.tmpout, 'r') as stream:
            output = stream.read()
        shutil.rmtree(self.tmpdir)
        if expect is not None and exitcode != expect:
            error = Error(
                    "Received unexpected exit code:",
                    "expected %s; got %s" % (expect, exitcode))
            error.wrap("With output:", output)
            error.wrap("From:", subprocess.list2cmdline(['rex']+self.cmd))
            raise error
        return output

    def stop(self):
        """
        Terminates the process; returns the output.
        """
        assert self.pid is not None
        os.kill(self.pid, signal.SIGINT)
        return self.wait(expect=None)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__,
                           subprocess.list2cmdline(self.cmd))


def ctl(cmd, input='', expect=0):
    """
    Executes a process, prints the output.

    `input`
        Process input.
    `expect`
        The expected exit code.
    """
    ctl = Ctl(cmd, input)
    sys.stdout.write(ctl.wait(expect=expect))


