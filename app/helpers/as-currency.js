import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(value, options) {
  value = Number(value);
  if (options.hash.round) {
    value = Math.round(value);
  }
  var str = Number(value).toFixed(2);
  var parts = str.split('.');
  var integer = parts[0];
  var decimal = parts[1];
  var commaSeparated = '';
  while (integer.length > 3) {
    commaSeparated = ',' + integer.substr(integer.length - 3, 3) + commaSeparated;
    integer = integer.substr(0, integer.length - 3);
  }
  var result = '$' + integer + commaSeparated;
  if (!options.hash.round) {
    result += '.' + decimal;
  }
  return result;
});