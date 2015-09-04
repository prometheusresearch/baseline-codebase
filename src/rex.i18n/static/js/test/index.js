/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var testsContext = require.context('.', true, /_spec$/);

testsContext.keys().forEach(testsContext);

