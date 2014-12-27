import Ember from 'ember';

export default Ember.View.extend({

  stickifyHeader: function() {
    var $header = this.$('.header-row');
    var stuck = false;
    var $placeholder, originalPosition;

    Ember.$(document).on('scroll', function() {
      var scrollTop = Ember.$(document).scrollTop();
      if (!stuck) {
        var position = $header.offset().top;
        if (scrollTop > position) {
          originalPosition = position;
          stick();
        }
      } else {
        if (scrollTop < originalPosition) {
          unstick();
        }
      }
    });

    function stick() {
      $placeholder = Ember.$("<div class='header-row-placeholder'>").height($header.outerHeight());
      $header.after($placeholder);
      $header.width($header.width()).addClass('stick');
      stuck = true;
    }
    function unstick() {
      $placeholder.remove();
      $header.css('width', 'auto').removeClass('stick');
      stuck = false;
    }
  }.on('didInsertElement'),

  setupTooltips: function() {
    this.$('.tooltip-target').each(function(i, el) {
      var $el = Ember.$(el);
      var content = $el.data('tooltip-content');
      if (content[0] === '#') {
        content = Ember.$(content).get(0);
      }
      new Tooltip({
        target: el,
        position: Ember.$(el).data('data-tooltip-position') || 'top center',
        content: content
      });
    });
  }.on('didInsertElement'),

  actions: {
    showMeHow: function() {
      this.$('.container').velocity({
        top: [ 0, 100],
        opacity: [ 1, 0 ]
      }, { 
        duration: 1000,
        easing: [ 300, 20 ],
        display: 'block'
      });
      this.$('.show-me-how-button').velocity({
        top: this.$('.show-me-how-button').offset().top - 50,
        opacity: [ 0, 1 ],
        scale: [ 0.8, 1 ]
      }, { 
        duration: 800,
        easing: [ 300, 20 ],
        display: 'none'
      });
      this.$('.headline').velocity({
        marginTop: '3rem',
        marginBottom: '1rem',
        fontSize: '1.2rem'
      }, { 
        duration: 1000,
        easing: [ 300, 20 ]
      });
    }
  }
});