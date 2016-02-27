#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Extension


__all__ = (
    'MartTool',
)


class MartTool(Extension):
    """
    An extension for implementing a new RexMart action-based Tool.
    """

    #: A unique identifier for the tool.
    name = None

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def is_enabled_for_mart(cls, mart):
        """
        Indicates whether or not the Tool this class represents can be used
        with the specified Mart.

        :param mart: the Mart to check
        :type mart: Mart
        :rtype: bool
        """

        raise NotImplementedError()

    @classmethod
    def get_tools_for_mart(cls, mart):
        """
        Retrieves a list of all Tools that are compatible with the specified
        Mart.

        :param mart: the Mart to check
        :type mart: Mart
        :rtype: list of str
        """

        tools = []
        for name, impl in cls.mapped().items():
            if impl.is_enabled_for_mart(mart):
                tools.append(name)
        return tools

