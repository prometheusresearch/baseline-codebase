#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.port import Port
from rex.port.replace import adapt, flatten, match, patch
from rex.instrument import Assessment

from .tables import PrimaryTable


__all__ = (
    'AssessmentLoader',
)


class AssessmentLoader(object):
    def __init__(self, definition, database, parameters=None):
        self.definition = definition
        self.parameters = parameters or {}
        self.mapping = PrimaryTable(
            self.definition,
            database,
            selector_parameters=self.get_selector_params(),
        )

    def get_deploy_facts(self):
        return self.mapping.get_deploy_facts()

    def get_selector_params(self):
        params = {}
        params.update(self.definition['selector']['parameters'])
        params.update(self.parameters)
        params['INSTRUMENT'] = self.definition['instrument']
        return params

    def load(self, database):
        tree = self.mapping.get_port_tree()
        port = Port(tree, database)
        assessment_impl = Assessment.get_implementation()

        num_assessments = 0
        selected = database.produce(
            self.definition['selector']['query'],
            **self.get_selector_params()
        )

        for i in range(0, len(selected), 100):
            # Retrieve a batch of Assessments from the datastore
            selected_value_map = dict([
                (str(rec.assessment_uid), rec)
                for rec in selected[i:i + 100]
            ])
            assessments = assessment_impl.bulk_retrieve(
                list(selected_value_map.keys())
            )

            # Collect port data.
            dataset = []
            for assessment in assessments:
                if not assessment.data:
                    continue

                data = self.mapping.get_port_data(
                    assessment.data,
                    assessment.instrument_version_uid,
                    selected_value_map[assessment.uid],
                )
                data['assessment_uid'] = assessment.uid
                data['instrument_version_uid'] = \
                    assessment.instrument_version_uid
                dataset.append(data)

                num_assessments += 1

            # Submit port data.
            _insert_into_port(port, dataset)

        return num_assessments

    def do_calculations(self, database):
        if not self.definition['post_load_calculations']:
            return

        params = {}
        params.update(self.parameters)
        params['INSTRUMENT'] = self.definition['instrument']

        for statement in self.mapping.get_calculation_statements():
            database.produce(statement, **params)


def _insert_into_port(port, dataset):
    # Faster port.insert() without refetching and validation.
    with port.db, port.db.transaction():
        tree = port.tree
        old_map = flatten(tree, adapt(tree, None))
        new_map = flatten(tree, adapt(tree, dataset))
        pair_map = match(old_map, new_map)
        patch(pair_map, port._command_cache)  # noqa: protected-access

