******************************
REX.FORM_PREVIEWER Usage Guide
******************************

.. contents:: Table of Contents


Overview
========

This package contains the RexAcquire Form Previewer Applet. 

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the Apache v2 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. |R| unicode:: 0xAE .. registered trademark sign


Applet-Embeddable Entry Points
==============================

rex.form_previewer:/
-----------------------

This URL accepts the following querystring parameters:

form_id
    The UID of the DraftForm that you want to view. Either this parameter or
    ``instrument_id`` must be specified.

instrument_id
    The UID of the DraftInstrumentVersion that you want to view. Either this
    parameter or ``form_id`` must be specified.

category
    This is either ``draft`` or ``published``, indicating whether or not the
    ``form_id``/``instrument_id`` that is specified is a draft configuration or
    a published configuration. If not specified, it defaults to ``draft``.

return_url
    The URL to send the user back to when they press the "Return" button. This
    is optional.

