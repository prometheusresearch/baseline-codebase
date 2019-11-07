/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type { I18N } from "rex-i18n";

import type {
  RIOSInstrument,
  RIOSType,
  RIOSField,
  RIOSRow,
  RIOSColumn,
  RIOSExtendedType,
  RIOSTypeCatalog,
  JSONSchemaExt,
  JSONSchemaExtension,
  JSONObjectSchema
} from "../types";

import invariant from "invariant";
import Validate, { isEmptyValue } from "./validate";

type Env = {
  i18n: I18N,
  types: RIOSTypeCatalog
};
type SchemaOptions = {|
  useLocaleForFields: Set<string>
|};

type ConfiguredEnv = Env & {
  validate: Validate,
  ...SchemaOptions
};

function getDateFormats(locale) {
  let date = new Date(Date.UTC(2019, 12, 31, 0, 0, 0));
  let options = { year: "numeric", month: "2-digit", day: "2-digit" };
  let parts = new Intl.DateTimeFormat(locale, options).formatToParts(date);

  let format = [];
  let patterns = [];
  parts.forEach(part => {
    switch (part.type) {
      case "year":
        format.push("YYYY");
        patterns.push("\\d\\d\\d\\d");
        break;
      case "month":
        format.push("MM");
        patterns.push(`\\d\\d`);
        break;
      case "day":
        format.push("DD");
        patterns.push(`\\d\\d`);
        break;
      case "literal":
        format.push("-");
        break;
    }
  });

  let dateRegex = new RegExp(`^${patterns.join("-")}$`);
  let dateFormat = format.join("");
  let dateInputMask = dateFormat.replace(/[MDY]/g, "9");
  let dateTimeRegex = new RegExp(
    `^${patterns.join("-")}T\\d\\d:\\d\\d(:\\d\\d)?$`
  );
  let dateTimeRegexBase = new RegExp(`^${patterns.join("-")}T\\d\\d:\\d\\d$`);
  let dateTimeFormatBase = `${dateFormat}THH:mm`;
  let dateTimeInputMaskBase = dateTimeFormatBase.replace(/[MDYHm]/g, "9");

  return {
    dateRegex,
    dateFormat,
    dateInputMask,
    dateTimeRegex,
    dateTimeRegexBase,
    dateTimeFormatBase,
    dateTimeInputMaskBase
  };
}

/**
 * Generate JSON schema for assessment document from instrument.
 */
export function fromInstrument(
  instrument: RIOSInstrument,
  env: Env,
  schemaOptions: SchemaOptions
): JSONSchemaExt {
  env = {
    ...env,
    types: instrument.types,
    validate: new Validate({ i18n: env.i18n })
  };
  let schema = {
    ...generateRecordSchema(instrument.record, "instrument", [], {
      ...env,
      ...schemaOptions
    }),
    format(value, schema) {
      let errorList = [];
      if (schema.event) {
        errorList = schema.event.validate(value);
      }
      return errorList.length === 0 ? true : errorList;
    }
  };

  return (schema: JSONSchemaExtension & JSONObjectSchema<JSONSchemaExt>);
}

function generateRecordSchema(
  record: Array<RIOSField>,
  context,
  eventKey: Array<string>,
  env: ConfiguredEnv
) {
  let properties = {};
  for (let i = 0; i < record.length; i++) {
    let field = record[i];
    properties[field.id] = generateFieldSchema(field, eventKey, env);
  }
  return {
    type: "object",
    properties: properties,
    instrument: {
      context,
      type: {
        base: "recordList",
        record
      }
    }
  };
}

function generateFieldSchema(
  field: RIOSField,
  eventKey: Array<string>,
  env: ConfiguredEnv
): JSONSchemaExt {
  const _env = env;

  eventKey = eventKey.concat(field.id);

  let annotationNeeded =
    !field.required && field.annotation && field.annotation !== "none";

  let explanationNeeded = field.explanation && field.explanation !== "none";

  let explanationRequired = field.explanation === "required";

  let annotationRequired = annotationNeeded && field.annotation === "required";

  let type = resolveType(field.type, _env.types);

  let schema = {
    type: "object",
    properties: {},
    required: [],
    form: {
      eventKey: eventKey.join(".")
    },
    instrument: {
      context: "field",
      field,
      type
    },
    format(value, _node) {
      if (annotationRequired) {
        if (isEmptyValue(value.value) && isEmptyValue(value.annotation)) {
          return {
            field: "annotation",
            message: _env.i18n.gettext(
              "You must provide a response for this field."
            )
          };
        }
      }
      return true;
    },
    onUpdate(value, { key }) {
      if (key === "value" && !isEmptyValue(value)) {
        value = { ...value, annotation: null };
      }
      return value;
    }
  };

  if (annotationNeeded) {
    schema.properties.annotation = { type: "string" };
  }

  if (explanationNeeded) {
    schema.properties.explanation = { type: "string" };
  }

  if (explanationRequired) {
    schema.required = schema.required || [];
    schema.required.push("explanation");
  }

  schema.properties.value = generateValueSchema(type, eventKey, env, field.id);
  if (field.required && ["recordList", "matrix"].indexOf(type.base) < 0) {
    schema.required = schema.required || [];
    schema.required.push("value");
  }
  invariant(schema.properties.value.instrument != null, "Incomplete schema");
  schema.properties.value.instrument.required = field.required;

  return schema;
}

export function generateValueSchema(
  type: RIOSExtendedType,
  eventKey: Array<string>,
  env: ConfiguredEnv,
  fieldId: string
): JSONSchemaExt {
  const { useLocaleForFields } = env;
  const shouldUseLocale = useLocaleForFields.has(fieldId);
  const {
    dateRegex,
    dateFormat,
    dateInputMask,
    dateTimeRegex,
    dateTimeRegexBase,
    dateTimeFormatBase,
    dateTimeInputMaskBase
  } = getDateFormats();

  switch (type.base) {
    case "float":
      return {
        type: "any",
        format: env.validate.number,
        instrument: { type }
      };
    case "integer":
      return {
        type: "any",
        format: env.validate.integer,
        instrument: { type }
      };
    case "text":
      return {
        type: "string",
        format: env.validate.text,
        instrument: { type }
      };
    case "boolean":
      return {
        type: "boolean",
        instrument: { type }
      };
    case "date":
      return {
        type: "string",
        format: env.validate.date,
        instrument: { type },
        dateFormat: shouldUseLocale ? dateFormat : undefined,
        dateRegex: shouldUseLocale ? dateRegex : undefined,
        dateInputMask: shouldUseLocale ? dateInputMask : undefined
      };
    case "time":
      return {
        type: "string",
        format: env.validate.time,
        instrument: { type }
      };
    case "dateTime":
      return {
        type: "string",
        format: env.validate.dateTime,
        instrument: { type },
        dateFormat: shouldUseLocale ? dateFormat : undefined,
        dateRegex: shouldUseLocale ? dateRegex : undefined,
        dateInputMask: shouldUseLocale ? dateInputMask : undefined,
        dateTimeRegex: shouldUseLocale ? dateTimeRegex : undefined,
        dateTimeRegexBase: shouldUseLocale ? dateTimeRegexBase : undefined,
        dateTimeFormatBase: shouldUseLocale ? dateTimeFormatBase : undefined,
        dateTimeInputMaskBase: shouldUseLocale
          ? dateTimeInputMaskBase
          : undefined
      };
    case "recordList":
      invariant(type.record != null, "Invalid recordList type");
      return {
        type: "array",
        items: generateRecordSchema(
          type.record,
          "recordListRecord",
          eventKey,
          env
        ),
        format: env.validate.recordList,
        instrument: {
          type,
          context: "recordList"
        }
      };
    case "enumeration":
      invariant(
        typeof type.enumerations === "object",
        "Invalid enumeration type"
      );
      return {
        enum: Object.keys(type.enumerations),
        instrument: { type }
      };
    case "enumerationSet":
      invariant(
        typeof type.enumerations === "object",
        "Invalid enumerationSet type"
      );
      return {
        type: "array",
        format: env.validate.enumerationSet,
        instrument: { type },
        items: { enum: Object.keys(type.enumerations), instrument: { type } }
      };
    case "matrix": {
      const { rows, columns } = type;
      invariant(rows, "Missing rows specification for matrix field");
      invariant(columns, "Missing columns specification for matrix field");
      let properties = {};
      rows.forEach(row => {
        properties[row.id] = generateMatrixRowSchema(
          row,
          columns,
          eventKey,
          env
        );
      });
      return {
        type: "object",
        format: env.validate.matrix,
        instrument: {
          type,
          context: "matrix"
        },
        properties
      };
    }
    default:
      throw new Error("unknown type: " + JSON.stringify(type));
  }
}

function generateMatrixRowSchema(
  row: RIOSRow,
  columns: Array<RIOSColumn>,
  eventKey: Array<string>,
  env: ConfiguredEnv
) {
  eventKey = eventKey.concat(row.id);
  let node = {
    type: "object",
    format: env.validate.matrixRow,
    properties: {},
    required: [],
    instrument: {
      ...row,
      context: "matrixRow",
      required: row.required,
      requiredColumns: []
    }
  };
  columns.forEach(column => {
    node.properties[column.id] = generateMatrixColumnSchema(
      column,
      eventKey,
      env
    );
    if (column.required) {
      node.instrument.requiredColumns.push(column.id);
    }
  });
  return node;
}

function generateMatrixColumnSchema(column, eventKey, env) {
  column = {
    ...column,
    required: false
  };
  return generateFieldSchema(column, eventKey, env);
}

/**
 * Returns true for types which can be described by only their names.
 */
function isSimpleFieldType(type) {
  return (
    type === "float" ||
    type === "integer" ||
    type === "text" ||
    type === "boolean" ||
    type === "date" ||
    type === "time" ||
    type === "dateTime"
  );
}

/**
 * Returns true for base types.
 */
function isBaseFieldType(type) {
  return (
    isSimpleFieldType(type) ||
    type === "enumeration" ||
    type === "enumerationSet" ||
    type === "matrix" ||
    type === "recordList"
  );
}

/**
 * Resolve type using the type collection.
 *
 * @returns A constained type representation.
 */
export function resolveType(
  type: RIOSType,
  types: RIOSTypeCatalog,
  asBase: boolean = false
): RIOSExtendedType {
  if (isSimpleFieldType(type)) {
    return { base: type };
  } else if (asBase && isBaseFieldType(type)) {
    return { base: type };
  } else if (typeof type === "string") {
    return resolveType(types[type], types);
  } else {
    let resolvedType = resolveType(type.base, types, true);
    return {
      ...resolvedType,
      ...type,
      base: resolvedType.base
    };
  }
}
