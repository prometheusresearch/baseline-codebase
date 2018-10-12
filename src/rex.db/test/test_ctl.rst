**************************
  Command-line Interface
**************************

.. contents:: Table of Contents


``rex shell``
=============

To inspect the content of the application database, open HTSQL shell with
``rex shell`` command::

    >>> from rex.ctl import Ctl, ctl

    >>> import os
    >>> os.environ['REX_PROJECT'] = 'rex.db_demo'
    >>> os.environ['REX_PARAMETERS'] = '{"db": "sqlite:./sandbox/db_demo.sqlite"}'

    >>> ctl("shell", input="/count(school)")        # doctest: +NORMALIZE_WHITESPACE
     | count(school) |
    -+---------------+-
     |             9 |

You could enable additional HTSQL plugins from the command line using
``--extend`` option.  Plugins specified by ``--extend`` option and through
``htsql_extensions`` setting are combined::

    >>> os.environ['REX_PARAMETERS'] = '''{"db": "sqlite:./sandbox/db_demo.sqlite",
    ...                                    "htsql_extensions": {"tweak.hello": null}}'''

    >>> ctl("shell --extend tweak.autolimit:limit=3",
    ...     input="/school")                        # doctest: +NORMALIZE_WHITESPACE
     | school                                 |
     +------+------------------------+--------+
     | code | name                   | campus |
    -+------+------------------------+--------+-
     | art  | School of Art & Design | old    |
     | bus  | School of Business     | south  |
     | edu  | College of Education   | old    |

    >>> ctl("shell --extend tweak.autolimit:limit=3",
    ...     input="/hello()")                      # doctest: +NORMALIZE_WHITESPACE
    Hello, World!

Using ``--gateway`` option, you could connect to an auxiliary application database
if it is configured::

    >>> ctl("shell --gateway input", expect=1)      # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: unknown gateway: input


``rex query``
=============

Use command ``rex query`` to execute one or more HTSQL commands in a single
transaction.  By default, ``rex query`` produces no output::

    >>> ctl("query", input="count(school)")         # doctest: +NORMALIZE_WHITESPACE

Use option ``--format`` to specify the output format::

    >>> ctl("query --format=csv",
    ...     input="count(school)")                  # doctest: +NORMALIZE_WHITESPACE
    count(school)
    9

You can also save output to a file::

    >>> ctl("query -o ./sandbox/num_school.csv",
    ...     input="count(school)")                  # doctest: +NORMALIZE_WHITESPACE

    >>> print(open("./sandbox/num_school.csv").read())   # doctest: +NORMALIZE_WHITESPACE
    count(school)
    9

Just as well, you can read input from a file.  You can specify either a real
path to a file or a package path::

    >>> ctl("query -i ./demo/static/db/num_school.htsql -f csv")    # doctest: +NORMALIZE_WHITESPACE
    num_school
    9

    >>> ctl("query -i rex.db_demo:/db/num_school.htsql -f csv")     # doctest: +NORMALIZE_WHITESPACE
    num_school
    9

Some queries may be parametric.  Unless you provide a parameter with ``-D``
option, they will report an error::

    >>> ctl("query",
    ...     input="count(program?school=$school)", expect=1)        # doctest: +ELLIPSIS
    FATAL ERROR: Found unknown reference:
        $school
    While translating:
        count(program?school=$school)
                             ^^^^^^^
    ...

    >>> ctl("query -D school=art",
    ...     input="count(program?school=$school)")                  # doctest: +NORMALIZE_WHITESPACE


``rex graphdb``
===============

You can generate a graph diagram with GraphViz using ``rex graphdb`` command.
By default, it generates a graph specification::

    >>> ctl("graphdb")                              # doctest: +NORMALIZE_WHITESPACE
    digraph "./sandbox/db_demo.sqlite" {
        "appointment"
        "course"
        "department"
        "instructor"
        "program"
        "school"
        "appointment" -> "department"
        "course" -> "department"
        "appointment" -> "instructor"
        "program" -> "program" [label="part_of",constraint=false]
        "department" -> "school" [constraint=false]
        "program" -> "school"
    }

You can make ``rex graphdb`` call GraphViz to render the graph::

    >>> ctl("graphdb -o ./sandbox/db_demo.png")     # doctest: +NORMALIZE_WHITESPACE

If ``rex graphdb`` is unable to determine the file type from the extension,
you could specify the file format using ``--format`` option::

    >>> ctl("graphdb -o ./sandbox/db_demo.pdf -f pdf")  # doctest: +NORMALIZE_WHITESPACE

GraphViz will complain if you specify invalid format::

    >>> ctl("graphdb -f csv", expect=1)                 # doctest: +ELLIPSIS
    Format: "csv" not recognized. Use one of: ...
    FATAL ERROR: non-zero exit code: dot -Tcsv ...


``rex sqlshell``
================

Use command ``rex sqlshell`` to run a native SQL client against the application
database::

    >>> ctl("sqlshell")

It is an error to run ``sqlshell`` if the application database is
ill-configured::

    >>> ctl("sqlshell --set db=csv:demo.csv", expect=1)     # doctest: +NORMALIZE_WHITESPACE
    FATAL ERROR: unknown database engine: csv:///demo.csv



