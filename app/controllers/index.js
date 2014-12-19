import Ember from 'ember';

export default Ember.Controller.extend({

  numberOfMonths: 12,
  unitPrice: 50,
  growthRate: 0.10,
  growthMin: 3,
  growthCap: 200,
  churnRate: 0.10,
  churnMin: 1,
  processingPercent: 0.029,
  processingFixedFee: 0.30,
  goalAmount: 75000,

  growthPercent: function(key, value) {
    if (arguments.length > 1) {
      this.set('growthRate', Number(value) / 100);
    }
    return Math.round(this.get('growthRate') * 100);
  }.property('growthRate'),

  churnPercent: function(key, value) {
    if (arguments.length > 1) {
      this.set('churnRate', Number(value) / 100);
    }
    return Math.round(this.get('churnRate') * 100);
  }.property('churnRate'),

  months: function() {
    var months = [];
    for (var i=0; i < this.get('numberOfMonths'); i++) {
      months.push(i + 1);
    }
    return months;
  }.property('numberOfMonths'),

  customersByMonth: function() {
    var self = this;
    var customersByMonth = [];
    self.get('months').reduce(function(totalCustomers) {
      var newCustomers = Math.max(totalCustomers * self.get('growthRate'), self.get('growthMin'));
      var churnedCustomers = Math.max(totalCustomers * self.get('churnRate'), self.get('churnMin'));
      var netCustomers = Math.round(totalCustomers + newCustomers - churnedCustomers);
      var totalCustomers = Math.min(netCustomers, self.get('growthCap'));
      customersByMonth.push(totalCustomers);
      return totalCustomers;
    }, 0);
    return customersByMonth;
  }.property('months.[]', 'growthRate', 'churnRate', 'growthCap'),

  grossRevenueByMonth: function() {
    var self = this;
    return self.get('customersByMonth').map(function(numberOfCustomers) {
      return numberOfCustomers * self.get('unitPrice');
    });
  }.property('customersByMonth', 'unitPrice'),

  processingFeesByMonth: function() {
    var self = this;
    return self.get('grossRevenueByMonth').map(function(grossRevenue, monthNumber) {
      var percentageFees = grossRevenue * self.get('processingPercent');
      var numberOfTransactions = self.get('customersByMonth').objectAt(monthNumber)
      var fixedFees = numberOfTransactions * self.get('processingFixedFee');
      return percentageFees + fixedFees;
    });
  }.property('grossRevenueByMonth', 'processingPercent', 'processingFixedFee', 'customersByMonth'),

  netRevenueByMonth: function() {
    var self = this;
    return self.get('grossRevenueByMonth').map(function(grossRevenue, monthNumber) {
      var processingFees = self.get('processingFeesByMonth').objectAt(monthNumber)
      return grossRevenue - processingFees;
    })
  }.property('grossRevenueByMonth', 'processingFeesByMonth'),

  cumulativeRevenueByMonth: function() {
    var cumulativeRevenueByMonth = [];
    this.get('netRevenueByMonth').reduce(function(cumulativeRevenueSoFar, thisMonthsRevenue) {
      var cumulativeRevenue = cumulativeRevenueSoFar + thisMonthsRevenue;
      cumulativeRevenueByMonth.push(cumulativeRevenue);
      return cumulativeRevenue;
    }, 0);
    return cumulativeRevenueByMonth;
  }.property('netRevenueByMonth'),

  columns: function() {
    return [
      [ 'Monthly Revenue' ].concat(this.get('netRevenueByMonth')),
      [ 'Cumulative Revenue' ].concat(this.get('cumulativeRevenueByMonth'))
    ];
  }.property('netRevenueByMonth', 'cumulativeRevenueByMonth'),

  grossRevenue: Ember.computed.sum('grossRevenueByMonth'),

  processingFees: Ember.computed.sum('processingFeesByMonth'),

  netRevenue: Ember.computed.sum('netRevenueByMonth'),

  incomeTaxRate: 0.25,

  selfEmploymentTaxRate: 0.15,

  incomeTaxes: function() {
    return this.get('netRevenue') * this.get('incomeTaxRate');
  }.property('netRevenue', 'incomeTaxRate'),

  selfEmploymentTaxes: function() {
    return this.get('netRevenue') * this.get('selfEmploymentTaxRate');
  }.property('netRevenue', 'selfEmploymentTaxRate'),

  netTaxes: function() {
    return this.get('incomeTaxes') + this.get('selfEmploymentTaxes')
  }.property('incomeTaxes', 'selfEmploymentTaxes'),

  afterTaxIncome: function() {
    return this.get('netRevenue') - this.get('netTaxes');
  }.property('netRevenue', 'netTaxes')

});