/**
 * @copyright 2016, Prometheus Research, LLC
 */

import invariant from 'invariant';
import React from 'react';
import noop from 'lodash/noop';

import focusFirstWithin from '../focusFirstWithin';
import * as FormContext from './FormContext';
import Question from './Question';
import Text from './Text';
import Header from './Header';
import Divider from './Divider';
import Audio from './Audio';

export default class FormPage extends React.Component {

  static defaultProps = {
    onEditable: noop,
  };

  static contextTypes = {
    ...FormContext.contextTypes,
  };

  constructor(props) {
    super(props);
    this._root = null;
  }

  render() {
    let {page} = this.props;
    return (
      <div ref={this.onRoot}>
        {page.elements.map(this.renderElement, this)}
      </div>
    );
  }

  renderElement(element, idx) {
    let pageIsHidden = (
      element.originalPageId
      && this.context.event.isPageHidden(element.originalPageId)
    );
    if (pageIsHidden) {
      return null;
    }

    let {formValue, mode, editable} = this.props;
    let pageIsDisabled = (
      element.originalPageId
      && this.context.event.isPageDisabled(element.originalPageId)
    );

    if (element.type === 'question') {
      let {fieldId} = element.options;
      let questionEditable = editable === fieldId;
      let questionMode = (
        mode === 'review' &&
        editable !== null &&
        !questionEditable ? 'view' : mode
      );
      let questionFormValue = formValue.select(fieldId);
      let hidden = this.context.event.isHidden(
        questionFormValue.schema.form.eventKey
      );
      if (hidden) {
        return null;
      }
      let disabled = pageIsDisabled || this.context.event.isDisabled(
        questionFormValue.schema.form.eventKey
      );
      return (
        <Question
          key={fieldId}
          mode={questionMode}
          editable={questionEditable}
          disabled={disabled}
          onEditable={this.onEditable.bind(null, fieldId)}
          question={element.options}
          formValue={questionFormValue}
          />
      );
    } else {
      let {tags = []} = element;
      if (this.context.event.isElementHidden(...tags)) {
        return null;
      }
      let props = {
        key: idx,
        disabled: pageIsDisabled || this.context.event.isElementDisabled(...tags)
      };
      switch (element.type) {
        case 'text':
          return <Text {...props} text={element.options.text} />;
        case 'header':
          return <Header {...props} text={element.options.text} />;
        case 'divider':
          return <Divider {...props} />;
        case 'audio':
          return <Audio {...props} source={element.options.source} />;
        default:
          invariant(
            false,
            'Unkown element type: %s', element.type
          );
      }
    }
  }

  componentDidMount() {
    if (this._root) {
      focusFirstWithin(this._root);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.page.id !== this.props.page.id) {
      focusFirstWithin(this._root);
    }
  }

  onRoot = (_root) => {
    this._root = _root;
  };

  onEditable = (fieldId, {editable, ...info}) =>
    this.props.onEditable({
      editable: editable && fieldId ? fieldId : null,
      ...info
    });
}

