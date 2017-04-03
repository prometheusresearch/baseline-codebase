"use strict";

import React from "react";
import { WithFormValue, SelectField, Field } from "rex-widget/form";
import Select from "rex-widget/lib/Select";
import { VBox, HBox } from "rex-widget/layout";

const FORMATS = [
  { name: "CSV", title: "CSV", hint: "Comma-separated file" },
  { name: "TSV", title: "TSV", hint: "Tab-separated file" },
  { name: "XLS", title: "XLS", hint: "Microsoft Excel file" }
];

function WrappedSelect({ options, template, ...props }) {
  let { value } = props;

  return (
    <HBox flex={2}>
      <Select
        options={options.map(o => ({ id: o.value, title: o.label }))}
        flex={1}
        {...props}
      />
      <HBox flex={3}>
        {value &&
          <HBox>
            <VBox style={{ marginLeft: "5px", fontWeight: "bold" }}>
              Templates
            </VBox>
            {FORMATS.map(f => (
              <VBox style={{ marginLeft: "5px" }}>
                <a
                  href={`${template.path}?format=${f.name}&table=${value}`}
                  title={f.hint}
                >
                  {f.title}
                </a>
              </VBox>
            ))}
          </HBox>}
      </HBox>
    </HBox>
  );
}

class SelectImportTable extends React.Component {
  render() {
    let { tables, template, readOnly } = this.props;
    let options = tables.map(t => ({ value: t, label: t }));
    if (readOnly) {
      return <SelectField {...this.props} options={options} />;
    } else {
      return (
        <Field {...this.props}>
          <WrappedSelect options={options} template={template}/>
        </Field>
      );
    }
  }
}

export default WithFormValue(SelectImportTable);
