#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import AnyVal
from rex.instrument import Assessment

from .tables import PrimaryTable


__all__ = (
    'AssessmentLoader',
)


class AssessmentLoader(object):
    def __init__(self, definition, database):
        self.definition = definition
        self.mapping = PrimaryTable(self.definition, database)

    def get_deploy_facts(self):
        return self.mapping.get_deploy_facts()

    def load(self, database):
        assessment_impl = Assessment.get_implementation()

        num_assessments = 0
        selected = database.produce(self.definition['selector'])
        for i in range(0, len(selected), 100):
            # Retrieve a batch of Assessments from the datastore
            selected_value_map = dict([
                (unicode(rec.assessment_uid), rec)
                for rec in selected[i:i + 100]
            ])
            assessments = assessment_impl.bulk_retrieve(
                selected_value_map.keys()
            )

            for assessment in assessments:
                # Map the Assessment into a series of HTSQL statements
                statements = self.mapping.get_statements_for_assessment(
                    AnyVal().parse(assessment.data),
                    assessment.instrument_version_uid,
                    selected_value_map[assessment.uid],
                )

                primary_id = None
                for idx, statement in enumerate(statements):
                    if idx == 0:
                        # The first statement is always the base of the
                        # Assessment, and it requires the UIDs
                        statement.parameters.update({
                            'assessment_uid': assessment.uid,
                            'instrument_version_uid':
                                assessment.instrument_version_uid,
                        })

                    else:
                        # The subsequent statements need the ID of the base
                        # table
                        statement.parameters.update({
                            'PRIMARY_TABLE_ID': primary_id,
                        })

                    # Execute the statement
                    result = database.produce(
                        statement.htsql,
                        **statement.parameters
                    )
                    if idx == 0:
                        # Remember the ID of the record we just inserted
                        primary_id = result[0]

                num_assessments += 1

        return num_assessments

    def do_calculations(self, database):
        if not self.definition['post_load_calculations']:
            return

        for statement in self.mapping.get_calculation_statements():
            database.produce(statement)

