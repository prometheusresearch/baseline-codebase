#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import LatentRex
from docutils import nodes
from docutils.parsers.rst import Directive, directives
from docutils.statemachine import ViewList
from sphinx import addnodes
from sphinx.ext.autodoc import AutodocReporter


class AutoRexReporter(AutodocReporter):

    def __init__(self, viewlist, reporter, offset):
        super(AutoRexReporter, self).__init__(viewlist, reporter)
        self.offset = offset

    def system_message(self, level, message, *children, **kwargs):
        if 'line' in kwargs:
            kwargs['line'] += self.offset
        return super(AutoRexReporter, self).system_message(
                level, message, *children, **kwargs)


class AutoRexDirective(Directive):

    required_arguments = 1

    option_spec = {
            'project': directives.unchanged,
            'package': directives.unchanged,
            'noindex': directives.flag,
    }

    def run(self):
        env = self.state.document.settings.env
        extension_name = self.arguments[0]
        package_name = self.options.get('package')
        project_name = self.options.get('project', package_name)
        noindex = 'noindex' in self.options
        if '.' not in extension_name:
            raise ImportError(extension_name)
        module_name, class_name = extension_name.rsplit('.', 1)
        module = __import__(module_name, fromlist=[class_name])
        extension = getattr(module, class_name)
        if project_name:
            with LatentRex(project_name):
                entries = extension.document_all(package_name)
        else:
            with LatentRex(module_name):
                entries = [extension.document()]
        nodes = []
        for entry in entries:
            content = ViewList(
                    entry.content.splitlines(),
                    entry.filename or '')
            node = addnodes.desc()
            node.document = self.state.document
            node['domain'] = 'std'
            node['objtype'] = 'rex'
            sig_node = addnodes.desc_signature(entry.header, '')
            sig_node['first'] = False
            node.append(sig_node)
            sig_node += addnodes.desc_name(entry.header, entry.header)
            content_node = addnodes.desc_content()
            node.append(content_node)
            old_reporter = self.state.memo.reporter
            self.state.memo.reporter = AutoRexReporter(
                    content, self.state.memo.reporter, entry.line or 0)
            self.state.nested_parse(content, entry.line or 0, content_node)
            self.state.memo.reporter = old_reporter
            if entry.index and not noindex:
                target_name = ('%s-%s' % (class_name, entry.index)).lower()
                index_line = "%s; %s" % (class_name, entry.index)
                sig_node['ids'].append(target_name)
                index_entry = ('single', index_line, target_name, '', None)
                index_node = addnodes.index(entries=[index_entry])
                self.state.document.note_explicit_target(sig_node)
                nodes.append(index_node)
                env.domaindata['std']['objects']['rex', target_name] = \
                        (env.docname, target_name)
            nodes.append(node)
        return nodes


def setup(app):
    app.add_directive('autorex', AutoRexDirective)
    app.add_crossref_type('rex', 'rex')


