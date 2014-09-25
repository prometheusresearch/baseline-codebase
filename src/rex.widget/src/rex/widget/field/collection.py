"""

    rex.widget.field.collection
    ===========================

    :copyright: 2014, Prometheus Research, LLC

"""

from .data import DataField, Data


class CollectionField(DataField):

    class computator(DataField.computator):

        inactive_value = Data([])

        def fetch(self, handler, spec, graph):
            params = {}
            for name, refs in spec.refs.items():
                for ref in refs:
                    value = graph[ref]
                    if value is None:
                        continue
                    params.setdefault(name, []).append(value)
            return self.execute(handler, spec, **params)
