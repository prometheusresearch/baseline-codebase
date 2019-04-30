/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

export { default as AutocompleteField } from "./AutocompleteField";
export { CheckboxField } from "./CheckboxField";
export { DateField } from "./DateField";
export { DateTimeField } from "./DateTimeField";
export { TimeField } from "./TimeField";
export { SourceCodeField } from "./SourceCodeField";
export { JsonSourceCodeField } from "./JsonSourceCodeField";
export { default as EntityForm } from "./EntityForm";
export { Field } from "./Field";
export { default as RadioGroupField } from "./RadioGroupField";
export { CheckboxGroupField } from "./CheckboxGroupField";
export { Fieldset } from "./Fieldset";
export { Form } from "./Form";
export { Input } from "./Input";
export { SearchInput } from "./SearchInput";
export { default as ReadOnlyField } from "./ReadOnlyField";
export { RepeatingFieldset } from "./RepeatingFieldset";
export { SelectField } from "./SelectField";
export { TextareaField } from "./TextareaField";
export { NumberField } from "./NumberField";
export { IntegerField } from "./IntegerField";
export { Value, withFormValue, ErrorList } from "react-forms";
export { ViewValue } from "./ViewValue";

export { default as File } from "./File";
export { default as StoredFile } from "./StoredFile";
export { default as FileDownload } from "./FileDownload";
export { default as FileUploadField } from "./FileUploadField";
export type { layout } from "./Layout";
export { useFormLayout, useComputeFormLayout, FormLayout } from "./Layout";
export { useFormValue } from "react-forms";

import type { value, select } from "react-forms";

export type FieldProps = {|
  label?: string,
  hint?: string,
  select?: select,
  formValue?: value
|};
