/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import Autocomplete from '../Autocomplete';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import {Fetch} from '../../data';
import {WithFormValue} from 'react-forms';

/**
 *  AutocompleteField component.
 *
 * Renders a <Field> with an <Autocomplete> widget or
 * if ``readOnly`` is true a <ReadOnlyField> with an <EntityTitle>
 * is rendered.
 *
 * @public
 */
@WithFormValue
export default class AutocompleteField extends React.Component {

  static propTypes = {

    data: React.PropTypes.object,

    /**
     * When ``true``, the title of the entity (from data)
     * is feteched and displayed;
     * otherwise the <Autocomplete> widget is displayed.
     */
    readOnly: React.PropTypes.bool,

    /**
     * The initial value of the field.
     * The **formValue** is passed to <Field>.
     */
    formValue: React.PropTypes.object,

    /**
     * The database field name which holds the value to be auto-completed.
     */
    valueAttribute: React.PropTypes.string,

    /**
     * The database field name which holds the title.
     */
    titleAttribute: React.PropTypes.string,

    /**
     * Has **resultList** property which contains a css attribute object
     * used to style the <Autocomplete> widget.
     */
    style: React.PropTypes.object,

    Input: React.PropTypes.func,

    View: React.PropTypes.func,
  };

  static defaultProps = {
    Input: Autocomplete,
    View: function View({data, titleAttribute}) {
      if (data) {
        return <div>{data[titleAttribute]}</div>;
      } else {
        return <noscript />;
      }
    }
  };

  render() {
    let {
      data, readOnly, formValue,
      valueAttribute, titleAttribute, style,
      select, selectFormValue,
      Input, View,
      ...props
    } = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value &&
            <EntityTitle
              View={View}
              data={data}
              titleAttribute={titleAttribute}
              value={formValue.value}
              />}
        </ReadOnlyField>
      );
    } else {
      let titleDataSpec = data.params(this._populateParameters());
      let queryDataSpec = data.path.indexOf('/@@/') > -1 ?
        titleDataSpec.params({'query': true}) :
        titleDataSpec;
      return (
        <Field {...props} data={undefined} formValue={formValue}>
          <Input
            style={{resultList: style && style.resultList}}
            data={queryDataSpec}
            titleData={titleDataSpec}
            valueAttribute={valueAttribute}
            titleAttribute={titleAttribute}
            />
        </Field>
      );
    }
  }

  _populateParameters() {
    let context = this.props.formValue.params.context;
    let populatedParameters = {};
    for (let key in context) {
      if (context.hasOwnProperty(key)) {
        let value = context[key];
        if (value['meta:type'] !== undefined) {
          populatedParameters[':' + key] = value.id;
        } else {
          populatedParameters[':' + key] = value;
        }
      }
    }
    return populatedParameters;
  }
}

function fetchEntity({data, value}) {
  return {
    entity: data.params({'*': value}).getSingleEntity()
  };
}

@Fetch(fetchEntity)
class EntityTitle extends React.Component {

  static defaultProps = {
    titleAttribute: 'title'
  };

  render() {
    let {titleAttribute, fetched: {entity}, View} = this.props;
    return <View data={entity.data} titleAttribute={titleAttribute} />;
  }
}
