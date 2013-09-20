#
# Copyright (c) 2013, Prometheus Research, LLC
#


from pbbt import Test, Field, MatchCase
from pbbt.check import maybe, oneof, listof, tupleof
import tempfile
import shutil
import atexit
import subprocess
import os.path
import time
import urllib
import httplib
import base64
import socket
import shlex
import signal


@Test
class GetCase(MatchCase):
    # Makes HTTP GET request.

    class Input:
        get = Field(str)
        expect = Field(int, default=200)

    class Output:
        get = Field(str)
        status = Field(str)
        headers = Field(listof(tupleof(str, str)))
        body = Field(str)

        @classmethod
        def __load__(cls, mapping):
            # Convert a header from a 2-element list to a tuple.
            if 'headers' in mapping and \
                    isinstance(mapping['headers'],
                               listof(listof(str, length=2))):
                mapping['headers'] = [tuple(header)
                                      for header in mapping['headers']]
            return super(GetCase.Output, cls).__load__(mapping)

        def __dump__(self):
            # And back.
            return [
                    ('get', self.get),
                    ('status', self.status),
                    ('headers', [list(header) for header in self.headers]),
                    ('body', self.body)]

    def run(self):
        # Parse the URL.
        scheme, url = urllib.splittype(self.input.get)
        if scheme is None:
            scheme = 'http'
        if scheme not in ['http', 'https']:
            self.ui.warning("invalid scheme: %s" % scheme)
            return
        host, url = urllib.splithost(url)
        if host is None:
            host = '127.0.0.1:8080'
            auth = None
        else:
            auth, host = urllib.splituser(host)
        connection_type = {
                'http': httplib.HTTPConnection,
                'https': httplib.HTTPSConnection,
        }[scheme]
        headers = {}
        if auth is not None:
            auth = base64.b64encode(urllib.unquote(auth)).strip()
            headers['Authorization'] = 'Basic %s' % auth

        # Connect to the HTTP server and make the request.  Since the server
        # could be just starting, we try for 10 seconds before giving up.
        tries = 0
        while tries < 100:
            try:
                connection = connection_type(host)
                connection.request('GET', url, headers=headers)
                break
            except socket.error:
                tries += 1
                time.sleep(0.1)
        else:
            self.ui.warning("failed to connect to the server")
            return

        # Get the response and generate output.
        response = connection.getresponse()
        status = "HTTP/%s %s %s" \
                % (response.version/10.0, response.status, response.reason)
        headers = [(header.title(), value)
                   for header, value in response.getheaders()]
        body = response.read()
        new_output = self.Output(get=self.input.get,
                                 status=status,
                                 headers=headers,
                                 body=body)

        # Check if we get the expected HTTP status code.
        if response.status != self.input.expect:
            text = self.render(self.output)
            new_text = self.render(new_output)
            self.compare(text, new_text)
            self.ui.warning("unexpected status code: %s" % response.status)
            return

        return new_output

    def render(self, output):
        # Renders HTTP response.
        if output is None:
            return None
        lines = []
        lines.append(output.status)
        for header, value in output.headers:
            lines.append("%s: %s" % (header, value))
        lines.append("")
        lines.extend(output.body.splitlines())
        return "\n".join(lines)+"\n"


@Test
class RexCase(MatchCase):
    # Runs `rex` script.

    class Input:
        rex = Field(oneof(str, listof(str)))
        stdin = Field(str, default='')
        exit = Field(maybe(int), default=0)

        def __str__(self):
            if isinstance(self.rex, str):
                return "REX: %s" % self.rex
            else:
                return "REX: %s" % " ".join(self.rex)

    class Output:
        rex = Field(oneof(str, listof(str)))
        stdout = Field(maybe(str))

    # Active subprocesses.
    processes = {}
    is_atexit_registered = False

    @classmethod
    def atexit(cls):
        # Kill remaining active processes.
        for parameters in sorted(cls.processes):
            process, path = cls.processes[parameters]
            if process.poll() is None:
                process.terminate()
                time.sleep(0.1)

    @classmethod
    def atexit_register(cls):
        # Register `atexit` handler.
        if not cls.is_atexit_registered:
            atexit.register(cls.atexit)
            cls.is_atexit_registered = True

    def run(self):
        # Prepare the command.
        command = os.path.abspath('./test/rex-helper')
        if isinstance(self.input.rex, str):
            try:
                parameters = shlex.split(self.input.rex)
            except ValueError:
                # Let `Popen` complain about it.
                parameters = [self.input.rex]
        else:
            parameters = self.input.rex
        process_key = tuple(parameters)

        # Start a long-running process.
        if self.input.exit is None:
            self.atexit_register()
            if process_key in self.processes:
                self.ui.warning("the `rex` process is already running")
                return
            path = tempfile.mkdtemp()
            stream = open("%s/input" % path, 'wb')
            stream.write(self.input.stdin)
            stream.close()
            stdin = open("%s/input" % path, 'rb')
            stdout = open("%s/output" % path, 'wb')
            try:
                process = subprocess.Popen([command]+parameters,
                                           stdin=stdin,
                                           stdout=stdout,
                                           stderr=subprocess.STDOUT)
            except OSError, exc:
                shutil.rmtree(path)
                self.ui.literal(str(exc))
                self.ui.warning("failed to execute the `rex` process")
            self.processes[process_key] = (process, path)
            return self.Output(rex=self.input.rex, stdout=None)

        # Stop a long-running process.
        elif process_key in self.processes:
            process, path = self.processes.pop(process_key)
            if process.poll() is None:
                process.send_signal(signal.SIGINT)
                process.wait()
            stdout = open("%s/output" % path).read()
            shutil.rmtree(path)
            return self.Output(rex=self.input.rex, stdout=stdout)

        # Start a process and wait till it finishes.
        else:
            try:
                proc = subprocess.Popen([command]+parameters,
                                        stdin=subprocess.PIPE,
                                        stdout=subprocess.PIPE,
                                        stderr=subprocess.STDOUT)
                stdout, stderr = proc.communicate(self.input.stdin)
            except OSError, exc:
                self.ui.literal(str(exc))
                self.ui.warning("failed to execute the `rex` process")
                return
            stdout = stdout.decode('utf-8', 'replace')
            if not isinstance(stdout, str):
                stdout = stdout.encode('utf-8')
            if proc.returncode != self.input.exit:
                if stdout:
                    self.ui.literal(stdout)
                self.ui.warning("unexpected exit code (%s)" % proc.returncode)
                return
            return self.Output(rex=self.input.rex, stdout=stdout)

    def render(self, output):
        if output is None:
            return None
        return output.stdout or ""


