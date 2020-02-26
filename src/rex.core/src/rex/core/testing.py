#
# Copyright (c) 2020, Prometheus Research, LLC
#


class RexTestSuite:
    """
    A ``pytest``-compatible test suite class that will automatically activate
    a Rex application for the duration of the tests defined as part of the
    class.

    Requires that the ``create_app()`` method be implemented.
    """

    #: The currently-active Rex application.
    rex = None

    @classmethod
    def create_app(cls):
        """
        Creates and returns the Rex application to activate for the tests
        executed in this suite.

        Must be implemented in concrete classes.

        :rtype: rex.core.Rex
        """

        raise NotImplementedError(
            f'{cls.__name__}.create_app() must be implemented'
        )

    @classmethod
    def setup_class(cls):
        cls.rex = cls.create_app()
        cls.rex.on()

    @classmethod
    def teardown_class(cls):
        cls.rex.off()
        cls.rex = None


class anything:
    """
    A value that can be used in assertions to allow a variable to be "equal" to
    anything. E.g.:

        my_variable = {
            'foo': 1,
            'bar': datetime.now(),
            'baz': 'red',
        }
        assert my_variable == {  # True
            'foo': 1,
            'bar': anything(),
            'baz': 'red',
        }
    """

    def __eq__(self, other):
        return True


class not_none:
    """
    A value that can be used in assertions to allow a variable to be "equal" to
    anything except None. E.g.:

        my_variable = {
            'foo': 1,
            'bar': datetime.now(),
            'baz': 'red',
        }
        assert my_variable == {  # True
            'foo': 1,
            'bar': not_none(),
            'baz': 'red',
        }

        my_variable['bar'] = None
        assert my_variable == {  # False
            'foo': 1,
            'bar': not_none(),
            'baz': 'red',
        }
    """

    def __eq__(self, other):
        return other is not None

