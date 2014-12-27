import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(value, options) {
  value = Number(value);
  var format = '$,';
  if (options.hash.round) {
    if (Ember.typeOf(options.hash.round) === 'boolean') {
      format += '.0f';
    } else {
      format += '.' + options.hash.round + 'r';
    }
  }
  return d3.format(format)(value);
});