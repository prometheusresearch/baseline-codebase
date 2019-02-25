/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as ReactForms from "react-forms/reactive";
import { map } from "lodash";

import { InjectI18N } from "rex-i18n";

import * as FormContext from "../FormContext";
import parseBoolean from "../../parseBoolean";
import Widget from "../Widget";
import getLocalizedString from "../../getLocalizedString";

export default InjectI18N(
  ReactForms.reactive(
    class DropDown extends React.Component {
      static contextTypes = FormContext.contextTypes;

      render() {
        let {
          instrument: { type, field },
          form: { eventKey },
          question: { fieldId, enumerations },
          ...props
        } = this.props;
        let { event } = this.context;

        let options;
        if (type.base === "boolean") {
          options = [
            { value: true, label: this._("Yes") },
            { value: false, label: this._("No") }
          ];
        } else if (type.base === "enumeration") {
          if (enumerations) {
            options = map(enumerations, enumeration => ({
              value: enumeration.id,
              label: getLocalizedString(
                enumeration.text,
                this.getI18N(),
                this.context.defaultLocalization
              )
            }));
          } else {
            options = Object.keys(type.enumerations)
              .sort()
              .map(enumeration => {
                return {
                  value: enumeration,
                  label: enumeration
                };
              });
          }
          if (event) {
            let hidden = event.hiddenEnumerations(eventKey);
            options = options.filter(
              enumeration => hidden.indexOf(enumeration.value) === -1
            );
          }
        } else {
          invariant(
            false,
            "<Dropdown /> is incompatible with field of type %s",
            type.base
          );
        }

        return (
          <Widget {...props} coerce={type.base === "boolean" && parseBoolean}>
            <ReactUI.Select allowNoValue={!field.required} options={options} />
          </Widget>
        );
      }
    }
  )
);
