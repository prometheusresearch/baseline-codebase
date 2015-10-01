/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import Stylesheet           from '@prometheusresearch/react-stylesheet';
import {Input as BaseInput} from 'react-forms';

@Stylesheet
/**
 * Text input component.
 *
 * @public
 */
export default class Input extends React.Component {

  static propTypes = {

    /**
     * Render in error state.
     */
    error: React.PropTypes.any,

    /**
     * Input's DOM type.
     */
    type: React.PropTypes.string
  };

  static defaultProps = {
    type: 'text'
  };

  static stylesheet = {
    Self: {
      Component: BaseInput,
      display: 'block',
      width: '100%',
      height: '34px',
      padding: '6px 12px',
      fontSize: '14px',
      lineHeight: 1.42857143,
      color: '#555',
      backgroundColor: '#fff',
      backgroundImage: 'none',
      border: '1px solid #ccc',
      borderRadius: '2px',
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075)',
      transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
      error: {
        border: '1px solid red',
      },
      focus: {
        border: '1px solid #66afe9',
        boxShadow: 'inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)',
        outline: 'none',
      }
    }
  };

  render() {
    let {error, ...props} = this.props;
    let {Self} = this.stylesheet;
    return <Self {...this.props} state={{error}} />;
  }
}
