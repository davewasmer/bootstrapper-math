import Ember from 'ember';

export default Ember.Component.extend({

  classNames: [ 'line-chart' ],

  columns: [],

  targetAmount: 100000,

  ymax: function() {
    var columnMax = d3.max(this.get('columns').map(function(column) {
     return d3.max(column.slice(1));
    }));
    return Math.max(columnMax, this.get('targetAmount'));
  }.property('columns.@each', 'targetAmount'),
  
  renderChart: function() {
    this.chart = c3.generate({
      bindto: this.$(".chart").get(0),
      data: { 
        columns: this.get('columns')
      },
      legend: {
        show: false
      },
      axis: {
        x: {
          tick: {
            format: function(x) { return x + 1; }
          }
        },
        y: {
          max: Math.max(this.get('targetAmount'), this.get('ymax') * 1.15),
          min: 0,
          label: 'Monthly Revenue',
          tick: {
            format: d3.format('$,')
          }
        }
      },
      grid: {
        y: {
          lines: [
            { value: this.get('targetAmount'), text: 'Goal', 'class': 'goal-line' }
          ]
        },
        x: {
          lines: [
            { value: 12, text: '1 Year' },
            { value: 24, text: '2 Years' }
          ]
        }
      }
    });
  }.on('didInsertElement'),

  updateChart: function() {
    this.chart.load({
      columns: this.get('columns')
    });
  }.observes('columns.@each')

});
