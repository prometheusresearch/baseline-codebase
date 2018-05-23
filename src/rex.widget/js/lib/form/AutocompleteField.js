/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import Autocomplete from '../Autocomplete';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import {Fetch} from '../../data';
import {withFormValue} from 'react-forms';
import contextParams from './contextParams';

/**
 *  AutocompleteField component.
 *
 * Renders a <Field> with an <Autocomplete> widget or
 * if ``readOnly`` is true a <ReadOnlyField> with an <EntityTitle>
 * is rendered.
 *
 * @public
 */
export class AutocompleteField extends React.Component {

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

    /**
     * How many items to fetch from server for any given request.
     */
    limit: React.PropTypes.number,

    Input: React.PropTypes.func,

    View: React.PropTypes.func,
  };

  static defaultProps = {
    limit: 50,
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
      data, readOnly, formValue, limit,
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
      let titleDataSpec = data.params(contextParams(formValue.params.context));
      let queryDataSpec = data.path.indexOf('/@@/') > -1 ?
        titleDataSpec.params({'query': true}) :
        titleDataSpec;
      return (
        <Field {...props} data={undefined} formValue={formValue}>
          <Input
            limit={limit}
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

}

function fetchEntity({data, value}) {
  return {
    entity: data.params({'*': value}).getSingleEntity()
  };
}

@Fetch(fetchEntity)
export class EntityTitle extends React.Component {

  static defaultProps = {
    titleAttribute: 'title'
  };

  render() {
    let {titleAttribute, fetched: {entity}, View} = this.props;
    return <View data={entity.data} titleAttribute={titleAttribute} />;
  }
}

export default withFormValue(AutocompleteField);
