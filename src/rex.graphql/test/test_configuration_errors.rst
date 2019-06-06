Test rex.graphql configuration errors
=====================================

Setup::

   >>> import contextlib
   >>> import re

   >>> from rex.graphql import Entity, Object, schema, scalar, Enum, EnumValue
   >>> from rex.graphql import q, query, argument, compute

   >>> from rex.core import Rex, Error

   >>> @contextlib.contextmanager
   ... def expect_error():
   ...     try:
   ...         yield
   ...     except Error as err:
   ...         msg = str(err)
   ...         msg = re.sub(r"\.rst\[\d+\]", ".rst", msg) # normalize output
   ...         print(msg)
   ...         return
   ...     #assert False, "expected rex.core.Error exception"

   >>> db = "pgsql:query_demo"
   >>> rex = Rex("rex.query_demo", db=db)
   >>> rex.on()

Multiple entities defined with the same name::

    >>> with expect_error():
    ...      region1 = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name)
    ...      })
    ...      region2 = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name)
    ...      })
    ...      schema(fields=lambda: {
    ...          "region1": query(q.region, region1),
    ...          "region2": query(q.region, region2),
    ...      })
    Type with the same name is already defined:
        <doctest test_configuration_errors.rst>
        ...
        2 | region1 = Entity(name="region", fields=lambda: { ...
        ...
    While configuring entity 'region':
        <doctest test_configuration_errors.rst>
        ...
        5 | region2 = Entity(name="region", fields=lambda: { ...
        ...
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        10 | "region2": query(q.region, region2), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        8 | schema(fields=lambda: { ...
        ...

Multiple entities/objects defined with the same name::

    >>> with expect_error():
    ...      region1 = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name)
    ...      })
    ...      region2 = Object(name="region", fields=lambda: {
    ...          "name": compute(type=scalar.String)
    ...      })
    ...      schema(fields=lambda: {
    ...          "region1": query(q.region, region1),
    ...          "region2": compute(type=region2),
    ...      })
    Type with the same name is already defined:
        <doctest test_configuration_errors.rst>
        ...
        2 | region1 = Entity(name="region", fields=lambda: { ...
        ...
    While configuring object type 'region':
        <doctest test_configuration_errors.rst>
        ...
        5 | region2 = Object(name="region", fields=lambda: { ...
        ...
    While configuring computation:
        <doctest test_configuration_errors.rst>
        ...
        10 | "region2": compute(type=region2), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        8 | schema(fields=lambda: { ...
        ...

Duplicate enum values defined::

    >>> with expect_error():
    ...      name1 = EnumValue("name")
    ...      name2 = EnumValue("name")
    ...      names = Enum("names", values=[name1, name2])
    ...      schema(fields=lambda: {
    ...          "names": compute(type=names)
    ...      })
    Enum value with the same name is already defined:
        <doctest test_configuration_errors.rst>
        ...
        2 | name1 = EnumValue("name") ...
        ...
    While configuring enum value:
        <doctest test_configuration_errors.rst>
        ...
        3 | name2 = EnumValue("name") ...
        ...
    While configuring enum 'names':
        <doctest test_configuration_errors.rst>
        ...
        4 | names = Enum("names", values=[name1, name2]) ...
        ...

Use entity type outside of query field::

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name)
    ...      })
    ...      schema(fields=lambda: {
    ...          "region": compute(type=region),
    ...      })
    Entity type can only be queried with query(..)
    Type is used in the context:
        <doctest test_configuration_errors.rst>
        ...
        6 | "region": compute(type=region), ...
        ...
    While configuring entity 'region':
        <doctest test_configuration_errors.rst>
        ...
        2 | region = Entity(name="region", fields=lambda: { ...
        ...
    While configuring computation:
        <doctest test_configuration_errors.rst>
        ...
        6 | "region": compute(type=region), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        5 | schema(fields=lambda: { ...
        ...

Using ``query(..)`` for entity types without explicit type::

    >>> with expect_error():
    ...      schema(fields=lambda: {
    ...          "region": query(q.region),
    ...      })
    Query results in an entity (table 'public.region') but no type is provided, please specify it like this:
        query(..., type=TYPE)
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        3 | "region": query(q.region), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        2 | schema(fields=lambda: { ...
        ...

Using computed fields with entity types::

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": compute(scalar.String)
    ...      })
    ...      schema(fields=lambda: {
    ...          "region": query(q.region, type=region),
    ...      })
    Entity types can only contain queries but got:
        <doctest test_configuration_errors.rst>
        ...
        3 | "name": compute(scalar.String) ...
        ...
    While configuring entity 'region':
        <doctest test_configuration_errors.rst>
        ...
        2 | region = Entity(name="region", fields=lambda: { ...
        ...
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        6 | "region": query(q.region, type=region), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        5 | schema(fields=lambda: { ...
        ...

Malformed queries::

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.something_weird)
    ...      })
    ...      schema(fields=lambda: {
    ...          "region": query(q.region, type=region),
    ...      })
    Got unknown identifier:
        something_weird
    While processing:
        navigate
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        3 | "name": query(q.something_weird) ...
        ...
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        6 | "region": query(q.region, type=region), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        5 | schema(fields=lambda: { ...
        ...

    >>> with expect_error():
    ...      part = Entity(name="part", fields=lambda: {
    ...          "name": query(q.name),
    ...          "type": query(q.type),
    ...      })
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name),
    ...      })
    ...      schema(fields=lambda: {
    ...          "part": query(q.part, type=part),
    ...          "region": query(q.region, type=part),
    ...      })
    Type 'part' represents database table 'public.part' but was used in the context of query which results in table 'public.region'
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        11 | "region": query(q.region, type=part), ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        9 | schema(fields=lambda: { ...
        ...

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name),
    ...      })
    ...      schema(fields=lambda: {
    ...          "region": query(q.region.select(name=q.name), type=region),
    ...      })
    Queries which result in a record are not supported yet, only entities or scalars are allowed at the momemnt. The query in question is:
        region:select(('name'=>name))
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        6 | "region": query(q.region.select(name=q.name), type= ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        5 | schema(fields=lambda: { ...
        ...

Passing non callable as fields when creating an object type::

    >>> with expect_error():
    ...      Object(name="part", fields={
    ...          "name": query(q.name),
    ...          "type": query(q.type),
    ...      })
    Argument 'fields' should be a function

Passing non callable as fields when creating an entity type::

    >>> with expect_error():
    ...      Entity(name="part", fields={
    ...          "name": query(q.name),
    ...          "type": query(q.type),
    ...      })
    Argument 'fields' should be a function

Passing non callable as fields when creating a schema::

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name),
    ...      })
    ...      schema(fields={'region': query(q.region, type=region)})
    Argument 'fields' should be a function

Let's check errors with filter configuration::

    >>> with expect_error():
    ...      region = Entity(name="region", fields=lambda: {
    ...          "name": query(q.name),
    ...      })
    ...      schema(fields=lambda: {
    ...          "region": query(
    ...              q.region,
    ...              filters=[
    ...                q.unkown_field == argument("name", scalar.String)
    ...              ],
    ...              type=region
    ...          )
    ...      })
    Got unknown identifier:
        unkown_field
    While processing:
        navigate
    While processing:
        =
    While configuring query:
        <doctest test_configuration_errors.rst>
        ...
        11 | type=region ...
        ...
    While configuring schema:
        <doctest test_configuration_errors.rst>
        ...
        5 | schema(fields=lambda: { ...
        ...

Teardown::

   >>> rex.off()
