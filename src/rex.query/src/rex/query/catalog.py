#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.deploy import label_to_title
from htsql.core.error import Error as HTSQLError
from htsql.core.model import HomeNode, TableArc, ColumnArc, ChainArc, SyntaxArc
from htsql.core.classify import classify, relabel, localize
from htsql.core.domain import (
        BooleanDomain, TextDomain, EnumDomain, RecordDomain, ListDomain,
        NullDomain, ContainerDomain, Profile, Product, Record)
from htsql.core.syn.syntax import VoidSyntax
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import (
        RootBinding, LiteralRecipe, ClosedRecipe, SubstitutionRecipe)
from htsql.core.tr.lookup import prescribe
from htsql.core.tr.decorate import decorate_void
from htsql_rex_deploy.classify import get_meta


def profile(tag, domain):
    empty_profile = decorate_void()
    attributes = empty_profile.attributes.copy()
    attributes['tag'] = tag
    attributes['header'] = tag
    attributes['domain'] = domain
    return Profile(**attributes)


def get_domain(entity_arc, field_arc):
    try:
        state = BindingState(RootBinding(VoidSyntax()))
        recipe = prescribe(entity_arc, state.scope)
        binding = state.use(recipe, state.scope.syntax)
        state.push_scope(binding)
        recipe = prescribe(field_arc, state.scope)
        if isinstance(recipe, ClosedRecipe) and \
                isinstance(recipe.recipe, SubstitutionRecipe) and \
                recipe.recipe.parameters:
            return None
        binding = state.use(recipe, state.scope.syntax)
        domain = binding.domain
    except HTSQLError:
        domain = None
    if isinstance(domain, (ContainerDomain, NullDomain)):
        domain = None
    return domain


def produce_catalog(ignore_entities=None):
    column_domain = RecordDomain([
            profile(u'type', TextDomain()),
            profile(u'enum', ListDomain(TextDomain()))])
    column_record = Record.make(
            u'column', [field.tag for field in column_domain.fields])
    link_domain = RecordDomain([
            profile(u'target', TextDomain()),
            profile(u'inverse', TextDomain())])
    link_record = Record.make(
            u'link', [field.tag for field in link_domain.fields])
    field_domain = RecordDomain([
            profile(u'label', TextDomain()),
            profile(u'title', TextDomain()),
            profile(u'public', BooleanDomain()),
            profile(u'partial', BooleanDomain()),
            profile(u'plural', BooleanDomain()),
            profile(u'kind', EnumDomain(
                [u'column', u'direct-link', u'indirect-link'])),
            profile(u'column', column_domain),
            profile(u'link', link_domain)])
    field_record = Record.make(
            u'field', [field.tag for field in field_domain.fields])
    entity_domain = RecordDomain([
            profile(u'name', TextDomain()),
            profile(u'label', TextDomain()),
            profile(u'field', ListDomain(field_domain)),
            profile(u'identity', ListDomain(TextDomain()))])
    entity_record = Record.make(
            u'entity', [field.tag for field in entity_domain.fields])
    meta = profile(u'entity', ListDomain(entity_domain))
    arcs = {None: []}
    arc_labels = {}
    seen = set()
    for label in classify(HomeNode()):
        entity_arc = label.arc
        if entity_arc in seen:
            continue
        seen.add(entity_arc)
        if not isinstance(entity_arc, TableArc):
            continue
        arcs[None].append(entity_arc)
        labels = relabel(entity_arc)
        arc_labels[entity_arc] = labels[0]
        origin = entity_arc.target
        arcs[origin] = []
        for label in classify(origin):
            field_arc = label.arc
            if field_arc in seen:
                continue
            seen.add(field_arc)
            if not isinstance(field_arc, (ColumnArc, ChainArc, SyntaxArc)):
                continue
            arcs[origin].append(field_arc)
            labels = relabel(field_arc)
            arc_labels[field_arc] = labels[0]
    data = []
    ignore_entities = ignore_entities or []
    for entity_arc in arcs[None]:
        entity_label = arc_labels[entity_arc].name
        if entity_label in ignore_entities:
            continue
        entity_meta = get_meta(entity_arc.table)
        entity_title = entity_meta.title or label_to_title(entity_label)
        field_data = []
        for field_arc in arcs[entity_arc.target]:
            field_label = arc_labels[field_arc].name
            field_public = arc_labels[field_arc].is_public
            field_partial = not (field_arc.is_expanding)
            field_plural = not (field_arc.is_contracting)
            field_title = label_to_title(field_label)
            field_kind = None
            field_column = None
            field_link = None
            if isinstance(field_arc, ColumnArc):
                field_meta = get_meta(field_arc.column)
                field_title = field_meta.title or field_title
                field_kind = u'column'
                field_domain = field_arc.column.domain
                field_type = unicode(field_domain.__class__.__name__.lower())
                if field_type.endswith(u'domain'):
                    field_type = field_type[:-6]
                field_enum = []
                if isinstance(field_domain, EnumDomain):
                    field_enum = field_domain.labels
                field_column = column_record((field_type, field_enum))
            elif isinstance(field_arc, ChainArc):
                field_kind = u'indirect-link'
                if len(field_arc.joins) == 1:
                    join = field_arc.joins[0]
                    if join.is_direct and len(join.origin_columns) == 1:
                        field_meta = get_meta(join.origin_columns[0])
                        field_title = field_meta.title or field_title
                        field_kind = u'direct-link'
                target_arc = TableArc(field_arc.target.table)
                inverse_arc = field_arc.reverse()
                link_target = arc_labels[target_arc].name
                link_inverse = None
                if inverse_arc in arc_labels:
                    link_inverse = arc_labels[inverse_arc].name
                if link_target in ignore_entities \
                        or link_inverse in ignore_entities:
                    continue
                field_link = link_record((link_target, link_inverse))
            else:
                field_domain = get_domain(entity_arc, field_arc)
                if field_domain is None:
                    continue
                field_plural = False
                field_kind = u'column'
                field_type = unicode(field_domain.__class__.__name__.lower())
                if field_type.endswith(u'domain'):
                    field_type = field_type[:-6]
                field_enum = []
                if isinstance(field_domain, EnumDomain):
                    field_enum = field_domain.labels
                field_column = column_record((field_type, field_enum))
            field = field_record((
                    field_label, field_title, field_public, field_partial,
                    field_plural, field_kind, field_column, field_link))
            field_data.append(field)
        entity_identity = []
        identity_arcs = localize(entity_arc.target)
        if identity_arcs is not None:
            entity_identity = [arc_labels[arc].name for arc in identity_arcs]
        entity = entity_record((
                entity_label, entity_title, field_data, entity_identity))
        data.append(entity)
    return Product(meta, data)


