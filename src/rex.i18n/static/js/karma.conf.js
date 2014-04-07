module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '',
        frameworks: ['jasmine', 'browserify'],
        files: [
            'test/**/*.js'
        ],
        exclude: [
        ],
        preprocessors: {
            'test/**/*.js': ['browserify']
        },
        browserify: {
            watch: true,
            debug: true
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: false
    });
};

