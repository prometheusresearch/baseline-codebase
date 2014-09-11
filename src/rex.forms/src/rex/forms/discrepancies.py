from rex.instrument.interface import InstrumentVersion
from rex.instrument.schema import INSTRUMENT_SIMPLE_TYPES


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
    if isinstance(field['type'], basestring):
        field_type = known_types[field['type']]
    else:
        field_type = known_types[field['type']['base']]

    args = (field, entries)

    if field_type in INSTRUMENT_SIMPLE_TYPES:
        return _get_simple_discrepancies(*args)

    elif field_type == 'recordList':
        return _get_record_discrepancies(*args)

    elif field_type == 'matrix':
        return _get_matrix_discrepancies(*args)

    return None


def _get_simple_discrepancies(field, entries, accessor=None):
    if not accessor:
        accessor = lambda entry, name: entry.data['values'][name]['value']

    values = dict([
        (entry.uid, accessor(entry, field['id']))
        for entry in entries
    ])

    unique_values = set([
        v if not isinstance(v, list) else tuple(v)  # lists aren't hashable, tuples are
        for v in values.values()
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

    # pylint: disable=W0640
    for record_index in range(num_records):
        for subfield in field['type']['record']:
            subfield_discrepancies = _get_simple_discrepancies(
                subfield,
                entries,
                accessor=lambda entry, name: accessor(
                    entry,
                    name,
                    record_index,
                ),
            )
            if subfield_discrepancies:
                sri = str(record_index)
                if sri not in discrepancies:
                    discrepancies[sri] = {}
                discrepancies[sri][subfield['id']] = subfield_discrepancies

    return discrepancies


def _get_matrix_discrepancies(field, entries):
    discrepancies = {}

    def accessor(entry, name, row_id):
        rows = entry.data['values'][field['id']]['value']
        return rows[row_id][name]['value']

    # pylint: disable=W0640
    for row in field['type']['rows']:
        for column in field['type']['columns']:
            cell_discrepancies = _get_simple_discrepancies(
                column,
                entries,
                accessor=lambda entry, name: accessor(entry, name, row['id']),
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

    return solution


def _solve_field_discrepancies(
        field,
        entries,
        reconciled_discrepancy,
        known_types,
        has_override=False):
    if isinstance(field['type'], basestring):
        field_type = known_types[field['type']]
    else:
        field_type = known_types[field['type']['base']]

    args = (field, entries, reconciled_discrepancy)

    if field_type in INSTRUMENT_SIMPLE_TYPES:
        return _solve_simple_discrepancy(*args, has_override=has_override)

    elif field_type == 'recordList':
        return _solve_record_discrepancy(*args)

    elif field_type == 'matrix':
        return _solve_matrix_discrepancy(*args)

    return None


def _solve_simple_discrepancy(
        field,
        entries,
        reconciled_discrepancy,
        accessor=None,
        has_override=False):
    if not accessor:
        accessor = lambda entry, name: entry.data['values'].get(name, {})

    solution = {}

    if has_override:
        solution['value'] = reconciled_discrepancy
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
        return None

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
            u'%(date)s / %(user)s: %(text)s' % {
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

    # pylint: disable=W0640
    for record_index in range(num_records):
        record_solution = {}
        sub_rec_disc = reconciled_discrepancy.get(str(record_index), {})
        for subfield in field['type']['record']:
            solved = _solve_simple_discrepancy(
                subfield,
                entries,
                sub_rec_disc.get(subfield['id']),
                accessor=lambda entry, name: accessor(
                    entry,
                    name,
                    record_index,
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
        return entry.data['values'][field['id']]['value'][row_id][name]

    # pylint: disable=W0640
    for row in field['type']['rows']:
        row_solution = {}
        sub_rec_disc = reconciled_discrepancy.get(row['id'], {})
        for column in field['type']['columns']:
            solved = _solve_simple_discrepancy(
                column,
                entries,
                sub_rec_disc.get(column['id']),
                accessor=lambda entry, name: accessor(entry, name, row['id']),
                has_override=(column['id'] in sub_rec_disc),
            )
            if solved is not None:
                row_solution[column['id']] = solved

        solution[row['id']] = row_solution

    return {'value': solution}

