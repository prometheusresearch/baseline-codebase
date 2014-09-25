"""

    rex.widget.field.entity
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from .data import DataField, Data


class EntityField(DataField):

    class computator(DataField.computator):

        inactive_value = Data(None)
        no_value = Data(None)

        def fetch(self, handler, spec, graph):
            params = {}
            for name, refs in spec.refs.items():
                for ref in refs:
                    value = graph[ref]
                    if value is None:
                        return self.no_value
                    params.setdefault(name, []).append(value)

            data = self.execute(handler, spec, **params)

            if isinstance(data.data, list):
                if len(data.data) == 0:
                    data = self.no_value
                else:
                    data = data._replace(data=data.data[0])

            return data
