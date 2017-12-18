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

    # Chart type.
    type = None

    # js_type is used to specify the JavaScript code which will render the chart
    # UI
    js_type = None

    #
    # Implementation
    #

    @classmethod
    def signature(cls):
        return cls.type

    @classmethod
    def enabled(cls):
        return cls.type is not None

    @classmethod
    def sanitize(cls):
        # consider chart as being "abstract" if type is none
        if cls.type is None:
            return
        assert cls.js_type is not None, '%r.js_type is not defined' % cls

    def __repr__(self):
        return '<%r %r>' % (self.__class__, self.type)


class ExportFormatter(Extension):
    """ An extension to define export formatters for query builder."""

    #
    # Declatation API
    #

    # MIME type of the HTSQL formatter to use.
    mimetype = None

    # Extension of the filename which is generated as an output of the export
    # procedure.
    extension = None

    # Textual label which is used to render on a button corresponding to an
    # export formatter.
    label = None


    #
    # Implementation
    #

    @classmethod
    def signature(cls):
        return cls.mimetype

    @classmethod
    def enabled(cls):
        return cls.mimetype is not None

    @classmethod
    def sanitize(cls):
        # consider chart as being "abstract" if mimetype is none
        if cls.mimetype is None:
            return
        assert cls.extension is not None, '%r.extension is not defined' % cls
        assert cls.label is not None, '%r.label is not defined' % cls

    def __repr__(self):
        return '<%r %r>' % (self.__class__, self.mimetype)
