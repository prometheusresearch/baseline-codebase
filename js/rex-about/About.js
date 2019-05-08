/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { Action } from "rex-action";

import PackageList, { type Package } from "./PackageList";

type Props = {
  title?: string,
  license?: string,
  overview?: string,
  environmentPackages: {
    application_package: Package,
    other_packages: Package[],
    rex_packages: Package[]
  }
};

type TabId = "overview" | "rex-components" | "other-components" | "license";

function About({
  title = "About this RexDB Application",
  license,
  overview,
  environmentPackages
}: Props) {
  let [activeTab, setActiveTab] = React.useState<TabId>("overview");

  return (
    <Action title={title}>
      <mui.Tabs
        indicatorColor="primary"
        textColor="primary"
        value={activeTab}
        onChange={(_ev, activeTab) => setActiveTab(activeTab)}
      >
        <mui.Tab label="Overview" value="overview" />
        <mui.Tab label="RexDB Components" value="rex-components" />
        <mui.Tab label="Other Components" value="other-components" />
        <mui.Tab label="License" value="license" />
      </mui.Tabs>

      {activeTab === "overview" && (
        <TabContainer>
          {environmentPackages.application_package && (
            <div>
              <h2
                style={{
                  fontWeight: "normal"
                }}
              >
                You are using
                <span
                  style={{
                    fontWeight: "bold",
                    paddingLeft: "0.5ch"
                  }}
                >
                  {environmentPackages.application_package.name}
                </span>
                <span
                  style={{
                    fontWeight: "bold",
                    paddingLeft: "0.5ch"
                  }}
                >
                  v{environmentPackages.application_package.version}
                </span>
              </h2>
            </div>
          )}
          <div
            dangerouslySetInnerHTML={{ __html: overview }}
            style={{
              textAlign: "justify"
            }}
          />
        </TabContainer>
      )}
      {activeTab === "rex-components" && (
        <TabContainer>
          <PackageList packages={environmentPackages.rex_packages} />
        </TabContainer>
      )}
      {activeTab === "other-components" && (
        <TabContainer>
          <PackageList packages={environmentPackages.other_packages} />
        </TabContainer>
      )}
      {activeTab === "license" && (
        <TabContainer>
          <div
            dangerouslySetInnerHTML={{ __html: license }}
            style={{
              textAlign: "justify"
            }}
          />
        </TabContainer>
      )}
    </Action>
  );
}

function TabContainer(props) {
  return (
    <mui.Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </mui.Typography>
  );
}

export default About;
