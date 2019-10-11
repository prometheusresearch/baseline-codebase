/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import PropTypes from "prop-types";
import type { Value as FormValue } from "react-forms";
import * as ReactForms from "react-forms/reactive";
import throttle from "lodash/throttle";
import some from "lodash/some";
import { Block } from "@prometheusresearch/react-ui-0.21";
import { style, css } from "@prometheusresearch/react-ui-0.21/stylesheet";

import * as types from "../types";
import Error from "./Error";
import ErrorList from "./ErrorList";
import type { WidgetProps, WidgetInputProps } from "./WidgetConfig.js";

let WidgetRoot = style(Block, {
  border: css.border(1, "transparent"),
  focus: {
    outline: css.none,
    border: css.border(1, "#ccc")
  }
});

type Props = {|
  formValue: FormValue,
  instrument: any,
  editable: boolean,
  readOnly: boolean,
  disabled: boolean,
  form: types.RIOSForm,
  question: types.RIOSQuestion,

  /**
   * User should pass either renderInput or children prop to specify which
   * input to use
   *
   * TODO(andreypopp): get rid of children prop eventually as it's hard to type
   */
  renderInput?: WidgetInputProps => React.Node,
  children?: React.Node
|};

const Widget: React.AbstractComponent<Props> = ReactForms.reactive(
  class Widget extends React.Component<any, any> {
    static propTypes = {
      formValue: PropTypes.object.isRequired,
      disabled: PropTypes.bool.isRequired,
      question: PropTypes.object.isRequired
    };

    static defaultProps = {
      question: {}
    };

    isUnmounted: boolean;

    constructor(props: any) {
      super(props);
      this.state = { showErrorList: false };
      this.isUnmounted = false;
    }

    render() {
      let {
        formValue,
        children,
        disabled,
        question,
        renderInput,
        instrument,
        coerce: _coerce,
        editable: _editable,
        onCommitEdit: _onCommitEdit,
        onCancelEdit: _onCancelEdit,
        ...props
      } = this.props;
      let { showErrorList } = this.state;
      showErrorList =
        showErrorList ||
        formValue.params.forceShowErrorList ||
        some(formValue.completeErrorList, error => error.force);
      let hasError = formValue.completeErrorList.length > 0;
      if (renderInput != null) {
        children = renderInput({
          disabled,
          value: formValue.value,
          onChange: this.onChange,
          variant: { error: hasError && showErrorList },
          onBlur: () => this.onToggleShowErrorList(true),
          instrument
        });
      } else if (children != null) {
        children = React.Children.only(children);
        children = React.cloneElement(children, {
          disabled,
          value: formValue.value,
          onChange: this.onChange,
          variant: { error: hasError && showErrorList },
          onBlur: () => this.onToggleShowErrorList(true)
        });
      } else {
        invariant(
          false,
          "Widget: missing either renderInput or children props"
        );
      }
      return (
        <WidgetRoot {...props}>
          {children}
          {hasError &&
            showErrorList &&
            (question.error ? (
              <Error>{question.error}</Error>
            ) : (
              <ErrorList formValue={formValue} />
            ))}
        </WidgetRoot>
      );
    }

    componentWillUnmount() {
      this.isUnmounted = true;
    }

    onChange = (value: any) => {
      if (this.props.coerce) {
        value = this.props.coerce(value);
      }
      if (!this.state.showErrorList) {
        this.setState({ showErrorList: true });
      }
      this.props.formValue.update(value);
    };

    onToggleShowErrorList = throttle(
      (showErrorList: boolean) => {
        if (this.isUnmounted) {
          return;
        }
        this.setState(state => {
          showErrorList = state.showErrorList || showErrorList;
          return { ...state, showErrorList };
        });
      },
      200,
      { leading: false, trailing: true }
    );
  }
);

export default Widget;
