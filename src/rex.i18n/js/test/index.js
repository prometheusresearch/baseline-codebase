/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


var testsContext = require.context('.', true, /-test$/);

testsContext.keys().forEach(testsContext);

