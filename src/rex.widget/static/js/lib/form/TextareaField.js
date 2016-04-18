/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import * as Stylesheet from '../../stylesheet';
import * as css from '../../css';


/**
 * Renders a <Field> with a <textarea>.
 *
 * @public
 */
export default class TextareaField extends React.Component {

  static propTypes = {
    /**
     * When ``true``, <ReadOnlyField> is rendered.
     * otherwise <Field> <textarea/> </Field> is.
     */
    readOnly: React.PropTypes.bool,
  };

  static stylesheet = Stylesheet.create({
    Input: {
      Component: 'textarea',
      display: 'block',
      width: '100%',
      minHeight: 102,
      padding: css.padding(6, 12),
      resize: 'vertical',
      fontSize: '14px',
      lineHeight: 1.42857143,
      color: '#000',
      backgroundColor: '#fff',
      backgroundImage: css.none,
      border: css.border(1, '#ccc'),
      borderRadius: 2,
      boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
      transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
      error: {
        border: css.border(1, 'red'),
      },
      focus: {
        border: css.border(1, '#888'),
        boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
        outline: css.none,
      },
    }
  });

  render() {
    let {readOnly, ...props} = this.props;
    let {Input} = this.constructor.stylesheet;
    if (readOnly) {
      return <ReadOnlyField {...props} />;
    } else {
      return (
        <Field {...this.props}>
          <Input />
        </Field>
      );
    }
  }
}
