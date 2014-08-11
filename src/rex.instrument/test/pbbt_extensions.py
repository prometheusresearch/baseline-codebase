import codecs
import os.path

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
        for filename in sorted(os.listdir(self.input.instrumentversions)):
            full_path = os.path.join(self.input.instrumentversions, filename)

            if not os.path.isfile(full_path):
                continue
            self.ui.literal('Validating %s...' % filename)

            data = codecs.open(full_path, 'r', encoding='utf-8').read()
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
        from rex.instrument import InstrumentVersion, Assessment, \
            ValidationError

        results = []
        for filename in sorted(os.listdir(self.input.assessments)):
            full_path = os.path.join(self.input.assessments, filename)

            if os.path.isfile(full_path):
                self.ui.literal('Validating %s...' % filename)

                data = codecs.open(full_path, 'r', encoding='utf-8').read()
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

            elif os.path.isdir(full_path):
                instrument_defn = codecs.open(
                    os.path.join(full_path, 'instrument.json'),
                    'r',
                    encoding='utf-8'
                ).read()

                try:
                    InstrumentVersion.validate_definition(instrument_defn)
                except ValidationError as exc:
                    results.append({
                        filename: u'%s: %s' % (
                            exc.__class__.__name__,
                            exc,
                        ),
                    })
                    continue

                for subfilename in sorted(os.listdir(full_path)):
                    full_subpath = os.path.join(full_path, subfilename)

                    if subfilename == 'instrument.json' \
                            or not os.path.isfile(full_subpath):
                        continue
                    else:
                        subfilename = os.path.join(filename, subfilename)

                    self.ui.literal('Validating %s...' % subfilename)

                    data = codecs.open(
                        full_subpath,
                        'r',
                        encoding='utf-8',
                    ).read()
                    try:
                        Assessment.validate_data(
                            data,
                            instrument_definition=instrument_defn,
                        )
                    except ValidationError as exc:
                        results.append({
                            subfilename: u'%s: %s' % (
                                exc.__class__.__name__,
                                exc,
                            ),
                        })
                    else:
                        results.append({
                            subfilename: 'VALIDATED',
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

