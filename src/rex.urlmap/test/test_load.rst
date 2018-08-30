***************************
  Loading ``urlmap.yaml``
***************************

.. contents:: Table of Contents


Parsing paths
=============

``rex.urlmap`` requires well-formed URLs::

    >>> from rex.core import Rex, SandboxPackage
    >>> sandbox = SandboxPackage()

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /individual/{id:
    ...     template: /template/individual.html
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected ill-formed path:
        /individual/{id
    While parsing:
        "/.../urlmap.yaml", line 4
    ...

``rex.urlmap`` reports when it cannot recognize a handler record::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /index:
    ...     context: { title: Welcome! }
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected one of:
        !copy record
        !override record
        template record
        query record
        port record
    Got:
        a mapping
    While parsing:
        "/.../urlmap.yaml", line 4
    ...

``rex.urlmap`` detects duplicate or ambiguous paths::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /$a: { template: . }
    ...   /$b: { template: . }
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected duplicate or ambiguous path:
        /$b
    Defined in:
        "/.../urlmap.yaml", line 4
    And previously in:
        "/.../urlmap.yaml", line 3
    ...

``rex.urlmap`` understands both full package and local package paths::

    >>> sandbox.rewrite('/template/full.html',
    ...                 """<title>sandbox:/template/full.html</title>""")
    >>> sandbox.rewrite('/template/local.html',
    ...                 """<title>/template/local.html</title>""")
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /full:
    ...     template: sandbox:/template/full.html
    ...     access: anybody
    ...   /local:
    ...     template: /template/local.html
    ...     access: anybody
    ... """)

    >>> path_demo = Rex(sandbox, 'rex.urlmap_demo')

    >>> from webob import Request

    >>> req = Request.blank('/full')
    >>> print(req.get_response(path_demo))   # doctest: +ELLIPSIS
    200 OK
    ...
    <title>sandbox:/template/full.html</title>

    >>> req = Request.blank('/local')
    >>> print(req.get_response(path_demo))   # doctest: +ELLIPSIS
    200 OK
    ...
    <title>/template/local.html</title>


Include and override
====================

You can use ``include`` directive to split the ``urlmap.yaml`` into several
files::

    >>> sandbox.rewrite('/urlmap/study.yaml', """
    ... paths:
    ...   /study:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context: { title: Studies }
    ... """)
    >>> sandbox.rewrite('/urlmap/individual.yaml', """
    ... paths:
    ...   /individual:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context: { title: Individuals }
    ... """)
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: [./urlmap/study.yaml, ./urlmap/individual.yaml]
    ... """)

    >>> include_demo = Rex(sandbox, 'rex.urlmap_demo', './test/data/templates/')

    >>> req = Request.blank('/study')
    >>> print(req.get_response(include_demo))    # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Studies</title>
    ...

``include`` directive can also take a single filename.  Full package paths are
accepted::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: sandbox:./urlmap/study.yaml
    ... """)

    >>> include_demo = Rex(sandbox, 'rex.urlmap_demo')

Use ``!override`` tag to override context variables and other parameters of a
template handler defined in an included file::

    >>> sandbox.rewrite('/urlmap/base.yaml', """
    ... paths:
    ...   /:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context:
    ...       title: Welcome!
    ...       link: { href: 'http://htsql.org/', title: HTSQL }
    ... """)
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override
    ...     context: { title: "Welcome, frield!" }
    ... """)
    >>> override_demo = Rex(sandbox, 'rex.urlmap_demo', './test/data/templates/')

    >>> req = Request.blank('/')
    >>> print(req.get_response(override_demo))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Welcome, frield!</title>
    ...
    <p><a href="http://htsql.org/">HTSQL</a></p>
    ...

When context variables are merged, nested dictionaries are merged too::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override
    ...     context: { link: { title: HTSQL Query Language } }
    ... """)

    >>> req = Request.blank('/')
    >>> print(req.get_response(override_demo))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <p><a href="http://htsql.org/">HTSQL Query Language</a></p>
    ...

Any field could be overriden::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override
    ...     template: templates:/template/universal.html
    ...     access: authenticated
    ...     unsafe: false
    ...     parameters: { parameter: '' }
    ...     context: { title: "Welcome, frield!" }
    ... """)
    >>> override_demo = Rex(sandbox, 'rex.urlmap_demo', './test/data/templates/')

    >>> req = Request.blank('/?parameter=Bob')
    >>> req.remote_user = 'Alice'
    >>> print(req.get_response(override_demo))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Welcome, frield!</title>
    ...
    <p>Parameter value is <code>Bob</code></p>
    ...

Empty overrides are accepted::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override
    ... """)

    >>> req = Request.blank('/')
    >>> print(req.get_response(override_demo))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Welcome!</title>
    ...

But ill-formed overrides are rejected::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override []
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected a mapping
    Got:
        a sequence
    ...

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /: !override "scalar override"
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected a mapping
    Got:
        scalar override
    ...

HTSQL queries and ports can be overriden too.  With HTSQL queries,
you can only replace the whole query::

    >>> sandbox.rewrite('/urlmap/base.yaml', """
    ... paths:
    ...   /data/individual_info:
    ...     query: total := count(individual)
    ...     access: nobody
    ...     unsafe: true
    ... """)
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/individual_info: !override
    ...     query: total := count(individual.guard($sex, filter(sex=$sex)))
    ...     parameters: { sex }
    ...     access: anybody
    ...     unsafe: false
    ... """)
    >>> req = Request.blank('/data/individual_info?sex=male', accept='application/json')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "total": 3
    }

Overriding a port definition adds more arms to the port::

    >>> sandbox.rewrite('/urlmap/base.yaml', """
    ... paths:
    ...   /data/individual_info:
    ...     port: total := count(individual)
    ...     access: nobody
    ...     unsafe: true
    ... """)
    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/individual_info: !override
    ...     port:
    ...     - min_code := min(individual.code)
    ...     - max_code := max(individual.code)
    ...     access: anybody
    ...     unsafe: false
    ...     read-only: true
    ... """)
    >>> req = Request.blank('/data/individual_info', accept='application/json')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    {
      "total": 5,
      "min_code": "1000",
      "max_code": "1004"
    }

However it is an error to override a template with port or query data
or a port or a query with template data::

    >>> sandbox.rewrite('/urlmap/base.yaml', """
    ... paths:
    ...   /individual:
    ...     template: templates:/template/universal.html
    ...     context:
    ...       title: Individuals
    ...   /data/individual:
    ...     port: individual
    ...   /data/total:
    ...     query: total := count(individual)
    ... """)

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /individual: !override
    ...     port: total := count(individual)
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unexpected field:
        port
    While parsing:
        "/.../urlmap.yaml", line 5
    While processing override of template:
        /individual
    While initializing RexDB application:
        SandboxPackage()
        rex.urlmap_demo

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/total: !override
    ...     context:
    ...       title: Experimental Subjects
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unexpected field:
        context
    While parsing:
        "/.../urlmap.yaml", line 5
    While processing override of query:
        /data/total
    While initializing RexDB application:
        SandboxPackage()
        rex.urlmap_demo

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/individual: !override
    ...     context:
    ...       title: Experimental Subjects
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unexpected field:
        context
    While parsing:
        "/.../urlmap.yaml", line 5
    While processing override of port:
        /data/individual
    While initializing RexDB application:
        SandboxPackage()
        rex.urlmap_demo

You can override the gateway database for queries and ports, but
specifying an unknown gateway will raise an error::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/individual: !override
    ...     gateway: gateway
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Found undefined gateway:
        gateway
    While creating port:
        "/.../urlmap/base.yaml", line 8
    ...

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/total: !override
    ...     gateway: gateway
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Found undefined gateway:
        gateway
    While creating query:
        "/.../urlmap/base.yaml", line 10
    ...

Orphaned overrides are detected and reported::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /orphaned: !override
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected orphaned override:
        /orphaned
    Defined in:
        "/.../urlmap.yaml", line 3
    ...

Some mappers may allow overriding of nested URLs, but it is not allowed for
any handlers predefined by ``rex.urlmap``::

    >>> sandbox.rewrite('/urlmap/base.yaml', """
    ... paths:
    ...   /data/individual/$id:
    ...     port: individual
    ... """)

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: ./urlmap/base.yaml
    ... paths:
    ...   /data/individual/measure: !override
    ...     port: measure
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected invalid override of port:
        /data/individual/$id
    Defined in:
        "/.../urlmap.yaml", line 4
    ...


``Override`` interface
======================

Another way to override urlmap entries is to implement the ``Override``
interface.  An ``Override`` implementation may alter or disable any handler
created by ``rex.urlmap``.

In this example, we disable one handler completely and set ``nobody`` access
permission on another handler::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: [./urlmap/study.yaml, ./urlmap/individual.yaml]
    ... """)

    >>> req = Request.blank('/study')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...

    >>> req = Request.blank('/individual')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...

    >>> from rex.urlmap import Override

    >>> class OverrideStudy(Override):
    ...     priority = 'study'
    ...     def __call__(self, path, spec):
    ...         if self.package.name == 'sandbox' and path == '/study':
    ...             return None
    ...         return spec

    >>> class OverrideIndividual(Override):
    ...     priority = 'individual'
    ...     after = ['study']
    ...     def __call__(self, path, spec):
    ...         if self.package.name == 'sandbox' and path == '/individual':
    ...             spec = spec.__clone__(access='nobody')
    ...         return spec

    >>> override_demo.reset()

    >>> req = Request.blank('/study')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    404 Not Found
    ...

    >>> req = Request.blank('/individual')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    401 Unauthorized
    ...


Copying handlers
================

Sometimes you may need to provide the same page under several URLs.  To avoid
duplicating the entire page configuration, use ``!copy`` handler::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /data/individual:
    ...     port: individual
    ...     access: anybody
    ...   /data/individuals:
    ...     !copy /data/individual
    ... """)

    >>> req = Request.blank('/data/individual')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...

    >>> req = Request.blank('/data/individuals')
    >>> print(req.get_response(override_demo))       # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...

It is an error to copy a handler of an unknown URL::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /data/inidividuals:
    ...     !copy /data/individual
    ... """)

    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Detected orphaned copy:
        /data/inidividuals
    Defined in:
        "/.../urlmap.yaml", line 4
    ...

It is also an error if the ``!copy`` configuration is malformed::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /data/inidividuals: !copy
    ...     port: individual
    ... """)

    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected a tagged !copy string
    Got:
        a mapping
    While parsing:
        "/.../urlmap.yaml", line 3
    ...


Embedding settings
==================

You can use ``!setting`` tag to use a setting value in the ``urlmap.yaml``
file::

    >>> from rex.core import Setting, StrVal

    >>> class SiteTitleSetting(Setting):
    ...     """Site title"""
    ...     name = 'site_title'
    ...     validate = StrVal()
    ...     default = None

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... paths:
    ...   /:
    ...     template: templates:/template/universal.html
    ...     access: anybody
    ...     context: { title: !setting site_title }
    ... """)
    >>> settings_demo = Rex(sandbox, 'rex.urlmap_demo', './test/data/templates/',
    ...                     site_title="Settings Demo")

    >>> req = Request.blank('/')
    >>> print(req.get_response(settings_demo))   # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
    200 OK
    ...
    <title>Settings Demo</title>
    ...

Unknown, invalid or ill-formed setting values are rejected::

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: !setting []
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Failed to parse a YAML document:
        expected a setting name, but found sequence
          in "/.../urlmap.yaml", line 2, column 10
    ...

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: !setting extra_urlmap
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo')         # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Got unknown setting:
        extra_urlmap
    While parsing:
        "/.../urlmap.yaml", line 2
    While validating field:
        include
    ...

    >>> sandbox.rewrite('/urlmap.yaml', """
    ... include: !setting site_title
    ... """)
    >>> Rex(sandbox, 'rex.urlmap_demo', site_title="Settings Demo")     # doctest: +ELLIPSIS
    Traceback (most recent call last):
      ...
    Error: Expected a string matching:
        /[/0-9A-Za-z:._-]+/
    Got:
        'Settings Demo'
    While parsing:
        "/.../urlmap.yaml", line 2
    While validating field:
        include
    ...



