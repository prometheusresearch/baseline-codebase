/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import Preloader          from './Preloader';
import DataSet            from './DataSet';
import {VBox}             from './Layout';

/**
 * Show preloader when one or more datasets passed as props are not yet loaded.
 *
 * For example::
 *
 *    <ShowPreloader data={dataSet}>
 *      <children components ... />
 *    </ShowPreloader>
 *
 * won't render its children before ``data`` is loaded.
 *
 * @public
 */
export default class ShowPreloader extends React.Component {

  static propTypes = {

    /**
     * Show preloader when no data is fetched.
     */
    showPreloaderWhenNoData: PropTypes.bool
  };

  static defaultProps = {
    showPreloaderWhenNoData: false
  };

  render() {
    let {children, showPreloaderWhenNoData, ...props} = this.props;
    let datasets = Object
      .keys(props)
      .map(key => props[key])
      .filter(prop => (prop instanceof DataSet));
    let showPreloader = (
      datasets.some(d => d.loading) ||
      showPreloaderWhenNoData && datasets.some(d => d.data === null)
    );
    if (showPreloader) {
      return <Preloader />
    } else {
      if (React.Children.count(children) > 1) {
        return <VBox>{children}</VBox>;
      } else {
        return children;
      }
    }
  }
}
