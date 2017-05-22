/**
 * @copyright 2016, Prometheus Research, LLC
 */

import './setup-runtime';
import './index.css';
import './TransitionableHandlers';

export Chrome from './Chrome';

// form components
export FormRow from './form/FormRow';
export FormColumn from './form/FormColumn';
export AutocompleteField from './form/AutocompleteField';
export TextareaField from './form/TextareaField';
export CheckboxGroupField from './form/CheckboxGroupField';
export RadioGroupField from './form/RadioGroupField';
export DateField from './form/DateField';
export DatetimeField from './form/DatetimeField';
export SourceCodeField from './form/SourceCodeField';
export JsonSourceCodeField from './form/JsonSourceCodeField';
export ConfigurableEntityForm from './form/ConfigurableEntityForm';

// library components
export IFrame from './library/IFrame';

export Authorized from './Authorized';
export Autocomplete from './Autocomplete';
export Link from './Link';
export QueryString from './qs';
export Select from './Select';
export * as Transitionable from './Transitionable';

import ReactDOM from 'react-dom';
export let render = ReactDOM.render;

import * as Transitionable from './Transitionable';
window.RexWidget = {Transitionable, render};
