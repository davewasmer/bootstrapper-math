import Ember from 'ember';

export default Ember.Handlebars.makeBoundHelper(function(value, options) {
  if (options.hash.round === false) {
    return (Number(value) * 100).toFixed(1) + '%';
  } else {
    return Math.round(Number(value) * 100) + '%';
  }
});