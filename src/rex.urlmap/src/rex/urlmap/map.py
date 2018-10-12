#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import Extension, RecordVal, Error
from rex.web import PathMask


class Override(Extension):
    """
    External overrides for access control and other properties.

    `package`
        The package responsible for the URLs.
    """

    def __init__(self, package):
        self.package = package

    @classmethod
    def enabled(cls):
        return (cls is not Override)

    def __call__(self, path, spec):
        """
        Returns updated handler configuration or ``None`` to
        disable the handler.

        Must be overridden in subclasses.
        """
        return spec


class Map(Extension):
    """
    Interface for parsing ``urlmap.yaml`` entries.

    `package`
        The package that owns the entry.

    Class attributes:

    `fields`
        List of entry fields in format supported by
        :class:`rex.core.RecordVal`.  Must be provided by implementations.
    """

    fields = None
    validate = None
    validate_override = None
    key = None
    record_type = None

    @classmethod
    def sanitize(cls):
        if cls.fields is not None:
            cls.validate = RecordVal(cls.fields)
            cls.key = next(iter(cls.validate.fields))
            cls.record_type = cls.validate.record_type
            if cls.validate_override is None:
                cls.validate_override = RecordVal([
                    (field.name, field.validate, None)
                    for field in list(cls.validate.fields.values())])

    @classmethod
    def enabled(cls):
        return (cls.fields is not None)

    def __init__(self, package):
        self.package = package

    def __call__(self, spec, path, context):
        """
        Generates a handler from a ``urlmap.yaml`` entry.

        `spec`
            ``urlmap.yaml`` entry.
        `path`
            The URL.
        `context`
            Global context variables defined in ``urlmap.yaml``.

        This method must be overriden by implementations.
        """
        raise NotImplementedError()

    def override(self, spec, override_spec):
        """
        Updates a ``urlmap.yaml`` entry with ``!override`` data.

        This method may be overriden by implementations.
        """
        replacements = dict((key, value)
                            for key, value in list(vars(override_spec).items())
                            if value is not None)
        return spec.__clone__(**replacements)

    def override_at(self, spec, override_spec, path, override_path):
        """
        Updates a ``urlmap.yaml`` entry with ``!override`` data.

        This method may be overriden by implementations.
        """
        if path != override_path:
            return None
        return self.override(spec, override_spec)

    def abspath(self, spec, current_package, current_directory):
        """
        Resolves relative paths in ``urlmap.yaml`` entry.

        This method may be overriden by implementations.
        """
        return spec

    def mask(self, path):
        """
        Converts a URL to a path mask.

        This method may be overriden by implementations.
        """
        return PathMask(path)


