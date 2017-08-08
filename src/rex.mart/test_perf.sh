#!/bin/sh

rex sqlshell rex.mart_demo <<EOS
DO LANGUAGE plpgsql \$\$
DECLARE
    i_id integer;
    iv_id integer;
BEGIN
    TRUNCATE TABLE instrument CASCADE;

    INSERT INTO instrument (
        uid, code, title, status
    ) VALUES (
        'perf',
        'perf',
        'perf',
        'active'
    )
    RETURNING id INTO i_id;

    INSERT INTO instrumentversion (
        uid, instrument_id, version, published_by, date_published, definition
    ) VALUES (
        'perf1',
        i_id,
        1,
        'perf',
        NOW(),
        '{"id": "urn:calculation-complex", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_integer", "type": "integer"}, {"id": "q_float", "type": "float"}, {"id": "q_text", "type": "text"}, {"id": "q_boolean", "type": "boolean"}, {"id": "q_date", "type": "date"}, {"id": "q_time", "type": "time"}, {"id": "q_enumeration", "type": {"base": "enumeration", "enumerations": {"myenum": {"description": "MyEnum!"}, "other": {"description": "Other!"}}}}, {"id": "q_enumerationset", "type": {"base": "enumerationSet", "enumerations": {"black": {"description": "Black"}, "red": {"description": "Red"}, "white": {"description": "White"}}}}, {"id": "q_recordlist", "type": {"base": "recordList", "record": [{"id": "hello", "type": "text"}, {"id": "goodbye", "type": "text"}]}}, {"id": "q_matrix", "type": {"base": "matrix", "columns": [{"id": "column1", "type": "integer"}, {"id": "column2", "type": "text"}], "rows": [{"id": "row1"}, {"id": "row2"}]}}]}'
    )
    RETURNING id INTO iv_id;

    FOR i IN 1..10000 LOOP
        INSERT INTO assessment (
            uid, subject_id, instrumentversion_id, data, status
        ) VALUES (
            CONCAT('perf', i::TEXT),
            1,
            iv_id,
            '{"instrument": {"id": "urn:calculation-complex","version": "1.1"},"values": {"q_integer": {"value": 1},"q_float": {"value": 1.23},"q_text": {"value": "foobar"},"q_enumeration": {"value": "myenum"},"q_enumerationset": {"value": ["white", "black"]},"q_boolean": {"value": null},"q_date": {"value": "2014-05-22"},"q_time": {"value": "12:34:56"},"q_recordlist": {"value": [{"hello": {"value": "hi"},"goodbye": {"value": "see ya"}},{"hello": {"value": "yo"},"goodbye": {"value": "later"}}]},"q_matrix": {"value": {"row1": {"column1": {"value": 42},"column2": {"value": "hello"}},"row2": {"column1": {"value": 63},"column2": {"value": "goodbye"}}}}}}',
            'completed'
        );
    END LOOP;

END;
\$\$;

COMMIT;
EOS

time rex mart-create rex.mart_demo --definition all_assessments --owner test

#rex mart-purge rex.mart_demo --definition all_assessments --owner test --force-accept

