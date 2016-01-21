/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React         from 'react';
import Field         from './Field';
import ReadOnlyField from './ReadOnlyField';

let TextareaFieldStyle = {
  input: {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    fontSize: '14px',
    lineHeight: 1.42857143,
    color: '#555',
    backgroundColor: '#fff',
    backgroundImage: 'none',
    border: '1px solid #ccc',
    borderRadius: '2px',
    boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075)',
    transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s'
  }
};

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

  render() {
    let {readOnly, ...props} = this.props;
    if (readOnly) {
      return <ReadOnlyField {...props} />;
    } else {
      return (
        <Field {...this.props}>
          <textarea style={TextareaFieldStyle.input} />
        </Field>
      );
    }
  }
}
