"""

    rex.widget.sphinx.autowidget
    ============================

    :copyright: 2014, Prometheus Research, LLC

"""

import sphinx.ext.autodoc
import sphinx.domains.python
import sphinx.roles
from sphinx.locale import l_

from rex.widget import Field


class WidgetDocumenter(sphinx.ext.autodoc.ClassDocumenter):

    objtype = 'widget'

    # Since these have very specific tests, we give the classes defined here
    # very high priority so that they override any other documenters.
    priority = 100 + sphinx.ext.autodoc.ClassDocumenter.priority

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Field)

    def format_args(self):
        return ""

    def filter_members(self, members, want_all):
        return [(membername, member, False) for (membername, member) in members]

    def get_object_members(self, want_all):
        # TODO: check self.options.members and fitler requires fields
        return False, self.object.fields.items()


class WidgetFieldDocumenter(sphinx.ext.autodoc.AttributeDocumenter):

    objtype = 'widgetattribute'
    directivetype = 'attribute'
    priority = 100 + sphinx.ext.autodoc.AttributeDocumenter.priority

    @classmethod
    def can_document_member(cls, member, membername, isattr, parent):
        return isinstance(member, Field)

    def add_content(self, more_content, no_docstring=False):
        # Revert back to default since the docstring *is* the correct thing to
        # display here.
        sphinx.ext.autodoc.ClassLevelDocumenter.add_content(
            self, more_content, no_docstring)
        self.render_validator()
        self.render_default_value()

    def render_validator(self):
        sourcename = u'docstring of %s' % self.fullname
        self.add_line('* **Validator**: ``%r``' % self.object.validate,
                       sourcename)

    def render_default_value(self):
        sourcename = u'docstring of %s' % self.fullname
        if self.object.default is not NotImplemented:
            self.add_line('* **Default value**: ``%r``' % self.object.default, sourcename)
        else:
            self.add_line('* **field is required**', sourcename)

class WidgetDirective(sphinx.domains.python.PyClasslike):

    def get_index_text(self, modname, name_cls):
        if self.objtype == 'widget':
            if not modname:
                return '%s (built-in widget)' % name_cls[0]
            return '%s (%s widget)' % (name_cls[0], modname)
        else:
            return ''


def setup(app):
    app.add_autodocumenter(WidgetDocumenter)
    app.add_autodocumenter(WidgetFieldDocumenter)

    domain = sphinx.domains.python.PythonDomain
    domain.object_types['widget'] = sphinx.domains.python.ObjType(
        l_('widget'), 'widget', 'obj')
    domain.directives['widget'] = WidgetDirective
    domain.roles['widget'] = sphinx.domains.python.PyXRefRole()
