/**
 * This models catalog metadata which is produced by rex.query backend.
 *
 * @flow
 */

import type { Domain, Type } from "./types";

import invariant from "invariant";

import * as t from "./Type";

export type CatalogEntityField = {
  label: string,
  title: string,
  column: ?{ type: string, enum: Array<string> },
  public: boolean,
  partial: boolean,
  plural: boolean,
  kind: string,
  link: ?{ target: string, inverse: string }
};

export type CatalogEntity = {
  name: string,
  label: string,
  field: Array<CatalogEntityField>
};

export type Catalog = {
  entity: Array<CatalogEntity>
};

/**
 * Known aggregate functions are hard-coded now.
 */
const aggregate = {
  count: {
    name: "count",
    title: "Count",
    makeType: typ => t.numberType(typ.domain),
    isAllowed: typ => typ.card === "seq"
  },
  exists: {
    name: "exists",
    title: "Exists",
    makeType: typ => t.booleanType(typ.domain),
    isAllowed: typ => typ.card === "seq"
  },
  sum: {
    name: "sum",
    title: "Sum",
    makeType: typ => t.numberType(typ.domain),
    isAllowed: typ =>
      typ.card === "seq" && isNumeric(typ) && isAdditionDefined(typ)
  },
  min: {
    name: "min",
    title: "Min",
    makeType: typ => t.numberType(typ.domain),
    isAllowed: typ => typ.card === "seq" && isNumeric(typ)
  },
  max: {
    name: "max",
    title: "Max",
    makeType: typ => t.numberType(typ.domain),
    isAllowed: typ => typ.card === "seq" && isNumeric(typ)
  },
  mean: {
    name: "mean",
    title: "Average",
    makeType: typ => t.numberType(typ.domain),
    isAllowed: typ =>
      typ.card === "seq" && isNumeric(typ) && isAdditionDefined(typ)
  }
};

function isAdditionDefined(type: Type) {
  return type.name === "number";
}

function isNumeric(type: Type) {
  return (
    type.name === "number" ||
    type.name === "date" ||
    type.name === "time" ||
    type.name === "datetime"
  );
}

export function toDomain(data: Catalog): Domain {
  let domain: Domain = { entity: {}, aggregate };
  let catalog: Catalog = data;
  catalog.entity.forEach(e => {
    let attribute = {};
    e.field.forEach(f => {
      attribute[f.label] = {
        title: f.title,
        type: getFieldType(domain, f)
      };
    });
    domain.entity[e.name] = {
      title: e.label,
      attribute
    };
  });
  return domain;
}

function getFieldType(domain: Domain, field: CatalogEntityField): Type {
  let type = getBaseFieldType(domain, field);
  if (field.plural) {
    type = t.seqType(type);
  } else if (field.partial) {
    type = t.optType(type);
  }
  return type;
}

function getBaseFieldType(domain: Domain, field: CatalogEntityField): Type {
  if (field.column != null) {
    switch (field.column.type) {
      case "text":
        return t.textType(domain);
      case "json":
        return t.jsonType(domain);
      case "enum":
        return t.enumerationType(domain, field.column.enum);
      case "boolean":
        return t.booleanType(domain);
      case "integer":
      case "decimal":
      case "float":
        return t.numberType(domain);
      case "date":
        return t.dateType(domain);
      case "time":
        return t.timeType(domain);
      case "datetime":
        return t.dateTimeType(domain);
      default:
        invariant(false, "Unknown column type: %s", field.column.type);
    }
  } else if (field.link != null) {
    return t.entityType(domain, field.link.target);
  } else if (field.kind === "calculation") {
    return t.textType(domain);
  } else {
    invariant(false, "Impossible");
  }
}
