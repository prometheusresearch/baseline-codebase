#
# Copyright (c) 2014, Prometheus Research, LLC
#


from datetime import datetime

from rios.core.validation.instrument import TYPES_SIMPLE

from .interface import InstrumentVersion


__all__ = (
    'find_discrepancies',
    'solve_discrepancies',
)


def find_discrepancies(instrument_version, entries):
    """
    This function will examine the Assessment Data associated with a list of
    Entries and return a structure that describes the discrepancies between
    the responses.

    The returned structure looks like the following::

        {
            'simple_field_id': {
                'entry1_uid': 'value1',
                'entry2_uid': 'value1',
                'entry3_uid': 'value2'
            }

            'recordList_id': {
                '0': {
                    'field_id': {
                        'entry1_uid': 'value1',
                        'entry2_uid': 'value1',
                        'entry3_uid': 'value2'
                    }
                }
            }

            'matrix_id': [
                'row_id': {
                    'column_id': {
                        'entry1_uid': 'value1',
                        'entry2_uid': 'value1',
                        'entry3_uid': 'value2'
                    }
                }
            }
        }

    :param instrument_version:
        the InstrumentVersion containing the definition to use as a guide when
        analyzing the Assessment Data in the Entries
    :type instrument_version: InstrumentVersion
    :param entries: the Entries to examine
    :type entries: list of Entries
    :rtype: dict
    """

    discrepancies = {}
    known_types = InstrumentVersion.get_definition_type_catalog(
        instrument_version.definition,
    )

    for field in instrument_version.definition['record']:
        field_discrepancies = _get_field_discrepancies(
            field,
            entries,
            known_types,
        )
        if field_discrepancies:
            discrepancies[field['id']] = field_discrepancies

    return discrepancies


def _get_field_discrepancies(field, entries, known_types):
    if isinstance(field['type'], str):
        field_type = known_types[field['type']]
    else:
        field_type = known_types[field['type']['base']]

    args = (field, entries)

    if field_type in TYPES_SIMPLE:
        return _get_simple_discrepancies(*args)

    elif field_type == 'recordList':
        return _get_record_discrepancies(*args)

    elif field_type == 'matrix':
        return _get_matrix_discrepancies(*args)

    return None


def _default_get_accessor(entry, name):
    return entry.data['values'][name]['value']


def _get_simple_discrepancies(field, entries, accessor=None):
    if not accessor:
        accessor = _default_get_accessor

    values = dict([
        (entry.uid, accessor(entry, field['id']))
        for entry in entries
    ])

    unique_values = set([
        # lists aren't hashable, tuples are
        v if not isinstance(v, list) else tuple(sorted(v))
        for v in list(values.values())
    ])

    if len(unique_values) > 1:
        return values

    return {}


def _get_record_discrepancies(field, entries):
    discrepancies = {}

    num_records = max([
        len(entry.data['values'][field['id']]['value'] or [])
        for entry in entries
    ])

    def accessor(entry, name, record_index):
        records = entry.data['values'][field['id']]['value']
        if records and len(records) > record_index:
            return records[record_index][name]['value']
        return None

    for record_index in range(num_records):
        sri = str(record_index)
        needsValue = True
        for subfield in field['type']['record']:
            subfield_discrepancies = _get_simple_discrepancies(
                subfield,
                entries,
                accessor=lambda entry, name, idx=record_index: accessor(
                    entry,
                    name,
                    idx,
                ),
            )
            if subfield_discrepancies:
                if sri not in discrepancies:
                    discrepancies[sri] = {}
                discrepancies[sri][subfield['id']] = subfield_discrepancies
            elif accessor(entries[0], subfield['id'], record_index) is not None:
                needsValue = False
        if needsValue and sri in discrepancies:
            discrepancies[sri]['_NEEDS_VALUE_'] = True


    return discrepancies


def _get_matrix_discrepancies(field, entries):
    discrepancies = {}

    def accessor(entry, name, row_id):
        rows = entry.data['values'][field['id']]['value']
        return rows[row_id][name]['value'] if rows else None

    for row in field['type']['rows']:
        for column in field['type']['columns']:
            # pylint: disable=cell-var-from-loop
            cell_discrepancies = _get_simple_discrepancies(
                column,
                entries,
                accessor=lambda entry, name, idx=row['id']: accessor(
                    entry,
                    name,
                    idx,
                ),
            )
            if cell_discrepancies:
                if row['id'] not in discrepancies:
                    discrepancies[row['id']] = {}
                discrepancies[row['id']][column['id']] = cell_discrepancies

    return discrepancies


def solve_discrepancies(
        instrument_version,
        entries,
        reconciled_discrepancies=None):
    """
    This function will merge the Assessment Data of the specified Entries
    together into a consolidated Assessment, using the specified values to
    resolve situations where responses are different between Entries.

    The ``reconciled_discrepancies`` structure is expected to look similar to
    the following::

        {
            'simple_field_id': 'value1',

            'recordlist_id': {
                '0': {
                    'field_id': 'value2'
                }
            }

            'matrix_id': {
                'row_id': {
                    'column_id': 'value1'
                }
            }
        }

    :param instrument_version:
        the InstrumentVersion containing the definition to use as a guide when
        analyzing the Assessment Data in the Entries
    :type instrument_version: InstrumentVersion
    :param entries: the Entries to merge
    :type entries: list of Entries
    :param reconciled_discrepancies:
    :type reconciled_discrepancies: dict
    :returns: a complete Assessment Data structure
    """

    reconciled_discrepancies = reconciled_discrepancies or {}
    known_types = InstrumentVersion.get_definition_type_catalog(
        instrument_version.definition,
    )

    from .interface import Entry  # import here to avoid circular dependency
    solution = Entry.generate_empty_data(instrument_version)

    for field in instrument_version.definition['record']:
        solved = _solve_field_discrepancies(
            field,
            entries,
            reconciled_discrepancies.get(field['id']),
            known_types,
            has_override=(field['id'] in reconciled_discrepancies),
        )
        if solved is not None:
            solution['values'][field['id']] = solved

    meta = merge_metadata(entries)
    if meta:
        solution['meta'] = meta

    return solution


def merge_metadata(entries):
    meta = {}

    sources = [
        entry.data.get('meta', {})
        for entry in entries
    ]
    properties = [
        prop
        for source in sources
        for prop in source.keys()
    ]

    for prop in properties:
        values = []
        for source in sources:
            if prop in source:
                values.append(source[prop])

        if prop == 'application':
            # Merge all the tokens into one string.
            tokens = []
            for value in values:
                tokens.extend(value.split())
            if tokens:
                tokens = set(tokens)
                meta[prop] = ' '.join(sorted(tokens))

        elif prop == 'dateCompleted':
            # Take the latest date.
            dates = []
            for value in values:
                try:
                    parsed_date = datetime.strptime(value, '%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    pass
                else:
                    dates.append(parsed_date)
            if dates:
                dates = sorted(dates)
                meta[prop] = dates[-1].strftime('%Y-%m-%dT%H:%M:%S')

        elif prop == 'calculations':
            # Can't merge these; they'll be recalculated later anyway.
            continue

        else:
            # Just use the first one we found.
            meta[prop] = values[0]

    return meta


def _solve_field_discrepancies(
        field,
        entries,
        reconciled_discrepancy,
        known_types,
        has_override=False):
    if isinstance(field['type'], str):
        field_type = known_types[field['type']]
    else:
        field_type = known_types[field['type']['base']]

    args = (field, entries, reconciled_discrepancy)

    if field_type in TYPES_SIMPLE:
        return _solve_simple_discrepancy(*args, has_override=has_override)

    elif field_type == 'recordList':
        return _solve_record_discrepancy(*args)

    elif field_type == 'matrix':
        return _solve_matrix_discrepancy(*args)

    return None


def safe_empty(value):
    if value in ([], {}):
        return None
    return value


def _default_solve_accessor(entry, name):
    return entry.data['values'].get(name, {})


def _solve_simple_discrepancy(
        field,
        entries,
        reconciled_discrepancy,
        accessor=None,
        has_override=False):
    if not accessor:
        accessor = _default_solve_accessor

    solution = {}

    if has_override:
        solution['value'] = safe_empty(reconciled_discrepancy)
    else:
        for entry in entries:
            try:
                solution['value'] = accessor(entry, field['id'])['value']
            except KeyError:
                continue
            else:
                break
    if 'value' not in solution:
        # We couldn't find a value anywhere to use.
        solution['value'] = None

    def _merge_supporting_text(name):
        supported_entries = [
            accessor(entry, field['id']).get(name)
            for entry in entries
            if accessor(entry, field['id']).get(name)
        ]
        if len(supported_entries) == 0:
            return None
        elif len(supported_entries) == 1:
            return supported_entries[0]

        return '\n\n'.join([
            '%(date)s / %(user)s: %(text)s' % {
                'user': entry.modified_by,
                'date': entry.date_modified.strftime('%Y-%m-%d %H:%M:%S%z'),
                'text': accessor(entry, field['id'])[name],
            }
            for entry in entries
            if accessor(entry, field['id']).get(name)
        ])

    solution['explanation'] = _merge_supporting_text('explanation')
    solution['annotation'] = _merge_supporting_text('annotation')

    return solution


def _solve_record_discrepancy(field, entries, reconciled_discrepancy):
    solution = []
    reconciled_discrepancy = reconciled_discrepancy or {}

    num_records = max([
        len(entry.data['values'][field['id']]['value'] or [])
        for entry in entries
    ])

    def accessor(entry, name, record_index):
        records = entry.data['values'][field['id']]['value']
        if records and len(records) > record_index:
            return records[record_index][name]
        return {}

    for record_index in range(num_records):
        record_solution = {}
        sub_rec_disc = reconciled_discrepancy.get(str(record_index), {})
        for subfield in field['type']['record']:
            solved = _solve_simple_discrepancy(
                subfield,
                entries,
                sub_rec_disc.get(subfield['id']),
                accessor=lambda entry, name, idx=record_index: accessor(
                    entry,
                    name,
                    idx,
                ),
                has_override=(subfield['id'] in sub_rec_disc),
            )
            if solved is not None:
                record_solution[subfield['id']] = solved
        solution.append(record_solution)

    return {'value': solution or None}


def _solve_matrix_discrepancy(field, entries, reconciled_discrepancy):
    solution = {}
    reconciled_discrepancy = reconciled_discrepancy or {}

    def accessor(entry, name, row_id):
        rows = entry.data['values'][field['id']]['value']
        return rows[row_id][name] if rows else {}

    for row in field['type']['rows']:
        row_solution = {}
        sub_rec_disc = reconciled_discrepancy.get(row['id'], {})
        for column in field['type']['columns']:
            # pylint: disable=cell-var-from-loop
            solved = _solve_simple_discrepancy(
                column,
                entries,
                sub_rec_disc.get(column['id']),
                accessor=lambda entry, name, idx=row['id']: accessor(
                    entry,
                    name,
                    idx,
                ),
                has_override=(column['id'] in sub_rec_disc),
            )
            if solved is not None:
                row_solution[column['id']] = solved

        solution[row['id']] = row_solution

    return {'value': solution}

