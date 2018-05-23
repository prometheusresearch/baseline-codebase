/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style, css} from '@prometheusresearch/react-ui/stylesheet';
import autobind from 'autobind-decorator';
import debounce from 'lodash/debounce';

import InputText from './InputText';
import * as FormContext from '../FormContext';
import {getJson} from '../../fetch';


export default class LookupText extends React.Component {
  static stylesheet = {
    Root: 'div',
    SuggestionList: style('div', {
      position: 'absolute',
      zIndex: 100,
      backgroundColor: 'white',
      border: css.border(1, css.rgb(180)),
      borderRadius: 2,
      boxShadow: css.rgba(37, 40, 43, 0.1)
    }),
    Suggestion: (props) => {
      return (
        <ReactUI.Block>
          <ReactUI.QuietButton {...props} />
        </ReactUI.Block>
      );
    }
  };

  static contextTypes = FormContext.contextTypes;

  constructor(props) {
    super(props);

    this.state = {
      foundValues: []
    };

    this.findValues = debounce(this._findValues, 500);
  }

  render() {
    let {Root, SuggestionList, Suggestion} = this.constructor.stylesheet;

    let suggestions = this.state.foundValues.map((value, idx) => {
      return (
        <Suggestion
          key={idx}
          onClick={this.onSelect.bind(this, value.value)}>
          {value.label}
        </Suggestion>
      );
    });

    return (
      <Root>
        <InputText {...this.props}
          onChange={this.onChange}
          onBlur={this.onBlur}>
          <ReactForms.Input Component={ReactUI.Input} />
        </InputText>
        {suggestions.length > 0 &&
          <SuggestionList>
            {suggestions}
          </SuggestionList>
        }
      </Root>
    );
  }

  @autobind
  onChange(event) {
    let value = event.target.value;
    if (value && this.props.options.lookup && this.context.apiUrls.lookup) {
      this.findValues(value);
    } else {
      this.clearValues();
    }
  }

  @autobind
  onBlur() {
    // Delaying the execution of this so that the onClick has time to fire
    // before the list disappears.
    setTimeout(this.clearValues, 500);
  }

  onSelect(value) {
    this.props.formValue.update(value);
    this.clearValues();
  }

  _findValues(query) {
    let url = `${this.context.apiUrls.lookup}?lookup=${this.props.options.lookup}&query=${query}`;
    getJson(url).then((data) => {
      this.setState({
        foundValues: data.values || []
      });
    });
  }

  @autobind
  clearValues() {
    if (this.state.foundValues.length > 0) {
      this.setState({
        foundValues: []
      });
    }
  }
}

