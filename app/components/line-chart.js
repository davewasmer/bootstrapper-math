import Ember from 'ember';

export default Ember.Component.extend({

  classNames: [ 'line-chart' ],

  series: [
    /*
     * {
     *   label: 'Series Label',
     *   values: [ ... ],
     *   units: 'each' | 'currency'
     * }
     */
  ],

  ySeries: Ember.computed.filterBy('series', 'units', 'currency'),
  y2Series: Ember.computed.filterBy('series', 'units', 'each'),
  yMax: function() {
    return d3.max(this.get('ySeries').map(function(series) {
     return d3.max(series.values);
    }));
  }.property('ySeries'),
  y2Max: function() {
    return d3.max(this.get('y2Series').map(function(series) {
     return d3.max(series.values);
    }));
  }.property('y2Series'),

  columns: function() {
    return this.get('series').map(function(series) {
      return [ series.label ].concat(series.values);
    });
  }.property('series'),

  axes: function() {
    var axesMap = {};
    this.get('series').map(function(series) {
      var axis = series.units === 'each' ? 'y2' : 'y';
      axesMap[series.label] = axis;
    });
    return axesMap;
  }.property('series.@each.axis'),

  types: function() {
    var typesMap = {};
    this.get('series').map(function(series) {
      typesMap[series.label] = series.type || 'area';
    });
    return typesMap;
  }.property('series.@each.type'),

  colors: function() {
    return this.get('series').map(function(series) {
      return series.color || '#fff';
    });
  }.property('series.@each.color'),
  
  renderChart: function() {
    this.chart = c3.generate({
      bindto: this.$(".chart").get(0),
      size: {
        width: 560
      },
      data: { 
        columns: this.get('columns'),
        types: this.get('types'),
        axes: this.get('axes')
      },
      color: {
        pattern: this.get('colors')
      },
      point: {
        show: false
      },
      padding: {
        top: 0,
        left: 40,
        right: 10,
        bottom: 0
      },
      legend: {
        show: false
      },
      tooltip: {
        format: {
          value: d3.format('$,.2s')
        }
      },
      axis: {
        x: {
          show: false,
          tick: {
            format: function(x) { return 'Month ' + (x + 1); }
          }
        },
        y: {
          max: Math.max(this.get('targetAmount'), this.get('yMax') * 1.15),
          min: 0,
          tick: {
            format: d3.format('$,s')
          }
        },
        y2: {
          show: this.get('y2Series.length') > 0,
          max: this.get('y2Max') * 1.15,
          min: 0
        }
      },
      grid: {
        y: {
          lines: [
            { value: this.get('targetAmount'), text: 'Goal', 'class': 'goal-line' }
          ]
        },
        x: {
          lines: (function(){
            var yearMarkers = [{ value: 12, text: '1 Year'}];
            var i = 2;
            while (i < 20) {
              yearMarkers.push({ value: i * 12, text: i + ' Years'});
              i += 1;
            }
            return yearMarkers;
          })()
        }
      }
    });
  }.on('didInsertElement'),

  updateData: function() {
    this.chart.load({
      columns: this.get('columns')
    });
  }.observes('columns.@each'),

  updateTarget: function() {
    var chart = window.c = this.chart;
    var targetAmount = this.get('targetAmount');

    chart.ygrids.remove({ 'class': 'goal-line' });
    chart.ygrids.add({ value: targetAmount, text: 'Goal', 'class': 'goal-line' });
    chart.axis.max({ y: targetAmount * 1.15 });
    setTimeout(function(){
      chart.flush();
    }, 500);
  }.observes('targetAmount')

});
