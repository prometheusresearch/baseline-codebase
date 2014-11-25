
CREATE OR REPLACE FUNCTION measure__last_modified__proc() RETURNS trigger
LANGUAGE plpgsql
AS $_$
    BEGIN
        IF NEW.last_modified IS NULL THEN
            NEW.last_modified := 'now'::text::timestamp;
        END IF;
        RETURN NEW;
    END;
$_$;

COMMENT ON FUNCTION measure__last_modified__proc()
IS 'revision: 2014-10-14';

DROP TRIGGER IF EXISTS measure__last_modified__proc ON measure;

CREATE TRIGGER measure__last_modified__proc BEFORE UPDATE ON measure
FOR EACH ROW EXECUTE PROCEDURE measure__last_modified__proc();

