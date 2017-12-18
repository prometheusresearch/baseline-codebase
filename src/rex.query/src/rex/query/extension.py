#
# Copyright (c) 2017, Prometheus Research, LLC
#

from rex.core import Extension

__all__ = ('Chart', 'ExportFormatter')


class Chart(Extension):
    """ An extension to define charts for qeury builder."""

    #
    # Declatation API
    #

    # Chart name is used to differentiate between charts when validating
    # configuration.
    name = None

    # js_type is used to specify the JavaScript code which will render the chart
    # UI
    js_type = None

    # js_type is used to specify the JavaScript code which will render the chart
    # editor UI
    editor_js_type = None

    #
    # Implementation
    #

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def sanitize(cls):
        # consider chart as being "abstract" if name is none
        if cls.name is None:
            return
        assert cls.js_type is not None, '%r.js_type is not defined' % cls
        assert cls.editor_js_type is not None, '%r.editor_js_type is not defined' % cls

    def __repr__(self):
        return '<%r %r>' % (self.__class__, self.name)


class ExportFormatter(Extension):
    """ An extension to define export formatters for query builder."""

    #
    # Declatation API
    #

    # Name of the HTSQL formatter to use.
    name = None

    # Extension of the filename which is generated as an output of the export
    # procedure.
    extension = None

    # Textual label which is used to render on a button corresponding to an
    # export formatter.
    label = None

    # Optional mimetype.
    mimetype = None

    #
    # Implementation
    #

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def sanitize(cls):
        # consider chart as being "abstract" if name is none
        if cls.name is None:
            return
        assert cls.extension is not None, '%r.extension is not defined' % cls
        assert cls.label is not None, '%r.label is not defined' % cls

    def __repr__(self):
        return '<%r %r>' % (self.__class__, self.name)
