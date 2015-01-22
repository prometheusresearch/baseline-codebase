#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.deploy import sql_template


@sql_template
def plpgsql_file_table_check():
    """
    DECLARE
        _session text;
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.timestamp <> 'now'::text::timestamp THEN
                RAISE EXCEPTION 'file.timestamp cannot be directly assigned';
            END IF;
            IF NEW.fresh <> TRUE THEN
                RAISE EXCEPTION 'file.fresh cannot be directly assigned';
            END IF;
            IF NEW.session IS NOT NULL THEN
                RAISE EXCEPTION 'file.session cannot be directly assigned';
            END IF;
            BEGIN
                SELECT current_setting('rex.session') INTO _session;
            EXCEPTION WHEN undefined_object THEN
            END;
            IF _session IS NULL THEN
                SELECT session_user INTO _session;
            END IF;
            NEW.session := _session;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.handle <> OLD.handle THEN
                RAISE EXCEPTION 'file.handle cannot be modified';
            END IF;
            IF NEW.fresh <> OLD.fresh AND NEW.fresh <> FALSE THEN
                RAISE EXCEPTION 'file.fresh cannot be reset';
            END IF;
        END IF;
        RETURN NEW;
    END;
    """

@sql_template
def plpgsql_file_link_check(table_name, name, label):
    """
    DECLARE
        _session text;
        _file file%ROWTYPE;
    BEGIN
        IF NEW.{{ name|n }} IS NOT NULL
           AND (TG_OP = 'INSERT' OR
                TG_OP = 'UPDATE' AND NEW.{{ name|n }} IS DISTINCT FROM OLD.{{ name|n }}) THEN
            BEGIN
                SELECT current_setting('rex.session') INTO _session;
            EXCEPTION WHEN undefined_object THEN
            END;
            IF _session IS NULL THEN
                SELECT session_user INTO _session;
            END IF;
            SELECT * INTO _file FROM file WHERE file.id = NEW.{{ name|n }};
            IF NOT (_file.timestamp+'1d' > 'now'::text::timestamp AND
                    _file.session = _session AND
                    _file.fresh IS TRUE) THEN
                RAISE EXCEPTION '{{ label }} cannot be set to ''%''', _file.handle;
            END IF;
            UPDATE file SET fresh = FALSE WHERE handle = _file.handle;
        END IF;
        RETURN NEW;
    END;
    """


