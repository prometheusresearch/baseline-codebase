/**
 * @noflow
 */

jest.mock("../generateUniqueId");

// $FlowIssue: fix jest typings
expect.addSnapshotSerializer({
  print(val, serialize, indent) {
    switch (val.type) {
      case "stack": {
        const columnList = val.columnList.map(c => serialize(c)).join(",\n");
        return `Stack {\n${indent(columnList)}\n}`;
      }
      case "group": {
        const columnList = val.columnList.map(c => serialize(c)).join(",\n");
        return `Group {\n${indent(columnList)}\n}`;
      }
      case "field": {
        return `Field { dataKey = "${val.field.dataKey.join(".")}" }`;
      }
      default:
        return "ok";
    }
  },

  test(val) {
    return isColumnConfig(val);
  }
});

import { isColumnConfig } from "../ui/datatable";
import { fromQuery } from "../DataTableColumnConfig";
import * as Catalog from "../model//RexQueryCatalog";
import {
  inferType,
  here,
  navigate,
  select,
  aggregate,
  pipeline
} from "../model/Query";
import generateUniqueId from "../generateUniqueId";

generateUniqueId.mockReturnValue("FAKE_QUERY_ID");

const catalog: Catalog.Catalog = require("../model/__tests__/catalog.json");
const domain = Catalog.toDomain(catalog);

const nation = navigate("nation");
const region = navigate("region");
const customer = navigate("customer");
const name = navigate("name");
const count = aggregate("count");

const configureFromQuery = (query, focus) => {
  query = inferType(domain, query);
  return fromQuery(query, focus);
};

test("nation", function() {
  const conf = configureFromQuery(pipeline(here, nation));
  expect(conf).toMatchSnapshot();
});

test("nation.name", function() {
  const conf = configureFromQuery(pipeline(here, nation, name), ["name"]);
  expect(conf).toMatchSnapshot();
});

test("nation:select(name)", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      nation,
      select({
        name: pipeline(name)
      })
    ),
    ["nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("nation:select(region)", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      nation,
      select({
        region: pipeline(region)
      })
    ),
    ["nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("nation:select(region:select(name))", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      nation,
      select({
        region: pipeline(
          region,
          select({
            name: pipeline(name)
          })
        )
      })
    ),
    ["nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation) @ region", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(nation)
      })
    ),
    ["region"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation) @ region.nation", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(nation)
      })
    ),
    ["region", "nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:select(name)) @ region", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(nation, select({ name: pipeline(name) }))
      })
    ),
    ["region"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:select(name)) @ region.nation", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(nation, select({ name: pipeline(name) }))
      })
    ),
    ["region", "nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:select(customer:select(name))) @ region", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(
          nation,
          select({
            customer: pipeline(
              customer,
              select({
                name: pipeline(name)
              })
            )
          })
        )
      })
    ),
    ["region"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:select(customer:select(name))) @ region.nation", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(
          nation,
          select({
            customer: pipeline(
              customer,
              select({
                name: pipeline(name)
              })
            )
          })
        )
      })
    ),
    ["region", "nation"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:select(customer:select(name))) @ region.nation.customer", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nation: pipeline(
          nation,
          select({
            customer: pipeline(
              customer,
              select({
                name: pipeline(name)
              })
            )
          })
        )
      })
    ),
    ["region", "nation", "customer"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:count()) @ region", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nationCount: pipeline(nation, count)
      })
    ),
    ["region"]
  );
  expect(conf).toMatchSnapshot();
});

test("region:select(nation:count()) @ region.nationCount", function() {
  const conf = configureFromQuery(
    pipeline(
      here,
      region,
      select({
        nationCount: pipeline(nation, count)
      })
    ),
    ["region", "nationCount"]
  );
  expect(conf).toMatchSnapshot();
});
