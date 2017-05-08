/**
 * @copyright 2017, Prometheus Research, LLC
 */

import TextFilter from './TextFilter';
import EnumFilter from './EnumFilter';
import NumericFilter from './NumericFilter';
import BooleanFilter from './BooleanFilter';
import DateFilter from './DateFilter';
import TimeFilter from './TimeFilter';
import DateTimeFilter from './DateTimeFilter';

export {
  TextFilter,
  EnumFilter,
  NumericFilter,
  BooleanFilter,
  DateFilter,
  TimeFilter,
  DateTimeFilter,
};

export const FILTER_MAP = {
  'text': TextFilter,
  'enum': EnumFilter,
  'integer': NumericFilter,
  'float': NumericFilter,
  'decimal': NumericFilter,
  'boolean': BooleanFilter,
  'date': DateFilter,
  'time': TimeFilter,
  'datetime': DateTimeFilter,
};

