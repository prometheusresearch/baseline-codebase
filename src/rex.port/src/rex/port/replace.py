#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error
from .arm import RootArm, TableArm, TrunkArm, ColumnArm, LinkArm, identify
from .constraint import Constraint, ConstraintSet
from .condition import embed, clarify
from .produce import describe, produce
from htsql.core.domain import Value
from htsql.core.model import ColumnArc, ChainArc
from htsql.core.classify import classify
from htsql.tweak.etl.cmd.insert import (Clarify, BuildExtractTable,
        BuildExecuteInsert, BuildResolveIdentity)
from htsql.tweak.etl.cmd.merge import BuildResolveKey, BuildExecuteUpdate
from htsql.tweak.etl.cmd.delete import BuildExecuteDelete
import collections
import json


def scalars(node):
    # Returns all column and link arcs from a table node.
    if isinstance(node, TableArm):
        node = node.node
    for label in classify(node):
        arc = label.arc
        if isinstance(arc, ColumnArc):
            if arc.link is not None:
                yield arc.link
            else:
                yield arc
        elif (isinstance(arc, ChainArc) and
                len(arc.joins) == 1 and arc.joins[0].is_direct):
            yield arc


class Missing(object):
    # The value was not provided.

    def __nonzero__(self):
        return False

    def __repr__(self):
        return "MISSING"


# Singleton to indicate that the value was not given.
MISSING = Missing()


class Reference(object):
    # A parsed JSON Reference object.

    def __init__(self, path):
        self.path = tuple(path)

    def __str__(self):
        return "#"+"".join("/"+segment for segment in self.path)

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.path)

    def __hash__(self):
        return hash(self.path)

    def __eq__(self, other):
        return (isinstance(other, Reference) and self.path == other.path)

    def __ne__(self, other):
        return not (self == other)


class Cell(object):
    # Encapsulates a record from a JSON data.

    def __init__(self, node, reference, identity, fields):
        # Table node.
        self.node = node
        # Location of the record in JSON data.
        self.reference = reference
        # The `id()` value.
        self.identity = identity
        # Values for columns and links.
        self.fields = fields
        self.key = (node, identity)

    def __iter__(self):
        return iter(self.fields)

    def __getitem__(self, key):
        return self.fields[key]

    def __len__(self):
        return len(self.fields)

    def __str__(self):
        return str(self.reference)

    def __repr__(self):
        return "%s(%r, %r, %r, %r)" \
                % (self.__class__.__name__,
                   self.node, self.reference, self.identity, self.fields)


def load(data):
    # Parses JSON.
    if isinstance(data, (str, unicode)):
        try:
            data = json.loads(data)
        except ValueError, exc:
            raise Error("Got ill-formed JSON:", exc)
    return data


def adapt(arm, data):
    # Normalizes the input data.
    if isinstance(arm, RootArm):
        # Produce a tuple of values, each item represents a nested arm.
        return adapt_root(arm, data)
    elif isinstance(arm, TableArm):
        # For singular tables, return a tuple `(id, field1, field2, ...)`.
        # For plural tables, return a list of tuples.
        if arm.is_plural:
            if data is None:
                return []
            elif isinstance(data, list):
                return [adapt_table(arm, item) for item in data]
            else:
                return [adapt_table(arm, data)]
        else:
            return adapt_table(arm, data)
    elif (isinstance(arm, LinkArm) and
            isinstance(data, (str, unicode)) and
            data.startswith('#/')):
        # For link values of the form `#/path/to/node`, return
        # a `Reference` instance.
        path = data[2:].split('/')
        return Reference(path)
    elif isinstance(arm, (ColumnArm, LinkArm)):
        # For columns and links, make sure the value matches the domain
        # and return a `Value` instance.
        [data] = embed([data])
        [data] = clarify(arm.domain, [data])
        return data
    else:
        # Calculated fields and other values are ignored.
        return MISSING


def adapt_root(arm, data):
    # Normalizes input data for a root arm.

    if data is None:
        # `None` is a shortcut for empty input.
        return tuple(adapt(offshot, None) for offshot in arm.values())

    if isinstance(data, Value):
        # Accept a `Product` instance.
        data = data.data

    if isinstance(data, list):
        # When the root contains a single trunk table, accept a list
        # records assuming they belong to the table.
        trunks = [name for name, offshot in arm.items()
                       if isinstance(offshot, TrunkArm)]
        if len(trunks) == 1:
            [name] = trunks
            data = { name: data }
    if isinstance(data, dict):
        # Accept a dictionary with field values.
        return tuple(adapt(offshot, data[name]) if name in data else MISSING
                     for name, offshot in arm.items())

    if isinstance(data, tuple) and len(data) == len(arm):
        # Accept a tuple with field values.
        return tuple(adapt(offshot, item)
                     for offshot, item in zip(arm.values(), data))

    raise Error("Got ill-formed input:", repr(data))


def adapt_table(arm, data):
    # Normalizes a table record.

    if data is None:
        # `None` means no record.
        return None

    # The `id` field.
    identity = MISSING
    # Arm values.
    record = []
    if isinstance(data, dict):
        # Accept a dictionary with field data.
        if 'id' in data:
            [identity] = clarify(arm.domain, embed([data['id']]))
        fields = [adapt(offshot, data[name]) if name in data else MISSING
                  for name, offshot in arm.items()]
    elif isinstance(data, tuple) and len(data) == len(arm)+1:
        # Accept a tuple `(id, field1, field2, ...)`.
        [identity] = clarify(arm.domain, embed([data[0]]))
        fields = [adapt(offshot, item)
                  for offshot, item in zip(arm.values(), data[1:])]
    else:
        raise Error("Got ill-formed input:", repr(data))
    return (identity,)+tuple(fields)


def flatten(path, arm, data, parent_identity=None):
    # Extracts a list of cells from the given arm data.
    cells = []

    identity = None
    if isinstance(arm, TableArm):
        # Extract a cell from a table record.
        reference = Reference(path)
        identity = data[0]
        fields = []
        index_by_arc = dict((offshot.arc, index+1)
                            for index, offshot in enumerate(arm.values()))
        # For branches and facets, the value of the link to the parent arm.
        parent_arc = parent_field = None
        if not isinstance(arm, TrunkArm):
            parent_arc = arm.arc.reverse()
            if parent_identity:
                parent_field = parent_identity
            elif arm.is_plural:
                parent_field = Reference(path[:-2])
            else:
                parent_field = Reference(path[:-1])
        for arc in scalars(arm):
            if arc == parent_arc:
                field = parent_field
            elif arc in index_by_arc:
                index = index_by_arc[arc]
                field = data[index]
            else:
                field = MISSING
            fields.append(field)
        cells.append(Cell(arm.node, reference, identity, fields))
        data = data[1:]
    # Process nested arms.
    for (name, offshot), item in zip(arm.items(), data):
        if not isinstance(offshot, TableArm):
            continue
        if not item:
            continue
        if offshot.is_plural:
            for index, offshot_data in enumerate(item):
                cells.extend(flatten(path+(name, str(index)),
                                     offshot, offshot_data, identity))
        else:
            cells.extend(flatten(path+(name,), offshot, item, identity))
    return cells


def match(old, new):
    # Generates a list of cell pairs.
    pairs = []
    old_map = {}
    new_map = {}
    for cell in old:
        if not cell.identity:
            raise Error("Got record without identity:", cell)
        if cell.key in old_map:
            raise Error("Got duplicate record:", old_map[cell.key]) \
                    .wrap("And:", cell)
        old_map[cell.key] = cell
    for cell in new:
        if not cell.identity:
            continue
        if cell.key in new_map:
            raise Error("Got duplicate record:", new_map[cell.key]) \
                    .wrap("And:", cell)
        new_map[cell.key] = cell
    for cell in old:
        if cell.key not in new_map:
            pairs.append((cell, None))
    for cell in new:
        if cell.identity:
            if cell.key not in old_map:
                old_map[cell.key] = Cell(cell.node, cell.reference,
                                         cell.identity, [MISSING]*len(cell))
            pairs.append((old_map[cell.key], cell))
    for cell in new:
        if not cell.identity:
            pairs.append((None, cell))
    return pairs


def recover(pairs):
    # Validates the cell data against the database.

    # Mapping: `node -> [identity, ...]` generated from old cells.
    nodes = collections.OrderedDict()
    for cell, new_cell in pairs:
        if cell is None:
            continue
        if cell.node not in nodes:
            nodes[cell.node] = []
        nodes[cell.node].append(cell.identity)
    # Shallow port tree corresponding to existing cell nodes.
    table_arms = []
    # Respective constraints with cell identities.
    constraints = []
    for table_index, (node, identities) in enumerate(nodes.items()):
        domain = identify(node)
        identities = [Value(domain, identity) for identity in identities]
        field_arms = []
        for field_index, arc in enumerate(scalars(node)):
            if isinstance(arc, ChainArc) and len(arc.joins) == 1:
                field_arm = LinkArm(arc.joins[0])
            else:
                field_arm = ColumnArm(arc.column)
            field_name = u'_'+unicode(field_index)
            field_arms.append((field_name, field_arm))
        table_arm = TrunkArm(node.table, field_arms, None, [])
        table_name = u'_'+unicode(table_index)
        table_arms.append((table_name, table_arm))
        constraints.append(Constraint((table_name,), None, identities))
    tree = RootArm(table_arms)
    constraints = ConstraintSet(0, constraints)
    # Extract the data from the database.
    product = produce(tree, constraints)
    recovered_fields = {}
    for node, records in zip(nodes, product.data):
        for record in records:
            key = (node, record[0])
            recovered_fields[key] = record[1:]
    # Validate existing and recover missing data.
    recovered_pairs = []
    for cell, new_cell in pairs:
        if cell is not None:
            if cell.key not in recovered_fields:
                raise Error("Got a missing record:", cell)
            fields = recovered_fields[cell.key]
            for field, recovered_field in zip(cell.fields, fields):
                if field is not MISSING and field != recovered_field:
                    raise Error("Got a modified record:", cell)
            cell = Cell(cell.node, cell.reference, cell.identity, fields)
        recovered_pairs.append((cell, new_cell))
    return recovered_pairs


def patch(pairs):
    # Updates the database.
    changes = {}
    reference_to_identity = {}
    for old_cell, new_cell in pairs:
        node = old_cell.node if old_cell is not None else new_cell.node
        if old_cell is None:
            identity = None
            old_fields = None
            new_fields = new_cell.fields
        elif new_cell is None:
            identity = old_cell.identity
            old_fields = old_cell.fields
            new_fields = None
        else:
            identity = old_cell.identity
            old_fields = old_cell.fields
            new_fields = new_cell.fields
        if new_fields is not None:
            resolved_fields = []
            for field in new_fields:
                if isinstance(field, Reference):
                    if field not in reference_to_identity:
                        raise Error("Got unknown reference:", field)
                    field = reference_to_identity[field]
                resolved_fields.append(field)
            new_fields = resolved_fields
            if old_fields is not None:
                new_fields = [new_field
                                    if new_field != old_field else MISSING
                              for old_field, new_field
                                    in zip(old_fields, new_fields)]
            arcs = []
            trimmed_fields = []
            for arc, field in zip(scalars(node), new_fields):
                if field is not MISSING:
                    arcs.append(arc)
                    trimmed_fields.append(field)
            new_fields = trimmed_fields
        if old_fields is None:
            new_identity = insert(node, arcs, new_fields)
        elif new_fields is None:
            delete(node, identity)
            new_identity = None
        else:
            new_identity = update(node, arcs, identity, new_fields)
        if new_identity is not None:
            reference_to_identity[new_cell.reference] = new_identity
            changes.setdefault(node, []).append(new_identity)
    return changes


def insert(node, arcs, fields):
    # Inserts a record.
    extract_table = BuildExtractTable.__invoke__(
            node, arcs)
    execute_insert = BuildExecuteInsert.__invoke__(
            extract_table.table, extract_table.columns)
    resolve_identity = BuildResolveIdentity.__invoke__(
            execute_insert.table, execute_insert.output_columns,
            is_list=False)
    row = resolve_identity(
            execute_insert(
                extract_table(
                    fields)))
    return row


def update(node, arcs, identity, fields):
    # Updates a record.
    resolve_key = BuildResolveKey.__invoke__(
            node, arcs)
    extract_table = BuildExtractTable.__invoke__(
            node, arcs)
    execute_update = BuildExecuteUpdate.__invoke__(
            extract_table.table, extract_table.columns)
    resolve_identity = BuildResolveIdentity.__invoke__(
            execute_update.table, execute_update.output_columns,
            is_list=False)
    row = resolve_identity(
            execute_update(
                resolve_key(identity),
                extract_table(
                    fields)))
    return row


def delete(node, identity):
    # Deletes a record.
    resolve_key = BuildResolveKey.__invoke__(
            node, [])
    execute_delete = BuildExecuteDelete.__invoke__(
            node.table)
    execute_delete(
            resolve_key(
                identity))


def restrict(path, arm, changes):
    # Generates a set of constraints from the set of affected identities.
    constraints = []
    if isinstance(arm, TableArm) and arm.is_plural:
        arguments = [Value(arm.domain, value)
                     for value in changes.get(arm.node, [])]
        constraints.append(Constraint(path, None, arguments))
    for name, offshot in arm.arms.items():
        constraints.extend(restrict(path+(name,), offshot, changes))
    if isinstance(arm, RootArm):
        constraints = ConstraintSet(0, constraints)
    return constraints


def replace(tree, old, new):
    # Replaces the `old` subset of the database with `new` data.
    old = load(old)
    new = load(new)
    old = adapt(tree, old)
    new = adapt(tree, new)
    old = flatten((), tree, old)
    new = flatten((), tree, new)
    pairs = match(old, new)
    pairs = recover(pairs)
    changes = patch(pairs)
    constraints = restrict((), tree, changes)
    return produce(tree, constraints)


