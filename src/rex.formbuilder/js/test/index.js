/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var testsContext = require.context('.', true, /_test$/);

testsContext.keys().forEach(testsContext);

