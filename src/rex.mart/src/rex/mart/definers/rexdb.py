#
# Copyright (c) 2017, Prometheus Research, LLC
#

from ..connections import get_management_db
from .base import Definer


__all__ = (
    'RexdbDefiner',
)


HTSQL_GET_CONFIGS = '''
/rexmart_dynamic_assessment{
        name,
        /rexmart_dynamic_assessment_instrument{
                name,
            } :as instruments,
        selector,
        parental_relationship,
        /rexmart_dynamic_assessment_parent{
                name,
            }
            .sort(
                name
            ) :as parents,
        identifiable,
        include_fields,
        /rexmart_dynamic_assessment_instrument_field{
                name,
            } :as fields,
        include_calculations,
        /rexmart_dynamic_assessment_calculation_field{
                name,
            } :as calculations,
        /rexmart_dynamic_assessment_meta_field{
                name,
                type,
            } :as metas,
        /rexmart_dynamic_assessment_calculation{
                name,
                type,
                expression,
            } :as post_load_calculations,
    }
    .filter(
        definition=$definition
        & status='enabled'
    )
    .sort(
        sequence
    )
'''


class RexdbDefiner(Definer):
    """
    An implementation of Definer that retrieves configurations from tables
    stored in the main RexDB application database.
    """

    #:
    name = 'rexdb'

    def assessments(self, definition, **options):
        configurations = get_management_db().produce(
            HTSQL_GET_CONFIGS,
            definition=definition,
        )

        definitions = []
        for cfg in configurations:
            defn = {
                'name': cfg.name,
                'instrument': [
                    inst.name
                    for inst in cfg.instruments
                ],
                'selector': cfg.selector,
                'parental_relationship': {
                    'type': cfg.parental_relationship,
                },
                'identifiable': cfg.identifiable,
                'meta': [
                    {meta.name: meta.type}
                    for meta in cfg.metas
                ],
                'post_load_calculations': [
                    {
                        'name': calc.name,
                        'type': calc.type,
                        'expression': calc.expression,
                    }
                    for calc in cfg.post_load_calculations
                ],
            }

            if cfg.parental_relationship != 'trunk':
                defn['parental_relationship']['parent'] = [
                    parent.name
                    for parent in cfg.parents
                ]

            if not cfg.include_fields:
                defn['fields'] = None
            elif cfg.fields:
                defn['fields'] = [
                    field.name
                    for field in cfg.fields
                ]

            if not cfg.include_calculations:
                defn['calculations'] = None
            elif cfg.calculations:
                defn['calculations'] = [
                    calc.name
                    for calc in cfg.calculations
                ]

            definitions.append(defn)

        return definitions

