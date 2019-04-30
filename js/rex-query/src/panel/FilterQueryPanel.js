/**
 * @flow
 */

import type { Expression, FilterQuery } from "../model/types";
import type { Actions } from "../state";

import * as React from "react";
import PropTypes from "prop-types";
import { Element } from "react-stylesheet";
// $FlowFixMe: ...
import * as ReactUI from "@prometheusresearch/react-ui";

import * as q from "../model/Query";
import * as qn from "../model/QueryNavigation";
import { Icon, Theme, Menu } from "../ui";
import QueryPanelBase from "./QueryPanelBase";
import FilterCondition from "./filter/FilterCondition";

function ORSeparator() {
  return (
    <Element
      position="relative"
      padding={{ vertical: 10 }}
      textAlign="center"
      fontWeight={300}
      color="#888"
      fontSize="0.7em"
    >
      <hr />
      <Element
        position="absolute"
        top={5}
        left="50%"
        width={25}
        marginLeft={-12.5}
        padding={5}
        background="#fff"
      >
        OR
      </Element>
    </Element>
  );
}

type FilterQueryPanelProps = {
  query: FilterQuery,
  onClose: () => *
};

export type Draft = {|
  fieldName: ?string,
  operandName: ?string,
  comparatorName: ?string,
  operandIsField: boolean
|};

let emptyDraft: Draft = {
  fieldName: null,
  operandName: null,
  comparatorName: null,
  operandIsField: false
};

export type Condition =
  | {| type: "expression", expression: Expression |}
  | {| type: "expression-draft", draft: Draft |};

function conditionsOfPredicate(predicate) {
  if (predicate == null) {
    return [{ type: "expression-draft", draft: emptyDraft }];
  } else {
    if (
      predicate.name === "logicalBinary" &&
      predicate.op === "or" &&
      predicate.expressions.length > 0
    ) {
      return predicate.expressions.map(expression => ({
        type: "expression",
        expression
      }));
    } else {
      return [{ type: "expression-draft", draft: emptyDraft }];
    }
  }
}

type FilterQueryPanelState = {
  conditions: Condition[]
};

export default class FilterQueryPanel extends React.Component<
  FilterQueryPanelProps,
  FilterQueryPanelState
> {
  context: {
    actions: Actions
  };

  static contextTypes = { actions: PropTypes.object };

  constructor(props: FilterQueryPanelProps) {
    super(props);
    let { predicate } = props.query;

    this.state = { conditions: conditionsOfPredicate(props.query.predicate) };
  }

  componentWillReceiveProps(nextProps: FilterQueryPanelProps) {
    // Get a list of new expressions out of predicate.
    let expressions = [];
    for (let c of conditionsOfPredicate(nextProps.query.predicate)) {
      if (c.type === "expression") {
        expressions.push(c.expression);
      }
    }

    // Now reconcile current state with a list of new expressions.
    // This assumes that the order of expressions don't change between updates.
    let i = 0;
    let conditions = [];
    for (let c of this.state.conditions) {
      // keep drafts as is.
      if (c.type === "expression-draft") {
        conditions.push(c);
      } else if (c.type === "expression") {
        let expression = expressions[i];
        // If expression is removed then ignore the current item.
        if (expression == null) {
          continue;
        } else {
          // Update expression if it was new.
          if (expression.id !== c.expression.id) {
            conditions.push({ type: "expression", expression });
          } else {
            conditions.push(c);
          }
        }
        i++;
      }
    }

    this.setState({ conditions });
  }

  render() {
    let { onClose, query } = this.props;

    let navigation = Array.from(qn.getNavigation(query.context).values());
    let fields = navigation.filter(field => {
      let type = field.context.type;
      return type.name !== "invalid";
    });

    let conditions = this.state.conditions.map((condition, idx) => {
      let isInvalid =
        condition.type === "expression" &&
        condition.expression.context.type.name === "invalid";
      return (
        <Element key={idx}>
          {idx !== 0 && <ORSeparator />}
          <Element
            border={
              !isInvalid ? "none" : `1px solid ${Theme.invalid.borderColor}`
            }
            padding={{ horizontal: 5, vertical: 10 }}
          >
            <Element textAlign="right" marginBottom={5}>
              <ReactUI.QuietButton
                size="x-small"
                title="Remove filter condition"
                icon={<Icon.IconRemove />}
                onClick={this.onConditionRemove.bind(this, idx)}
              />
            </Element>
            <Element verticalAlign="middle">
              <FilterCondition
                fields={fields}
                condition={condition}
                onConditionUpdate={expr => this.onConditionUpdate(idx, expr)}
              />
            </Element>
          </Element>
        </Element>
      );
    });

    return (
      <QueryPanelBase
        title="Filter"
        onClose={onClose}
        theme={Theme.filter}
        query={query}
      >
        <ReactUI.VBox overflow="visible" padding={0}>
          <ReactUI.VBox overflow="visible" padding={5}>
            {conditions}
          </ReactUI.VBox>
          <Menu.MenuGroup padding={{ vertical: 20 }}>
            <Menu.MenuButton icon="＋" onClick={this.onAddCondition}>
              Add Another Condition
            </Menu.MenuButton>
          </Menu.MenuGroup>
        </ReactUI.VBox>
      </QueryPanelBase>
    );
  }

  onAddCondition = () => {
    this.setState(state => {
      let conditions = [...state.conditions];
      conditions.push({ type: "expression-draft", draft: emptyDraft });
      return { conditions };
    });
  };

  onConditionUpdate(index: number, condition: ?Condition) {
    this.setState(
      state => {
        let conditions = [...state.conditions];
        if (condition != null) {
          conditions[index] = condition;
        } else {
          conditions.splice(index, 1);
        }
        return { conditions };
      },
      () => this.updateQuery()
    );
  }

  onConditionRemove(index: number) {
    this.setState(
      state => {
        let conditions = [...state.conditions];
        conditions.splice(index, 1);
        return { conditions };
      },
      () => this.updateQuery()
    );
  }

  updateQuery() {
    let expressions: Expression[] = [];

    for (let c of this.state.conditions) {
      if (c.type === "expression") {
        expressions.push(c.expression);
      }
    }

    let expression =
      expressions.length > 0
        ? q.or(
            ...expressions.map(expression =>
              q.inferExpressionType(this.props.query.context, expression)
            )
          )
        : null;

    this.context.actions.setFilter({
      at: this.props.query,
      expression
    });
  }
}
