/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import PropTypes from 'prop-types';
import * as ReactForms from "react-forms/reactive";
import throttle from "lodash/throttle";
import some from "lodash/some";
import { Block } from "@prometheusresearch/react-ui-0.21";
import { style, css } from "@prometheusresearch/react-ui-0.21/stylesheet";

import Error from "./Error";
import ErrorList from "./ErrorList";

let WidgetRoot = style(Block, {
  border: css.border(1, "transparent"),
  focus: {
    outline: css.none,
    border: css.border(1, "#ccc")
  }
});

export default ReactForms.reactive(
  class Widget extends React.Component {
    static propTypes = {
      formValue: PropTypes.object.isRequired,
      disabled: PropTypes.bool.isRequired,
      question: PropTypes.object.isRequired
    };

    static defaultProps = {
      question: {}
    };

    constructor(props) {
      super(props);
      this.state = { showErrorList: false };
      this.isUnmounted = false;
    }

    render() {
      let {
        formValue, children, disabled, question,
        instrument: _instrument,
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
      children = React.Children.only(children);
      children = React.cloneElement(children, {
        disabled,
        value: formValue.value,
        onChange: this.onChange,
        variant: { error: hasError && showErrorList },
        onBlur: () => this.onToggleShowErrorList(true)
      });
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

    onChange = value => {
      if (this.props.coerce) {
        value = this.props.coerce(value);
      }
      if (!this.state.showErrorList) {
        this.setState({ showErrorList: true });
      }
      this.props.formValue.update(value);
    };

    onToggleShowErrorList = throttle(
      showErrorList => {
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
