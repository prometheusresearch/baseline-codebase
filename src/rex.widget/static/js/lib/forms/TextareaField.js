/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var Field         = require('./Field');
var ReadOnlyField = require('./ReadOnlyField');

var TextareaFieldStyle = {
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
}

/**
 * Renders a <Field> with a <textarea>.
 *
 * @public
 */
var TextareaField = React.createClass({

  propTypes: {
    /**
     * When ``true``, <ReadOnlyField> is rendered.
     * otherwise <Field> <textarea/> </Field> is. 
     */
    readOnly: React.PropTypes.bool
  },

  render() {
    var {readOnly, ...props} = this.props;
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
});

module.exports = TextareaField;
