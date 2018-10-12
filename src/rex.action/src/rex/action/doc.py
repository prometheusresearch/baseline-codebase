


from rex.widget import Widget
from .action import ActionBase

class DocumentPlainWidget(Widget):
    """\
    This is purely documentation class to reference all non-action widgets.
    """

    @classmethod
    def document_all(cls, package=None):
        entries = [extension.document() for extension in Widget.all(package)
                       if extension.name is not None
                       and not issubclass(extension, ActionBase)]
        entries.sort(key=(lambda e: e.header))
        return entries
