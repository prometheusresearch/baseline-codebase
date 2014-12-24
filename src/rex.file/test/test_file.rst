************************
  Attachment interface
************************

::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.file_demo')
    >>> demo.on()

    >>> from rex.file import get_file

    >>> file = get_file('study', 'fos')
    >>> file
    File(FileMap(u'study', u'file'), ID(u'fos'), None)

    >>> file.exists()
    False

    >>> file.upload('obesity.txt', "What is obesity?\n")
    >>> file                                                # doctest: +ELLIPSIS
    File(FileMap(u'study', u'file'), ID(u'fos'), '/.../obesity.txt')

    >>> file = get_file('study', 'fos')
    >>> file                                                # doctest: +ELLIPSIS
    File(FileMap(u'study', u'file'), ID(u'fos'), u'/.../obesity.txt')

    >>> file.exists()
    True

    >>> file.open()                                         # doctest: +ELLIPSIS
    <open file '.../obesity.txt', ...>

    >>> file.stat()                                         # doctest: +ELLIPSIS
    posix.stat_result(..., st_size=17, ...)

    >>> file.abspath()                                      # doctest: +ELLIPSIS
    '.../obesity.txt'

    >>> from webob import Request
    >>> req = Request.blank('/')
    >>> print file.download()(req)                          # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    Content-Length: 17
    Content-Disposition: attachment; filename=obesity.txt
    ...
    What is obesity?
    <BLANKLINE>

    >>> file.remove()

    >>> file
    File(FileMap(u'study', u'file'), ID(u'fos'), None)


Errors
======

::

    >>> get_file('study', 'fos', link_name='title')
    Traceback (most recent call last):
      ...
    Error: Expected a link to the file table; got:
        study.title

    >>> get_file('study', 'uss')
    Traceback (most recent call last):
      ...
    Error: Cannot find record:
        study[uss]

    >>> from rex.port import Port
    >>> study_port = Port('study')
    >>> file = get_file('study', 'fos')
    >>> file.upload(('obesity.txt', "What is obesity?\n"))
    >>> fos_data = study_port.produce('study=fos').data.study[0]
    >>> study_port.update([{'id': 'asdl', 'file': fos_data.file}])      # doctest: +ELLIPSIS
    <Product ...>
    >>> get_file('study', 'asdl')
    Traceback (most recent call last):
      ...
    Error: Got link to a stolen file:
        study[asdl]

    >>> file.remove()

