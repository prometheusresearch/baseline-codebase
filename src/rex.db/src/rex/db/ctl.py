#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error, get_settings, get_packages, StrVal
from rex.ctl import RexTask, Topic, argument, option, fail, env, exe
from .database import get_db
from .setting import HTSQLVal
import sys
import os
import mimetypes
import collections
import tempfile
import subprocess
import webbrowser
import htsql.ctl
import htsql.ctl.error
import htsql.ctl.shell
import htsql.core.error
import htsql.core.util
import htsql.core.validator
import htsql.core.model
import htsql.core.classify


def _extension(value):
    # Parses `-E` option.
    validate = htsql.core.validator.ExtensionVal()
    return dict([validate(value)])


class RexShellRoutine(htsql.ctl.shell.ShellRoutine):
    # Customized `htsql-ctl shell` routine.

    arguments = []
    options = []

    def __init__(self, script, app):
        super(RexShellRoutine, self).__init__(script, {})
        self.app = app

    def run(self):
        self.start(self.app)


class RexDBTask(RexTask):
    # A task with `--extend` and `--gateway` options.

    class options:
        extend = option(
                'E', _extension, default=[], plural=True,
                value_name="EXT:PARAM=VALUE",
                hint="include an HTSQL extension")
        gateway = option(
                'G', StrVal(r'[0-9A-Za-z_]+'), default=None,
                value_name="NAME",
                hint="connect to a gateway database")

    def make(self, extra_requirements=[], extra_parameters={}, *args, **kwds):
        # Converts and merges `--extend` to `htsql_extension` parameter.
        htsql_extensions = []
        htsql_extensions.append(env.parameters.get('htsql_extensions', {}))
        htsql_extensions.append(env.parameters.get('htsql-extensions', {}))
        htsql_extensions.extend(self.extend)
        htsql_extensions = HTSQLVal.merge(*htsql_extensions)
        if htsql_extensions:
            extra_parameters = extra_parameters.copy()
            extra_parameters['htsql_extensions'] = htsql_extensions
        return super(RexDBTask, self).make(
                extra_requirements, extra_parameters, *args, **kwds)

    def get_db(self):
        # Gets the HTSQL instance, possibly for a gateway database.
        try:
            db = get_db(self.gateway)
        except KeyError:
            raise fail("unknown gateway: `{}`", self.gateway)
        return db


class ShellTask(RexDBTask):
    """open HTSQL shell

    The `shell` task opens an HTSQL shell to the application database.

    Use option `--extend` (`-E`) to enable an HTSQL extension.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.
    """

    name = 'shell'

    def __call__(self):
        # Build the application and extract HTSQL configuration.
        with self.make():
            db = self.get_db()
        # Run `htsql-ctl shell`.
        script = htsql.ctl.HTSQL_CTL(sys.stdin, sys.stdout, sys.stderr)
        routine = RexShellRoutine(script, db)
        try:
            routine.run()
        except htsql.ctl.error.ScriptError as error:
            raise fail(str(error))


class QueryTask(RexDBTask):
    """run an HTSQL query

    The `query` task executes an HTSQL query against the application
    database.

    Use option `--extend` (`-E`) to enable an HTSQL extension.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.

    Use option `--input` (`-i`) to read the query from a file.  If
    `--input` is not provided, the query is read from the standard input.
    This option may be specified multiple times.

    Use option `--output` (`-o`) to write the query output to a file.

    Use option `--format` (`-f`) to specify the format of the output.
    Valid formats include: `txt`, `html`, `xml`, `csv`, `json`, `raw`.

    If neither `--output` nor `--format` are provided, the output is
    supressed.
    """

    name = 'query'

    class options:
        input = option(
                'i', default=[], plural=True,
                value_name="FILE",
                hint="read query from a file")
        output = option(
                'o', default=None,
                value_name="FILE",
                hint="write query output to a file")
        format = option(
                'f', default=None,
                value_name="FORMAT",
                hint="set output format")
        define = option(
                'D', default=[], plural=True,
                value_name="PARAM=VALUE",
                hint="set a query parameter")

    def __call__(self):
        # Prepare input.
        with self.make():
            db = self.get_db()
            packages = get_packages()
        if not self.input:
            sources = ['-']
        else:
            sources = self.input
        product = None
        parameters = {}
        for key in self.define:
            if '=' in key:
                key, value = key.split('=', 1)
            else:
                value = True
            parameters[key] = value
        with db, db.transaction():
            try:
                # Execute input.
                for source in sources:
                    if source == '-':
                        stream = sys.stdin
                    elif ':' in source and source.split(':')[0] in packages:
                        stream = packages.open(source)
                    else:
                        stream = open(source)
                    source_product = db.produce(stream, parameters)
                    if source_product is not None:
                        product = source_product
                # Render output.
                if product is not None and (self.format is not None or
                                            self.output is not None):
                    format = self.format or os.path.splitext(self.output)[1][1:]
                    format = db.accept(format)
                    stream = (open(self.output, 'w')
                              if self.output not in [None, '-']
                              else sys.stdout)
                    for chunk in db.emit(format, product):
                        stream.write(chunk)
            except htsql.core.error.Error as error:
                raise fail(str(error))


class GraphDBTask(RexDBTask):
    """draw schema diagram using GraphViz

    The `graphdb` task to draw a schema graph for the application database.

    Use option `--extend` (`-E`) to enable an HTSQL extension.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.

    Use option `--output` (`-o`) to write the diagram to a file.

    Use option `--format` (`-f`) to specify the format of the output.
    Valid formats include png, jpg, pdf, svg.  If the `-f` option
    is not specified, the task dumps the graph definition.
    """

    name = 'graphdb'

    class options:
        output = option(
                'o', default=None,
                value_name="FILE",
                hint="write query output to a file")
        format = option(
                'f', default=None,
                value_name="FORMAT",
                hint="set output format")

    def __call__(self):
        # Draw the diagram.
        with self.make(), self.get_db():
            graph = self.draw()
        # Try to guess format from the file extension.
        format = self.format
        if format is None and self.output is not None:
            ext = os.path.splitext(self.output)[1][1:]
            mimetype = mimetypes.guess_type(self.output)
            if mimetype == 'image/%s' % ext:
                format = ext
        if not format:
            # If no format is specified, save the DOT file.
            stream = (open(self.output, 'w')
                      if self.output not in [None, '-'] else sys.stdout)
            stream.write(graph)
        else:
            # Otherwise, render the file with GraphViz.
            filename = self.output
            if filename is None:
                fd, filename = tempfile.mkstemp(suffix='.'+format)
            cmd = ['dot', '-T%s' % format, '-o%s' % filename]
            proc = subprocess.Popen(
                    cmd, stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
            out, err = proc.communicate(graph)
            if proc.returncode != 0:
                sys.stderr.write(out)
                raise fail("non-zero exit code: `{}`",
                           subprocess.list2cmdline(cmd))
            # Display the image when the output file is not specified.
            if self.output is None:
                webbrowser.open(filename)

    def draw(self):
        # Generates the graph definition in DOT format.
        lines = []
        # Extract the database name.
        database_name = htsql.core.context.context.app.htsql.db.database
        # Extract tables.
        nodes = collections.OrderedDict()
        for label in htsql.core.classify.classify(htsql.core.model.HomeNode()):
            table_arc = label.arc
            table_node = table_arc.target
            if not (isinstance(table_arc, htsql.core.model.TableArc) and
                    table_node not in nodes):
                continue
            labels = htsql.core.classify.relabel(table_arc)
            name = labels[0].name.encode('utf-8')
            nodes[table_node] = name
        # Extract links between tables.
        edges = collections.OrderedDict()
        for origin_node in nodes:
            parental_arcs = htsql.core.classify.localize(origin_node) or []
            for label in htsql.core.classify.classify(origin_node):
                link_arc = label.arc
                if (isinstance(link_arc, htsql.core.model.ColumnArc) and
                    link_arc.link is not None):
                    link_arc = link_arc.link
                if not (isinstance(link_arc, htsql.core.model.ChainArc) and
                        link_arc.is_direct and
                        link_arc not in edges):
                    continue
                target_node = link_arc.target
                if target_node not in nodes:
                    continue
                labels = (htsql.core.classify.relabel(link_arc) or
                          htsql.core.classify.relabel(label.arc))
                if not labels:
                    continue
                name = labels[0].name.encode('utf-8')
                origin_name = nodes[origin_node]
                target_name = nodes[target_node]
                is_parental = (link_arc in parental_arcs)
                edges[link_arc] = (name, origin_name, target_name, is_parental)
        # Render the graph.
        nodes = sorted(nodes.values())
        edges = sorted(edges.values())
        lines.append('digraph "%s" {' % database_name)
        for node_name in nodes:
            lines.append('    "%s"' % node_name)
        for edge_name, origin_name, target_name, is_parental in edges:
            attributes = []
            if edge_name != target_name:
                attributes.append('label="%s"' % edge_name)
            if not is_parental:
                attributes.append('constraint=false')
            lines.append('    "%s" -> "%s"%s'
                         % (origin_name, target_name,
                            ' [%s]' % ','.join(attributes)
                            if attributes else ''))
        lines.append('}')
        return ''.join(line+'\n' for line in lines)


class SQLShellTask(RexTask):
    """open SQL shell

    The `sqlshell` task opens a native SQL shell to the application database.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.

    Use option `--master` (`-M`) to connect to the master database on this
    database server.
    """

    name = 'sqlshell'

    class options:
        gateway = option(
                'G', StrVal(r'[0-9A-Za-z_]+'), default=None,
                value_name="NAME",
                hint="connect to a gateway database")
        master = option('M', hint="connect to the master database")

    def __call__(self):
        # Build the application and extract HTSQL configuration.
        with self.make(initialize=False):
            settings = get_settings()
        db = settings.db
        if self.gateway is not None:
            db = settings.gateways.get(self.gateway)
        if isinstance(db, dict):
            db = db.get('htsql', {}).get('db')
        if db is None:
            if self.gateway is None:
                raise fail("application database is not configured")
            else:
                raise fail(
                        "gateway database is not configured: `{}`",
                        self.gateway)
        db = htsql.core.util.DB.parse(db)
        cmd = []
        if db.engine == 'sqlite':
            cmd.append('sqlite3')
            cmd.append(db.database)
        elif db.engine == 'pgsql':
            cmd.append('psql')
            if db.host:
                cmd.extend(('-h', db.host))
            if db.port:
                cmd.extend(('-p', str(db.port)))
            if db.username:
                cmd.extend(('-U', db.username))
            if self.master:
                cmd.append('postgres')
            else:
                cmd.append(db.database)
        elif db.engine == 'mysql':
            cmd.append('mysql')
            if db.host:
                cmd.extend(('-h', db.host))
            if db.port:
                cmd.extend(('-P', db.port))
            if db.username:
                cmd.extend(('-u', db.username))
            if db.password:
                cmd.append('-p'+db.password)
            if self.master:
                cmd.append('mysql')
            else:
                cmd.append(db.database)
        elif db.engine == 'oracle':
            cmd.extend(('sqlplus', '-L'))
            connect = ''
            if db.username:
                connect += db.username
            if db.password:
                connect += '/'+db.password
            connect += '@' + (db.host or 'localhost')
            if db.port:
                connect += ':'+str(db.port)
            connect += '/'+db.database
            cmd.append(connect)
        elif db.engine == 'mssql':
            cmd.append('tsql')
            cmd.extend(('-H', db.host or 'localhost'))
            if db.port:
                cmd.extend(('-p', str(db.port)))
            if db.username:
                cmd.extend(('-U', db.username))
            if db.password:
                cmd.extend(('-P', db.password))
            if self.master:
                cmd.extend(('-D', 'master'))
            else:
                cmd.extend(('-D', db.database))
        else:
            raise fail("unknown database engine: `{}`", db)
        exe(cmd)


class DatabaseAccessTopic(Topic):
    """how to configure and access an application database

    Many RexDB application use a SQL database server to store
    application data.  To run a database-aware application, you
    needs to specify the configuration parameter `db` containing
    the database connection URI.

    The `db` parameter has the form:

        <engine>://<username>:<password>@<host>:<port>/<database>

    - `<engine>` is the type of the database server, supported
      values are: `sqlite`, `pgsql`, `mysql`, `mssql`, `oracle`;
    - `<username>:<password>` are authentication parameters;
    - `<host>:<port>` is the address of the database server;
    - `<database>` is the name of the database.

    For PostgreSQL server, if `<username>:<password>` are omitted,
    the credential of the current user are used; if `<host>:<port>`
    are omitted, the server is expected to run on the local machine.
    Thus, to connect to a database `ctl_demo` running on the same
    host under credentials of the current user, write:

        db: pgsql:ctl_demo

    Sometimes the application may use more than one database.
    To configure any auxiliary database, configure parameter
    `gateways`, which should map gateway names to connection URIs:

        gateways:
            aux: pgsql:ctl_demo_aux

    `rex` provides a number of task for inspecting and querying
    the application database.  You can interactively inspect
    the schema and the content of the database from the HTSQL shell,
    which you start with `rex shell`:

        $ rex shell rex.ctl_demo --set db=pgsql:ctl_demo
        Type 'help' for more information, 'exit' to quit the shell.
        ctl_demo$

    You can use `describe` command to inspect the database schema:

        ctl_demo$ describe
        PGSQL:///ctl_demo - HTSQL database
        ...

        ctl_demo$ describe user
        USER - table
        ...

    You can use HTSQL queries to inspect the database content:

        ctl_demo$ /user
         | User                                       |
         +-----------------+----------------+---------+
         | Code            | Name           | Enabled |
        -+-----------------+----------------+---------+-
         | alice@rexdb.com | Alice Amter    | true    |
        ...

    Press Ctrl-D to exit the shell.

    To execute HTSQL queries non-interactively, use `rex query`
    task.  For example:

        $ echo /user >user.htsql
        $ rex query rex.ctl_demo -i user.htsql -f json
        {
          "user": [
            {
              "code": "alice@rexdb.com",
              "name": "Alice Amter",
              "enabled": true
            },
            ...
          ]
        }

    To can build a database schema diagram using GraphViz, run
    `rex graphdb`:

        $ rex graphdb rex.ctl_demo -o ctl_demo.png
    """

    name = 'database-access'


