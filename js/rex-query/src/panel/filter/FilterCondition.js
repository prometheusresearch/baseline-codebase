/**
 * @flow
 */

import type { QueryNavigation, Expression } from "../../model/types";

import invariant from "invariant";
import React from "react";
// $FlowFixMe: ...
import * as ReactUI from "@prometheusresearch/react-ui";
import { HBox, Element } from "react-stylesheet";
import debounce from "lodash/debounce";

import { Select, TagLabel, Label } from "../../ui";
import * as FilterComparators from "./FilterComparators";
import type { Condition, Draft as State } from "../FilterQueryPanel";

type FilterConditionProps = {
  condition: Condition,
  fields: Array<QueryNavigation>,
  onConditionUpdate: (?Condition) => void
};

export default class FilterCondition extends React.Component<FilterConditionProps> {
  render() {
    let { fields, condition } = this.props;

    let state = getState(condition);
    let { fieldName, comparatorName, operandName, operandIsField } = state;

    let field = null;

    if (
      condition.type === "expression" &&
      condition.expression.context.hasInvalidType
    ) {
      return (
        <Element fontSize="10pt" fontWeight={300} textAlign="center">
          <Element display="inline-block" marginRight={5}>
            {fieldName}
          </Element>
          <Element display="inline-block" marginRight={5}>
            {comparatorName}
          </Element>
          <Element display="inline-block">{operandName}</Element>
        </Element>
      );
    }

    let comparators = [];
    if (fieldName != null) {
      field = getFieldDefinition(fields, fieldName);
      comparators = FilterComparators.getApplicableForField(field);
    }

    let operandComponent = null;
    let chooseOperandType = true;
    if (field != null && comparatorName != null) {
      let operandFields = getCompatibleOperandFields(fields, field).map(
        field => ({
          label: field.label,
          value: field.value
        })
      );
      chooseOperandType = operandFields.length > 0;

      if (chooseOperandType && operandIsField) {
        operandComponent = (
          <Select
            value={operandName}
            options={operandFields}
            onChange={v => this.onOperandValueChange(state, v)}
            placeholder="Select an Attribute..."
          />
        );
      } else {
        let comparatorDefinition = FilterComparators.getDefinition(
          comparatorName
        );
        invariant(
          comparatorDefinition != null,
          "Cannot find comparator definition for: %s",
          comparatorName
        );
        operandComponent = comparatorDefinition.operand(field, operandName, v =>
          this.onOperandValueChange(state, v)
        );
      }

      if (field.context.type.name === "record") {
        chooseOperandType = false;
      }
    }

    let operandTypeOptions = [
      { label: "Constant Value", value: "value" },
      { label: "Attribute", value: "field" }
    ];

    let fieldOptions = fields.map(field => ({
      labelActive: field.label,
      label: field.fromQuery ? (
        <HBox>
          <HBox flexGrow={1} flexShrink={1}>
            <Label label={field.label} />
          </HBox>
          <TagLabel>query</TagLabel>
        </HBox>
      ) : (
        field.label
      ),
      value: field.value
    }));

    return (
      <ReactUI.Block>
        <ReactUI.Block>
          <ReactUI.Block marginBottom={5}>
            <Select
              value={fieldName}
              options={fieldOptions}
              onChange={v => this.onFieldChange(state, v)}
            />
          </ReactUI.Block>
          {fieldName != null && (
            <ReactUI.Block marginBottom={5}>
              <Select
                clearable={false}
                value={comparatorName}
                options={comparators}
                onChange={v => this.onComparatorChange(state, v)}
              />
            </ReactUI.Block>
          )}
        </ReactUI.Block>
        {operandComponent && (
          <ReactUI.Block>
            {chooseOperandType && (
              <ReactUI.Block marginBottom={5}>
                <ReactUI.RadioGroup
                  layout="horizontal"
                  options={operandTypeOptions}
                  value={operandIsField ? "field" : "value"}
                  onChange={v => this.onOperandTypeChange(state, v)}
                />
              </ReactUI.Block>
            )}
            {operandComponent}
          </ReactUI.Block>
        )}
      </ReactUI.Block>
    );
  }

  onFieldChange = (state: State, newField: null | string | string[]) => {
    invariant(!Array.isArray(newField), "did not expect an array");

    let { fieldName, comparatorName, operandName, operandIsField } = getState(
      this.props.condition
    );

    let prevField = fieldName;
    fieldName = newField;

    let newFieldDef = newField
      ? getFieldDefinition(this.props.fields, newField)
      : null;

    if (newFieldDef) {
      let newComp = null;
      FilterComparators.getApplicableForField(newFieldDef).forEach(comp => {
        if (comp.value === comparatorName) {
          return comp;
        }
      });

      let prevFieldDef = prevField
        ? getFieldDefinition(this.props.fields, prevField)
        : null;

      if (!newComp) {
        comparatorName = null;
        operandName = null;
        operandIsField = false;
      } else if (
        prevFieldDef &&
        newFieldDef &&
        prevFieldDef.context.type !== newFieldDef.context.type
      ) {
        operandName = null;
        operandIsField = false;
      }
    } else {
      comparatorName = null;
      operandName = null;
      operandIsField = false;
    }

    if (newFieldDef && comparatorName == null) {
      let comparators = FilterComparators.getApplicableForField(newFieldDef);
      if (comparators.length > 0) {
        comparatorName = comparators[0].value;
      }
    }

    this.updateState({
      ...state,
      fieldName,
      comparatorName,
      operandName,
      operandIsField
    });
  };

  onComparatorChange = (state: State, comparatorName: *) => {
    invariant(!Array.isArray(comparatorName), "did not expect an array");
    this.updateState({
      ...state,
      comparatorName,
      operandName: null,
      operandIsField: false
    });
  };

  onOperandTypeChange = (state: State, newType: string) => {
    this.updateState({
      ...state,
      operandIsField: newType === "field",
      operandName: null
    });
  };

  onOperandValueChange = (state: State, newOperand: *) => {
    this.updateState({
      ...state,
      // $FlowFixMe: this is ok, but should be fixed at typelevel
      operandName: newOperand
    });
  };

  updateState = (state: State) => {
    let expression = maybePromoteStateToQuery(this.props.fields, state);
    if (expression != null) {
      this.props.onConditionUpdate({ type: "expression", expression });
    } else {
      this.props.onConditionUpdate({ type: "expression-draft", draft: state });
    }
  };
}

function maybePromoteStateToQuery(
  fields: QueryNavigation[],
  state: State
): ?Expression {
  let { fieldName, comparatorName, operandName, operandIsField } = state;

  if (comparatorName == null) {
    return null;
  }

  if (fieldName == null) {
    return null;
  }

  let field = getFieldDefinition(fields, fieldName);
  let comparatorDefinition = FilterComparators.getDefinition(comparatorName);

  invariant(
    comparatorDefinition != null,
    "Cannot find comparator definition for: %s",
    comparatorName
  );

  return comparatorDefinition.query(field, operandName, operandIsField);
}

function getCompatibleOperandFields(
  fieldList: Array<QueryNavigation>,
  field: QueryNavigation
) {
  if (field.context.type.name === "invalid") {
    return [];
  } else {
    return fieldList.filter(
      f =>
        f.context.type.name !== "invalid" &&
        f.value !== field.value &&
        f.context.type.name === field.context.type.name
    );
  }
}

function getFieldDefinition(
  fieldList: Array<QueryNavigation>,
  fieldName: string
): QueryNavigation {
  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    if (field.value === fieldName) {
      return field;
    }
  }

  invariant(false, 'No field named "%s" found in current scope.', fieldName);
}

function getState(condition: Condition): State {
  if (condition.type === "expression") {
    return getStateOfExpression(condition.expression);
  } else if (condition.type === "expression-draft") {
    return condition.draft;
  } else {
    throw new Error(`unknown condition: ${condition.type}`);
  }
}

function getStateOfExpression(expression: Expression): State {
  if (expression.name === "value" && expression.value === true) {
    return {
      fieldName: null,
      comparatorName: null,
      operandName: null,
      operandIsField: false
    };
  }

  let condition = FilterComparators.identify(expression);

  invariant(condition, "Cannot identify expression type.");

  return {
    fieldName: condition.field,
    operandName: condition.operand,
    comparatorName: condition.comparator,
    operandIsField: condition.operandIsField
  };
}
