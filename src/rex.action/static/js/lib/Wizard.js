/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import DeprecatedComponent  from 'rex-widget/lib/DeprecatedComponent';
import SideBySideWizard     from './side-by-side/Wizard';

@DeprecatedComponent('use <RexAction.SideBySideWizard /> instead', 'RexAction.Wizard')
export default class Wizard extends SideBySideWizard {

}
