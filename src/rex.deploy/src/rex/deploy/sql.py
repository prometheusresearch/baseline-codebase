#
# Copyright (c) 2013, Prometheus Research, LLC
#


import decimal
import datetime
import hashlib
import functools
import inspect
import jinja2


def mangle(fragments, suffix=None,
           max_length=63,
           forbidden_prefixes=[u"pg"],
           forbidden_suffixes=[u"id", u"pk", u"uk", u"fk", u"chk",
                               u"seq", u"enum"]):
    """
    Generates a SQL name from fragments and a suffix.

    `fragment`
        A word or a list of words from which the name is generated.
    `suffix`
        Optional ending.

    :func:`mangle` joins the fragments and the suffix with ``_``.  If necessary,
    it mangles the name to fit the limit on number of characters and avoid naming
    collisions.
    """
    # Accept a single word too.
    if not isinstance(fragments, (list, tuple)):
        fragments = [fragments]
    # Make a separator that is not contained in any fragments.
    separator = u"_"
    while any(separator in fragment for fragment in fragments):
        separator += u"_"
    # Generate the name
    stem = separator.join(fragments)
    text = stem
    if suffix is not None:
        text += separator+suffix
    # Find if the name is collision-prone.
    is_forbidden = (any(stem == syllable or stem.startswith(syllable+u"_")
                        for syllable in forbidden_prefixes) or
                    (suffix is None and
                     any(stem == syllable or stem.endswith(u"_"+syllable)
                         for syllable in forbidden_suffixes)))
    # Mangle the name if it's too long or collision-prone.
    if is_forbidden or len(text) > max_length:
        # Add 6 characters from the MD5 hash to prevent collisions.
        digest = separator+unicode(hashlib.md5(stem).hexdigest()[:6])
        # Cut some characters to reduce the name length if necessary.
        if len(text)+len(digest) > max_length:
            cut_start = max_length/4
            cut_end = cut_start+len(digest)+len(separator)+len(text)-max_length
            text = text[:cut_start]+separator+text[cut_end:]
        text += digest
        assert len(text) <= max_length
    return text


def sql_name(names):
    """
    Quotes a SQL name or a list of names.

    `names`
        Identifier or a list of identifiers.

    If given a list of names, returns a comma-separated sequence of quoted
    identifiers.  Otherwise, returns a quoted identifier.
    """
    if not isinstance(names, (list, tuple)):
        names = [names]
    return u", ".join(u"\"%s\"" % name.replace(u"\"", u"\"\"")
                      for name in names)


def sql_value(value):
    """
    Converts a value to a SQL literal.

    `value`
        SQL value.  Accepted types are ``bool``, ``int``, ``long``, ``float``,
        ``decimal.Decimal``, ``str``, ``unicode`` or ``None``.  Also accepted
        are lists or tuples of acceptable values.

        Special values ``datetime.date.today`` and ``datetime.datetime.now``
        are converted to the current date and timestamp respectively.
    """
    if value is None:
        return u"NULL"
    if isinstance(value, bool):
        if value is True:
            return u"TRUE"
        if value is False:
            return u"FALSE"
    if isinstance(value, (int, long, float, decimal.Decimal)):
        # FIXME: accept finite numbers only.
        return unicode(value)
    if isinstance(value, (datetime.date, datetime.time, datetime.datetime)):
        return u"'%s'" % value
    if isinstance(value, (str, unicode)):
        value = value.replace(u"'", u"''")
        if u"\\" in value:
            value = value.replace(u"\\", u"\\\\")
            return u"E'%s'" % value
        else:
            return u"'%s'" % value
    if isinstance(value, (list, tuple)):
        return u", ".join(sql_value(item) for item in value)
    if value == datetime.date.today:
        return u"'now'::text::date"
    if value == datetime.datetime.now:
        return u"'now'::text::timestamp"
    raise NotImplementedError("sql_value() is not implemented"
                              " for value %s of type %s"
                              % (value, type(value).__name__))


# Customized Jinja environment for rendering SQL.
sql_jinja = jinja2.Environment(
        line_statement_prefix='#')
sql_jinja.globals.update({
    'zip': zip,
    'unicode': unicode,
})
sql_jinja.filters.update({
    'name': sql_name,
    'n': sql_name,
    'value': sql_value,
    'v': sql_value,
})
sql_jinja.tests.update({
    'instanceof': isinstance,
})


def sql_render(template, **context):
    """
    Renders a SQL statement or fragment from a Jinja template.

    In the template, you can use filter ``|n`` and ``|v`` to render
    SQL names and values respectively using :func:`sql_name` and
    :func:`sql_value`.

    `template`
        A template string.
    `context`
        Template parameters.
    """
    template = sql_jinja.from_string(inspect.cleandoc(template))
    return template.render(context)


def sql_template(fn):
    """
    Decorator for making parameterized SQL templates.

    The docstring of the decorated function must be a SQL template
    suitable for use with :func:`sql_render`.  Function parameters
    are converted to template parameters.  The function body is
    never called.
    """
    template = sql_jinja.from_string(inspect.getdoc(fn))
    @functools.wraps(fn)
    def render(*args, **kwds):
        context = inspect.getcallargs(fn, *args, **kwds)
        return template.render(context).rstrip()
    return render


@sql_template
def sql_create_database(name, template=None):
    """
    CREATE DATABASE {{ name|n }} WITH ENCODING = 'UTF-8'
        {%- if template %} TEMPLATE = {{ template|n }}{% endif %};
    """


@sql_template
def sql_drop_database(name):
    """
    DROP DATABASE {{ name|n }};
    """


@sql_template
def sql_rename_database(name, new_name):
    """
    ALTER DATABASE {{ name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_select_database(name):
    """
    SELECT TRUE FROM pg_catalog.pg_database AS d WHERE d.datname = {{ name|v }};
    """


@sql_template
def sql_comment_on_schema(name, text):
    """
    COMMENT ON SCHEMA {{ name|n }} IS {{ text|v }};
    """


@sql_template
def sql_create_table(name, definitions, is_unlogged=False):
    """
    CREATE{% if is_unlogged %} UNLOGGED{% endif %} TABLE {{ name|n }} (
    # for line in definitions
        {{ line }}{% if not loop.last %},{% endif %}
    # endfor
    );
    """


@sql_template
def sql_drop_table(name):
    """
    DROP TABLE {{ name|n }};
    """


@sql_template
def sql_rename_table(name, new_name):
    """
    ALTER TABLE {{ name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_comment_on_table(name, text):
    """
    COMMENT ON TABLE {{ name|n }} IS {{ text|v }};
    """


@sql_template
def sql_define_column(name, type_name, is_not_null, default=None):
    """
    {{ name|n }}
    #- if type_name is instanceof(unicode)
     {{ type_name|n }}
    #- else
     {{ type_name[0]|n }}({{ type_name[1]|v }})
    #- endif
    #- if is_not_null
     NOT NULL
    #- endif
    #- if default is not none
     DEFAULT {{ default }}
    #- endif
    """


@sql_template
def sql_add_column(table_name, name, type_name, is_not_null, default=None):
    """
    ALTER TABLE {{ table_name|n }} ADD COLUMN {{ name|n }}
    #- if type_name is instanceof(unicode)
     {{ type_name|n }}
    #- else
     {{ type_name[0]|n }}({{ type_name[1]|v }})
    #- endif
    #- if is_not_null
     NOT NULL
    #- endif
    #- if default is not none
     DEFAULT {{ default }}
    #- endif
    {{- ';' }}
    """


@sql_template
def sql_drop_column(table_name, name):
    """
    ALTER TABLE {{ table_name|n }} DROP COLUMN {{ name|n }};
    """


@sql_template
def sql_rename_column(table_name, name, new_name):
    """
    ALTER TABLE {{ table_name|n }} {{- ' ' -}}
    RENAME COLUMN {{ name|n }} TO {{ new_name|n }};
    """


@sql_template
def sql_copy_column(table_name, name, source_name):
    """
    UPDATE {{ table_name|n }} SET {{ name|n }} = {{ source_name|n }};
    """


@sql_template
def sql_set_column_type(table_name, name, type_name, expression=None):
    """
    ALTER TABLE {{ table_name|n }} {{- ' ' -}}
    ALTER COLUMN {{ name|n }} SET DATA TYPE {{ type_name|n }}
    #- if expression is not none
     USING {{ expression }}
    #- endif
    {{- ';' }}
    """


@sql_template
def sql_cast(expression, type_name):
    """
    {{ expression }}::{{ type_name|n }}
    """


@sql_template
def sql_set_column_not_null(table_name, name, is_not_null):
    """
    ALTER TABLE {{ table_name|n }} ALTER COLUMN {{ name|n }}
    #- if is_not_null
     SET NOT NULL;
    #- else
     DROP NOT NULL;
    #- endif
    """


@sql_template
def sql_set_column_default(table_name, name, expression):
    """
    ALTER TABLE {{ table_name|n }} ALTER COLUMN {{ name|n }}
    #- if expression is not none
     SET DEFAULT {{ expression }};
    #- else
     DROP DEFAULT;
    #- endif
    """


@sql_template
def sql_comment_on_column(table_name, name, text):
    """
    COMMENT ON COLUMN {{ table_name|n }}.{{ name|n }} IS {{ text|v }};
    """


@sql_template
def sql_create_index(name, table_name, column_names):
    """
    CREATE INDEX {{ name|n }} ON {{ table_name|n }} ({{ column_names|n }});
    """


@sql_template
def sql_drop_index(name):
    """
    DROP INDEX {{ name|n }};
    """


@sql_template
def sql_rename_index(name, new_name):
    """
    ALTER INDEX {{ name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_add_unique_constraint(table_name, name, column_names, is_primary):
    """
    ALTER TABLE {{ table_name|n }} ADD CONSTRAINT {{ name|n }}
    #- if is_primary
     PRIMARY KEY
    #- else
     UNIQUE
    #- endif
     ({{ column_names|n }})
    #- if is_primary
    , CLUSTER ON {{ name|n }}
    #- endif
    {{- ';' }}
    """


@sql_template
def sql_add_foreign_key_constraint(table_name, name, column_names,
                                   target_table_name, target_column_names,
                                   on_update=None, on_delete=None):
    """
    ALTER TABLE {{ table_name|n }} ADD CONSTRAINT {{ name|n }} {{- ' ' -}}
    FOREIGN KEY ({{ column_names|n }}) {{- ' ' -}}
    REFERENCES {{ target_table_name|n }} ({{ target_column_names|n }}) {{- '' -}}
    #- if on_update is not none
     ON UPDATE {{ on_update }}
    #- endif
    #- if on_delete is not none
     ON DELETE {{ on_delete }}
    #- endif
    {{- ';' }}
    """


@sql_template
def sql_drop_constraint(table_name, name):
    """
    ALTER TABLE {{ table_name|n }} DROP CONSTRAINT {{ name|n }};
    """


@sql_template
def sql_rename_constraint(table_name, name, new_name):
    """
    ALTER TABLE {{ table_name|n }} RENAME CONSTRAINT {{ name|n }} {{- ' ' -}}
    TO {{ new_name|n }};
    """


@sql_template
def sql_comment_on_constraint(table_name, name, text):
    """
    COMMENT ON CONSTRAINT {{ name|n }} ON {{ table_name|n }} IS {{ text|v }};
    """


@sql_template
def sql_create_enum_type(name, labels):
    """
    CREATE TYPE {{ name|n }} AS ENUM ({{ labels|v }});
    """


@sql_template
def sql_drop_type(name):
    """
    DROP TYPE {{ name|n }};
    """


@sql_template
def sql_rename_type(name, new_name):
    """
    ALTER TYPE {{ name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_comment_on_type(name, text):
    """
    COMMENT ON TYPE {{ name|n }} IS {{ text|v }};
    """


@sql_template
def sql_create_sequence(name, owner_table_name=None, owner_name=None):
    """
    CREATE SEQUENCE {{ name|n }}
    #- if owner_name is not none
     OWNED BY {{ owner_table_name|n }}.{{ owner_name|n }}
    #- endif
    {{- ';' }}
    """


@sql_template
def sql_drop_sequence(name):
    """
    DROP SEQUENCE {{ name|n }};
    """


@sql_template
def sql_rename_sequence(name, new_name):
    """
    ALTER SEQUENCE {{ name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_nextval(name):
    """
    nextval({{ name|v }}::regclass)
    """


@sql_template
def sql_create_function(name, types, return_type, language, source):
    """
    CREATE OR REPLACE FUNCTION {{ name|n }}({{ types|n }}) {{- ' ' -}}
    RETURNS {{ return_type|n }} LANGUAGE {{ language }} AS {{ source|v }};
    """


@sql_template
def sql_drop_function(name, types):
    """
    DROP FUNCTION {{ name|n }}({{ types|n }});
    """


@sql_template
def sql_rename_function(name, types, new_name):
    """
    ALTER FUNCTION {{ name|n }}({{ types|n }}) RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_create_trigger(table_name, name, when, event,
                       function_name, arguments):
    """
    CREATE TRIGGER {{ name|n }} {{ when }} {{ event }} {{- ' ' -}}
    ON {{ table_name|n }} {{- ' ' -}}
    FOR EACH ROW EXECUTE PROCEDURE {{ function_name|n }}({{ arguments|v }});
    """


@sql_template
def sql_drop_trigger(table_name, name):
    """
    DROP TRIGGER {{ name|n }} ON {{ table_name|n }};
    """


@sql_template
def sql_rename_trigger(table_name, name, new_name):
    """
    ALTER TRIGGER {{ name|n }} ON {{ table_name|n }} RENAME TO {{ new_name|n }};
    """


@sql_template
def sql_comment_on_trigger(table_name, name, text):
    """
    COMMENT ON TRIGGER {{ name|n }} ON {{ table_name|n }} IS {{ text|v }};
    """


@sql_template
def sql_select(table_name, names):
    """
    SELECT {{ names|n }}
        FROM {{ table_name|n }};
    """


@sql_template
def sql_insert(table_name, names, values, returning_names=None):
    """
    INSERT INTO {{ table_name|name }}
        {%- if names %} ({{ names|name }}){% endif %}
    # if values
        VALUES ({{ values|value }}) {%- if not returning_names %};{% endif %}
    # else
        DEFAULT VALUES {%- if not returning_names %};{% endif %}
    # endif
    # if returning_names
        RETURNING {{ returning_names|name }};
    # endif
    """


@sql_template
def sql_update(table_name, key_name, key_value, names, values,
               returning_names=None):
    """
    # if not names and not values
    # set names = [key_name]
    # set values = [key_value]
    # endif
    UPDATE {{ table_name|n }}
        SET {% for name, value in zip(names, values) -%}
                {{ name|n }} = {{ value|v }}{% if not loop.last %}, {% endif %}
            {%- endfor %}
        WHERE {{ key_name|n }} = {{ key_value|v }}
        {%- if not returning_names %};{% endif %}
    # if returning_names
        RETURNING {{ returning_names|n }};
    # endif
    """


@sql_template
def sql_delete(table_name, key_name, key_value):
    """
    DELETE FROM {{ table_name|n }}
        WHERE {{ key_name|n }} = {{ key_value|v }};
    """


def plpgsql_primary_key_procedure(*parts):
    return u"\n%s\n" % sql_render("""
    BEGIN
    # for part in parts
    # for line in part.splitlines()
        {{ line }}
    # endfor
    # endfor
        RETURN NEW;
    END;
    """, parts=parts)


@sql_template
def plpgsql_integer_random_key(table_name, name):
    """
    IF NEW.{{ name|n }} IS NULL THEN
        NEW.{{ name|n }} := trunc((random()*999999999) + 1);
    END IF;
    """


@sql_template
def plpgsql_text_random_key(table_name, name):
    """
    # set letters = "ABCDEFGHJKLMNPQRTUVWXYZ"
    # set digits = "0123456789"
    # set one_letter = "_letters[1 + trunc(random()*%s)]" % letters|length
    # set one_digit = "_digits[1 + trunc(random()*%s)]" % digits|length
    IF NEW.{{ name|n }} IS NULL THEN
        DECLARE
            _letters text[] := '{{ '{' + (letters|join(',')) + '}' }}';
            _digits text[] := '{{ '{' + (digits|join(',')) + '}' }}';
        BEGIN
            NEW.{{ name|n }} :=
                {{ one_letter }} ||
                {{ one_digit }} ||
                {{ one_digit }} ||
                {{ one_letter }} ||
                {{ one_digit }} ||
                {{ one_digit }} ||
                {{ one_digit }} ||
                {{ one_digit }};
        END;
    END IF;
    """


@sql_template
def plpgsql_integer_offset_key(table_name, name, basis_names):
    """
    IF NEW.{{ name|n }} IS NULL THEN
        DECLARE
            _offset int4;
        BEGIN
            SELECT max({{ name|n }}) INTO _offset
    # if basis_names
                FROM {{ table_name|n }}
                WHERE {% for basis_name in basis_names -%}
                      {% if not loop.first %} AND {% endif -%}
                      {{ basis_name|n }} = NEW.{{ basis_name|n -}}
                      {% endfor %};
    # else
                FROM {{ table_name|n }};
    # endif
            NEW.{{ name|n }} := coalesce(_offset, 0) + 1;
        END;
    END IF;
    """


@sql_template
def plpgsql_text_offset_key(table_name, name, basis_names):
    """
    IF NEW.{{ name|n }} IS NULL THEN
        DECLARE
            _offset int4;
        BEGIN
            SELECT CAST(max({{ name|n }}) AS int4) INTO _offset
                FROM {{ table_name|n }}
                WHERE {{ name|n }} ~ '^[0-9]{3}$'
                      {%- for basis_name in basis_names %} {{- ' ' -}}
                      AND {{ basis_name|n }} = NEW.{{ basis_name|n }}
                      {%- endfor %};
            NEW.{{ name|n }} := to_char(coalesce(_offset, 0) + 1, 'FM000');
        END;
    END IF;
    """


