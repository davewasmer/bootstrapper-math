import Ember from 'ember';

export default Ember.Component.extend({

  classNames: [ 'slider-input' ],

  disabled: false,
  isDragging: false,

  // Determines the steps by value changes
  scale: 1,
  // Determines how much drag distance results in one step change in value
  drag: 1,
  pixelDelta: 0,

  mouseDown: function(e) {
    if (!this.get('disabled')) {
      this.set('isDragging', true);
      var startPosition = { left: e.pageX, top: e.pageY };
      var startValue = this.get('value');
      var max = Number(this.get('max')), min = Number(this.get('min'));
      var self = this;

      Ember.$('body').addClass('slider-input-dragging');
      Ember.$(document).on('mousemove.slider-input', function(e) {
        var deltaX = Math.floor((e.pageX - startPosition.left) / Number(self.get('drag')));
        var deltaValue = deltaX * self.get('scale');
        var newValue = startValue + deltaValue;
        if (!isNaN(max)) { newValue = Math.min(newValue, max); }
        if (!isNaN(min)) { newValue = Math.max(newValue, min); }
        self.set('value', newValue);
      });
      Ember.$(document).one('mouseup', function(e) {
        Ember.$(document).off('mousemove.slider-input');
        Ember.$('body').removeClass('slider-input-dragging');
        self.set('isDragging', false);
        e.stopPropagation();
        return false;
      });
    }
  },

  click: function(e) {
    if (this.get('isDragging')) {
      e.stopPropagation();
      return false;
    }
  },

  mouseUp: function(e) {
    if (this.get('isDragging')) {
      e.stopPropagation();
      return false;
    }
  }

});