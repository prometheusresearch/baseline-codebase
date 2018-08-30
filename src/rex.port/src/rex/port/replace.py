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

    def __bool__(self):
        return False

    def __repr__(self):
        return "MISSING"


# Singleton to indicate that the value was not given.
MISSING = Missing()


Pair = collections.namedtuple('Pair', 'old new')


class Reference(object):
    # A path in the data tree.

    @staticmethod
    def normalize(path):
        for item in path:
            if isinstance(item, tuple):
                name, index = item
                yield name
                if index is not None:
                    yield str(index)
            else:
                yield item

    def __init__(self, path):
        # `[(name, index or None)]`
        self.path = tuple(self.normalize(path))

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
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except ValueError as exc:
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
            isinstance(data, str) and
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
        return tuple(adapt(offshot, None) for offshot in list(arm.values()))

    if isinstance(data, Value):
        # Accept a `Product` instance.
        data = data.data

    if isinstance(data, list):
        # When the root contains a single trunk table, accept a list
        # records assuming they belong to the table.
        trunks = [name for name, offshot in list(arm.items())
                       if isinstance(offshot, TrunkArm)]
        if len(trunks) == 1:
            [name] = trunks
            data = { name: data }
    if isinstance(data, dict):
        # Accept a dictionary with field values.
        return tuple(adapt(offshot, data[name]) if name in data else MISSING
                     for name, offshot in list(arm.items()))

    if isinstance(data, tuple) and len(data) == len(arm):
        # Accept a tuple with field values.
        return tuple(adapt(offshot, item)
                     for offshot, item in zip(list(arm.values()), data))

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
                  for name, offshot in list(arm.items())]
    elif isinstance(data, tuple) and len(data) == len(arm)+1:
        # Accept a tuple `(id, field1, field2, ...)`.
        [identity] = clarify(arm.domain, embed([data[0]]))
        fields = [adapt(offshot, item)
                  for offshot, item in zip(list(arm.values()), data[1:])]
    else:
        raise Error("Got ill-formed input:", repr(data))
    return (identity,)+tuple(fields)


def flatten(arm, data, path=(), parent_identity=None):
    # Extracts a list of cells from the given arm data.
    cells = []

    identity = None
    if isinstance(arm, TableArm) and data:
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

    # Prepare a mapping path -> cells.
    cell_map = collections.OrderedDict()
    if isinstance(arm, TableArm):
        schema_path = tuple([name for name, index in path])
        cell_map[schema_path] = cells

    # Allow processing when there is no data for the arm.
    if not data:
        data = [MISSING]*len(arm)

    # Process nested arms.
    nested_maps = []
    for (name, offshot), item in zip(list(arm.items()), data):
        if not isinstance(offshot, TableArm):
            continue
        if item and offshot.is_plural:
            for index, offshot_data in enumerate(item):
                nested_map = flatten(offshot, offshot_data,
                                     path+((name, index),), identity)
                nested_maps.append(nested_map)
        else:
            nested_map = flatten(offshot, item, path+((name, None),), identity)
            nested_maps.append(nested_map)

    # Merge data for nested arms and return the result.
    for nested_map in nested_maps:
        for schema_path in nested_map:
            if schema_path in cell_map:
                cell_map[schema_path].extend(nested_map[schema_path])
            else:
                cell_map[schema_path] = nested_map[schema_path]
    return cell_map


def match(old_map, new_map):
    # Merges `{path: [old_cell]}` and `{path: [new_cell]}` into
    # mapping `{path: [(old_cell, new_cell)]}`.
    pair_map = collections.OrderedDict()

    for schema_path in old_map:
        old_cells = old_map[schema_path]
        new_cells = new_map[schema_path]
        pairs = []
        old_by_key = {}
        new_by_key = {}
        for cell in old_cells:
            if not cell.identity:
                raise Error("Got record without identity:", cell)
            if cell.key in old_by_key:
                raise Error("Got duplicate record:", old_by_key[cell.key]) \
                        .wrap("And:", cell)
            old_by_key[cell.key] = cell
        for cell in new_cells:
            if not cell.identity:
                continue
            if cell.key in new_by_key:
                raise Error("Got duplicate record:", new_by_key[cell.key]) \
                        .wrap("And:", cell)
            new_by_key[cell.key] = cell
        for cell in old_cells:
            if cell.key not in new_by_key:
                pairs.append(Pair(cell, None))
        for cell in new_cells:
            if cell.identity:
                if cell.key not in old_by_key:
                    old_cell = Cell(cell.node, cell.reference, cell.identity,
                                    [MISSING]*len(cell))
                else:
                    old_cell = old_by_key[cell.key]
                pairs.append(Pair(old_cell, cell))
        for cell in new_cells:
            if not cell.identity:
                pairs.append(Pair(None, cell))
        pair_map[schema_path] = pairs

    return pair_map


def refetch(tree, identity_map, constraints):
    # Fetch the subset of the port data within the given identity set.
    constraints = constraints.constraints[:]
    for path, arm in tree.walk(TableArm):
        if not arm.is_plural:
            continue
        arguments = []
        for argument in identity_map[path]:
            if isinstance(argument, Pair):
                argument = argument.old
            if isinstance(argument, Cell):
                argument = argument.identity
            argument = Value(arm.domain, argument)
            arguments.append(argument)
        constraint = Constraint(path, None, arguments)
        constraints.append(constraint)
    constraints = ConstraintSet(0, constraints)
    return produce(tree, constraints)


def recover(pair_map, actual_map):
    # Validates the old subset against the database data.

    recovered_map = collections.OrderedDict()

    for schema_path in pair_map:
        pairs = pair_map[schema_path]
        actuals = actual_map[schema_path]
        actual_by_key = dict([(actual.key, actual) for actual in actuals])

        recovered_pairs = []
        recovered_map[schema_path] = recovered_pairs

        for pair in pairs:
            cell = pair.old
            if cell is None:
                recovered_pairs.append(pair)
                continue

            if cell.key not in actual_by_key:
                raise Error("Got a missing record:", cell)
            recovered_fields = actual_by_key[cell.key].fields
            for field, recovered_field in zip(cell.fields, recovered_fields):
                if field is not MISSING and field != recovered_field:
                    raise Error("Got a modified record:", cell)
            cell = Cell(cell.node, cell.reference, cell.identity,
                        recovered_fields)
            recovered_pair = Pair(cell, pair.new)
            recovered_pairs.append(recovered_pair)

    return recovered_map


def patch(pair_map, command_cache):
    # Updates the database.
    identity_map = collections.OrderedDict()

    reference_to_identity = {}
    for schema_path in pair_map:
        pairs = pair_map[schema_path]
        identities = []
        identity_map[schema_path] = identities

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
                new_identity = insert(node, arcs, new_fields, command_cache)
            elif new_fields is None:
                delete(node, identity, command_cache)
                new_identity = None
            else:
                new_identity = update(
                        node, arcs, identity, new_fields, command_cache)
            if new_identity is not None:
                reference_to_identity[new_cell.reference] = new_identity
                identity_cell = Cell(new_cell.node, new_cell.reference,
                                     new_identity, None)
                identities.append(identity_cell)
    return identity_map


def insert(node, arcs, fields, command_cache):
    # Inserts a record.
    cache_key = (insert, node, tuple(arcs))
    try:
        command = command_cache[cache_key]
    except KeyError:
        extract_table = BuildExtractTable.__invoke__(
                node, arcs)
        execute_insert = BuildExecuteInsert.__invoke__(
                extract_table.table, extract_table.columns)
        resolve_identity = BuildResolveIdentity.__invoke__(
                execute_insert.table, execute_insert.output_columns,
                is_list=False)
        command = command_cache[cache_key] = (
                lambda fields:
                    resolve_identity(execute_insert(extract_table(fields))))
    return command(fields)


def update(node, arcs, identity, fields, command_cache):
    # Updates a record.
    cache_key = (update, node, tuple(arcs))
    try:
        command = command_cache[cache_key]
    except KeyError:
        resolve_key = BuildResolveKey.__invoke__(
                node, arcs)
        extract_table = BuildExtractTable.__invoke__(
                node, arcs)
        execute_update = BuildExecuteUpdate.__invoke__(
                extract_table.table, extract_table.columns)
        resolve_identity = BuildResolveIdentity.__invoke__(
                execute_update.table, execute_update.output_columns,
                is_list=False)
        command = command_cache[cache_key] = (
                lambda identity, fields:
                    resolve_identity(
                        execute_update(
                            resolve_key(identity),
                            extract_table(fields))))
    return command(identity, fields)


def delete(node, identity, command_cache):
    # Deletes a record.
    cache_key = (delete, node)
    try:
        command = command_cache[cache_key]
    except KeyError:
        resolve_key = BuildResolveKey.__invoke__(
                node, [])
        execute_delete = BuildExecuteDelete.__invoke__(
                node.table)
        command = command_cache[cache_key] = (
                lambda identity:
                    execute_delete(resolve_key(identity)))
    return command(identity)


def verify(identity_map, actual_map):
    # Verifies that all modified records are in the output data.

    for schema_path in identity_map:
        cells = identity_map[schema_path]
        actuals = actual_map[schema_path]
        identities = set([actual.identity for actual in actuals])
        for cell in cells:
            if cell.identity not in identities:
                raise Error("Failed to fetch:", cell)


def replace(tree, old, new, constraints, command_cache):
    # Replaces the `old` subset of the database with `new` data.

    # Parse JSON if necessary.
    old = load(old)
    new = load(new)

    # Recover canonical product data structure.
    old = adapt(tree, old)
    new = adapt(tree, new)

    # Convert to a mapping `{path: [cell]}`.
    old_map = flatten(tree, old)
    new_map = flatten(tree, new)

    # Convert to a mapping `{path: [(old_cell, new_cell)]}`.
    pair_map = match(old_map, new_map)

    # Extract the actual data subset from the database and
    # compare it with the `old` subset.
    product = refetch(tree, pair_map, constraints)
    actual_map = flatten(tree, product.data)
    pair_map = recover(pair_map, actual_map)

    # Apply the changes, receive the identities of the affected records.
    identity_map = patch(pair_map, command_cache)

    # Extract this data subset again and verify that all the modified
    # records are within it.
    product = refetch(tree, identity_map, constraints)
    actual_map = flatten(tree, product.data)
    verify(identity_map, actual_map)

    return product


