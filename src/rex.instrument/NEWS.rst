*************************
REX.INSTRUMENT Change Log
*************************

.. contents:: Table of Contents


0.10.0 (xx/xx/2014)
===================

- Added ability to mark Instrument fields as containing PHI/PII.
- Enhanced Assessment.validate_data() method to perform Instrument-specific
  validation of the data structure, in addition to the base Common Assessment
  Document schema validation.
- Assessment data is now only validated upon complete, rather than on
  assigment.


0.9.1 (6/24/2014)
=================

- Packaging fix.


0.9.0 (6/24/2014)
==================

- Major overhaul of utility/interface classes.
- Moved schema validation logic of Instruments and Assessments from
  rex.validate into this module.
- Changed structure of Instrument and Assessment JSON representations.


0.2.0 (6/6/2014)
===============

- Fixed an issue Calculations and missing names.
- Added support for an "Edited" state, allowing measures to be edited after
  they are completed.


0.1.7 (3/27/2014)
=================

- Documentation updates in preparation for open-sourcing.


0.1.4
=====

- added calculation support;


0.1.3
=====

- added workaround for descriptor issue;


0.1.2
=====

- add warning when storage is broken;
- minor fixes;

