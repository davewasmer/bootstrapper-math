/* global require, module */

var EmberApp = require('ember-cli/lib/broccoli/ember-app');

var app = new EmberApp();

app.import('bower_components/normalize.css/normalize.css');
app.import('bower_components/d3/d3.js');
app.import('bower_components/c3/c3.js');
app.import('bower_components/c3/c3.css');
app.import('bower_components/velocity/velocity.js');
app.import('bower_components/velocity/velocity.ui.js');
app.import('bower_components/tether-tooltip/tooltip.js');
app.import('bower_components/tether-tooltip/css/tooltip-theme-arrows.css');
app.import('bower_components/newton-raphson/index.js');

module.exports = app.toTree();
