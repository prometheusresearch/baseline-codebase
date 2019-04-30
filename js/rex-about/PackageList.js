/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";

type Props = {
  packages?: Package[]
};

export type Package = {
  name: string,
  version: string,
  license: string,
  author: string,
  homepage?: string
};

function PackageList(props: Props) {
  if (!props.packages) {
    return null;
  }

  let packages = props.packages.map(pkg => {
    var name = pkg.name;
    if (pkg.homepage) {
      name = <a href={pkg.homepage}>{name}</a>;
    }

    return (
      <mui.TableRow key={pkg.name}>
        <mui.TableCell>{name}</mui.TableCell>
        <mui.TableCell>{pkg.version}</mui.TableCell>
        <mui.TableCell>{pkg.license}</mui.TableCell>
        <mui.TableCell>{pkg.author}</mui.TableCell>
      </mui.TableRow>
    );
  });

  return (
    <mui.Table>
      <mui.TableHead>
        <mui.TableRow>
          <mui.TableCell>Component</mui.TableCell>
          <mui.TableCell>Version</mui.TableCell>
          <mui.TableCell>License</mui.TableCell>
          <mui.TableCell>Author</mui.TableCell>
        </mui.TableRow>
      </mui.TableHead>
      <tbody>{packages}</tbody>
    </mui.Table>
  );
}

export default PackageList;
