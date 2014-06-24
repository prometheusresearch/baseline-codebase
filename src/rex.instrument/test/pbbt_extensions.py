import codecs
import glob

from pbbt import Test, Field, MatchCase, listof


__all__ = (
    'InstrumentValidatorCase',
    'AssessmentValidatorCase',
)


@Test
class InstrumentValidatorCase(MatchCase):
    class Input(object):
        instrumentversions = Field(str)

    class Output(object):
        instrumentversions = Field(str)
        validations = Field(listof(dict))

    def run(self):
        # this import needs to be here instead of at the top of the module
        # because if it runs upon load, it seems to confuse converage.py
        from rex.instrument import InstrumentVersion, ValidationError

        results = []
        for filename in sorted(glob.glob(self.input.instrumentversions)):
            self.ui.literal('Validating %s...' % filename)

            data = codecs.open(filename, 'r', encoding='utf-8').read()
            try:
                InstrumentVersion.validate_definition(data)
            except ValidationError as exc:
                results.append({
                    filename: u'%s: %s' % (
                        exc.__class__.__name__,
                        exc,
                    ),
                })
            else:
                results.append({
                    filename: 'VALIDATED',
                })

        return self.Output(
            instrumentversions=self.input.instrumentversions,
            validations=results,
        )

    def render(self, output):
        results = []
        for validation in output.validations:
            filename, output = validation.items()[0]
            results.append('%s --> %s' % (
                filename,
                output,
            ))
        return '\n'.join(results)


@Test
class AssessmentValidatorCase(MatchCase):
    class Input(object):
        assessments = Field(str)

    class Output(object):
        assessments = Field(str)
        validations = Field(listof(dict))

    def run(self):
        # this import needs to be here instead of at the top of the module
        # because if it runs upon load, it seems to confuse converage.py
        from rex.instrument import Assessment, ValidationError

        results = []
        for filename in sorted(glob.glob(self.input.assessments)):
            self.ui.literal('Validating %s...' % filename)

            data = codecs.open(filename, 'r', encoding='utf-8').read()
            try:
                Assessment.validate_data(data)
            except ValidationError as exc:
                results.append({
                    filename: u'%s: %s' % (
                        exc.__class__.__name__,
                        exc,
                    ),
                })
            else:
                results.append({
                    filename: 'VALIDATED',
                })

        return self.Output(
            assessments=self.input.assessments,
            validations=results,
        )

    def render(self, output):
        results = []
        for validation in output.validations:
            filename, output = validation.items()[0]
            results.append('%s --> %s' % (
                filename,
                output,
            ))
        return '\n'.join(results)

