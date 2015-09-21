/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                   from 'react';
import Autocomplete            from '../Autocomplete'
import Preloader               from '../Preloader';
import DataSpecificationMixin  from '../DataSpecificationMixin';
import {collection, prop}      from '../DataSpecification';
import Field                   from './Field';
import ReadOnlyField           from './ReadOnlyField';

export default class AutocompleteField extends React.Component {

  render() {
    var {
      dataSpec, readOnly, formValue, parameters,
      valueAttribute, titleAttribute, style,
      ...props
    } = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value &&
            <EntityTitle
              dataSpec={dataSpec}
              titleAttribute={titleAttribute}
              value={formValue.value}
              />}
        </ReadOnlyField>
      );
    } else {
      let root = formValue._root;
      let titleDataSpec = dataSpec.merge(this._populateParameters());
      let queryDataSpec = titleDataSpec.merge({'query': true});
      return (
        <Field {...props} data={undefined} formValue={formValue}>
          <Autocomplete
            style={{resultList: style && style.resultList}}
            dataSpec={queryDataSpec}
            titleDataSpec={titleDataSpec}
            valueAttribute={valueAttribute}
            titleAttribute={titleAttribute}
            />
        </Field>
      );
    }
  }

  _populateParameters() {
    let {parameters, formValue} = this.props;
    let rootFormValue = formValue._root;
    let populatedParameters = {};
    for (let key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        populatedParameters[':' + key] = rootFormValue.select(parameters[key]).value;
      }
    }
    return populatedParameters;
  }
}

var EntityTitle = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: collection({'*': prop('value')})
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    var {titleAttribute} = this.props;
    var {data} = this.data.dataSpec;
    if (data) {
      return <div>{data[0][titleAttribute]}</div>;
    } else {
      return null;
    }
  },

  getDefaultProps() {
    return {
      titleAttribute: 'title'
    };
  }
});
