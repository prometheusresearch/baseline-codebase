#
# Copyright (c) 2015, Prometheus Research, LLC
#


from cogs import task, argument, option
from cogs.log import fail
from .common import make_rex, pair
from .shell import extension, merge_extensions
from rex.core import Error
from rex.db import get_db
import htsql.core.model, htsql.core.model, htsql.core.classify
import sys
import os
import mimetypes
import collections
import tempfile
import subprocess
import webbrowser


@task
class GRAPHDB:
    """draw schema diagram using GraphViz

    The `graphdb` task to draw a schema graph for the application database.

    This task takes one argument: the name of the primary RexDB package.
    Alternatively, the package could be specified using `project` setting.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.

    Use option `--extend` (`-E`) to enable an HTSQL extension.

    Use option `--gateway` (`-G`) to connect to a secondary application
    database.

    Use option `--output` (`-o`) to write the diagram to a file.

    Use option `--format` (`-f`) to specify the format of the output.
    Valid formats include png, jpg, pdf, svg.  If the `-f` option
    is not specified, the task dumps the graph definition.
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")
    extend = option('E', extension, default=[], plural=True,
            value_name="EXT:PARAM=VALUE",
            hint="include an HTSQL extension")
    gateway = option('G', str, default=None,
            value_name="NAME",
            hint="connect to a gateway database")
    output = option('o', str, default=None,
            value_name="FILE",
            hint="write query output to a file")
    format = option('f', str, default=None,
            value_name="FORMAT",
            hint="set output format")


    def __init__(self, project, require, set, extend, gateway, output, format):
        self.project = project
        self.require = require
        self.set = set
        self.extend = merge_extensions(extend)
        self.gateway = gateway
        self.output = output
        self.format = format

    def __call__(self):
        # Build the application and extract HTSQL configuration.
        set_list = dict(self.set)
        if self.extend:
            set_list['htsql_extensions'] = self.extend
        app = make_rex(self.project, self.require, set_list, False,
                       ensure='rex.db')
        try:
            with app:
                db = (get_db(self.gateway) if self.gateway is not None
                      else get_db())
        except Error, error:
            raise fail(str(error))
        if db is None:
            raise fail("unknown gateway: `{}`", self.gateway)
        # Draw the diagram.
        with db:
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


