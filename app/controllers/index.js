/*global newtonRaphson:false */

import Ember from 'ember';
import 'bower_components/newton-raphson/index';

export default Ember.Controller.extend({

  queryParams: [
    'salary',
    'timespan',
    'processingPercent',
    'processingFixedFee',
    'churnRate',
    'churnMin',
    'businessTaxPercent',
    'unitPrice',
    'growthRate',
    'growthAmount',
    'growthIsPercent',
    'growthMin',
    'growthCap',
    'growthSeed',
    'isGrowthCapped'
  ],

  // 
  // Page controls
  // 

  showMeHow: false,
  showCalculations: false,

  // 
  // Goals
  // 

  salary: 60000,
  timespan: 12,
  monthlyRevenue: function(key, value) {
    if (arguments.length > 1) {
      this.set('salary', value * 12);
    }
    return this.get('salary') / 12;
  }.property('salary'),
  annualIncomeGoal: Ember.computed.alias('salary'),
  monthlyIncomeGoal: function() {
    return this.get('annualIncomeGoal') / 12;
  }.property('annualIncomeGoal'),

  // Credit card processing
  processingPercent: 0.029,
  processingFixedFee: 0.30,

  // Churn
  churnRate: 0.10,
  churnMin: 0,

  // Taxes
  businessTaxPercent: 0.15,

  // 
  // Income
  // 

  // Pricing
  unitPrice: 50,

  // Growth
  growthRate: 0.10,
  growthAmount: 1,
  growthIsPercent: true,
  growthIsAbsolute: function(key, value) {
    if (arguments.length > 1) {
      this.set('growthIsPercent', !value);
    }
    return !this.get('growthIsPercent');
  }.property('growthIsPercent'),
  growthMin: 3,
  growthCap: 200,
  growthSeed: 10,
  isGrowthCapped: false,



  // 
  // Calculations
  // 

  months: function() {
    var months = [];
    var i = 0;
    while (i < this.get('timespan')) {
      months.push(i);
      i++;
    }
    return months;
  }.property('timespan'),

  projection: function() {
    var projectedMonths = [];
    this.get('months').forEach(function(_, monthIndex) {
      var previousMonth;
      if (monthIndex === 0) {
        previousMonth = {
          customers: this.get('growthSeed'),
          totalIncome: 0
        };
      } else {
        previousMonth = projectedMonths[monthIndex - 1];
      }

      // Growth
      var newCustomers      = this.get('growthIsPercent') ?
        Math.max(Math.round(previousMonth.customers * this.get('growthRate')), this.get('growthMin'))
        : this.get('growthAmount');
      var churnedCustomers  = Math.max(Math.floor(previousMonth.customers * this.get('churnRate')), this.get('churnMin'));
      var netCustomers      = previousMonth.customers + newCustomers - churnedCustomers;
      var customers         = this.get('isGrowthCapped') ?
        Math.min(netCustomers, this.get('growthCap'))
        : netCustomers;

      // Revenue
      var revenue            = customers * this.get('unitPrice');

      // Expenses
      var creditCardPercent = revenue * this.get('processingPercent');
      var creditCardFixed   = customers * this.get('processingFixedFee');
      var taxes             = revenue * this.get('businessTaxPercent');
      var expenses          = creditCardPercent + creditCardFixed + taxes;

      // Income
      var monthlyIncome     = revenue - expenses;
      var totalIncome       = previousMonth.totalIncome + monthlyIncome;

      projectedMonths.push({
        monthNumber: monthIndex + 1,
        newCustomers: newCustomers,
        churnedCustomers: churnedCustomers,
        netCustomers: netCustomers,
        customers: customers,
        revenue: revenue,
        taxes: taxes,
        creditCardPercent: creditCardPercent,
        creditCardFixed: creditCardFixed,
        expenses: expenses,
        monthlyIncome: monthlyIncome,
        totalIncome: totalIncome
      });
    }, this);
    return projectedMonths;
  }.property(
    'months',
    'growthSeed',
    'growthAmount',
    'growthRate',
    'growthMin',
    'churnRate',
    'churnMin',
    'growthCap',
    'unitPrice',
    'processingPercent',
    'processingFixedFee'
  ),

  newCustomersByMonth:      function() { return this.get('projection').mapBy('newCustomers');  }.property('projection'),
  churnedCustomersByMonth:  function() { return this.get('projection').mapBy('churnedCustomers');  }.property('projection'),
  netCustomersByMonth:      function() { return this.get('projection').mapBy('netCustomers');  }.property('projection'),
  customersByMonth:         function() { return this.get('projection').mapBy('customers');  }.property('projection'),
  revenueByMonth:           function() { return this.get('projection').mapBy('revenue');  }.property('projection'),
  creditCardPercentByMonth: function() { return this.get('projection').mapBy('creditCardPercent');  }.property('projection'),
  creditCardFixedByMonth:   function() { return this.get('projection').mapBy('creditCardFixed');  }.property('projection'),
  expensesByMonth:          function() { return this.get('projection').mapBy('expenses');  }.property('projection'),
  monthlyIncomeByMonth:     function() { return this.get('projection').mapBy('monthlyIncome');  }.property('projection'),
  totalIncomeByMonth:       function() { return this.get('projection').mapBy('totalIncome');  }.property('projection'),

  totalNewCustomers:         Ember.computed.sum('newCustomersByMonth'),
  totalChurnedCustomers:     Ember.computed.sum('churnedCustomersByMonth'),
  totalCustomers:            Ember.computed.alias('customersByMonth.lastObject'),
  totalCustomerMonths:       Ember.computed.sum('customersByMonth'),
  totalRevenue:              Ember.computed.sum('revenueByMonth'),
  totalCreditCardPercent:    Ember.computed.sum('creditCardPercentByMonth'),
  totalCreditCardFixed:      Ember.computed.sum('creditCardFixedByMonth'),
  totalExpenses:             Ember.computed.sum('expensesByMonth'),
  totalIncome:               Ember.computed.sum('monthlyIncomeByMonth'),

  // 
  // Charting
  // 

  visibleSeries: {
    newCustomers:      false,
    churnedCustomers:  false,
    customers:         false,
    revenue:           false,
    monthlyIncome:     true,
    totalIncome:       true
  },

  seriesNames: [
    'newCustomers',
    'churnedCustomers',
    'customers',
    'revenue',
    'monthlyIncome',
    'totalIncome'
  ],

  seriesUnits: {
    newCustomers:      'each',
    churnedCustomers:  'each',
    customers:         'each',
    revenue:           'currency',
    monthlyIncome:     'currency',
    totalIncome:       'currency'
  },

  series: function() {
    return this.get('seriesNames')
    .filter(function(seriesName) {
      return this.get('visibleSeries.' + seriesName);
    }, this)
    .map(function(seriesName) {
      return {
        label: seriesName.dasherize().capitalize().replace('-', ' '),
        values: this.get(seriesName + 'ByMonth'),
        units: this.get('seriesUnits.' + seriesName)
      };
    }, this);
  }.property(
    'newCustomersByMonth',
    'churnedCustomersByMonth',
    'customersByMonth',
    'revenueByMonth',
    'monthlyIncomeByMonth',
    'totalIncomeByMonth'
  ),


  // 
  // Annual figures
  // 

  businessTaxes: function() {
    return this.get('totalIncome') * this.get('businessTaxPercent');
  }.property('totalIncome', 'businessTaxPercent'),

  salaryEquivalentIncome: function() {
    return this.get('totalIncome') - this.get('businessTaxes');
  }.property('totalIncome', 'businessTaxes'),

  // 
  // Results and Deltas
  // 

  // How far from our goal are we?
  delta: function() {
    return this.get('totalIncome') - this.get('annualIncomeGoal');
  }.property('annualIncomeGoal', 'totalIncome'),
  isShortOfGoal: Ember.computed.lt('delta', 0),
  isOverGoal: Ember.computed.gt('delta', 0),
  displayDelta: function() {
    return Math.abs(this.get('delta'));
  }.property('delta'),

  // The revenue delta including CC variable fees and taxes
  deltaWithVariableExpenses: function() {
    var delta = this.get('delta');
    var taxBurden = (delta / (1 - this.get('businessTaxPercent'))) - delta;
    var processingPercentBurden = (delta / (1 - this.get('processingPercent'))) - delta;
    return delta + taxBurden + processingPercentBurden;
  }.property('delta', 'processingPercent', 'businessTaxPercent'),

  revenueGoal: function() {
    var incomeGoal = this.get('annualIncomeGoal');
    var taxBurden = (incomeGoal / (1 - this.get('businessTaxPercent'))) - incomeGoal;
    var processingPercentBurden = (incomeGoal / (1 - this.get('processingPercent'))) - incomeGoal;
    var processingFixedFeeBurden = this.get('totalCustomerMonths') * this.get('processingFixedFee');
    return incomeGoal + taxBurden + processingPercentBurden + processingFixedFeeBurden;
  }.property('annualIncomeGoal', 'processingPercent', 'businessTaxPercent'),

  // Holding everything else constant, what's the change in price needed to hit the goal
  priceDeltaToHitGoal: function() {
    return Math.ceil(Math.abs(this.get('deltaWithVariableExpenses')) / this.get('totalCustomerMonths'));
  }.property('deltaWithVariableExpenses', 'totalCustomerMonths'),
  priceToHitGoal: function() {
    return this.get('unitPrice') + this.get('priceDeltaToHitGoal');
  }.property('unitPrice', 'priceDeltaToHitGoal'),

  // Holding everything else constant, how many new customer months would we need to make up the difference.
  deltaCustomerMonthsNeededToHitGoal: function() {
    return Math.abs(this.get('deltaWithVariableExpenses') / (this.get('unitPrice') - this.get('processingFixedFee')));
  }.property('deltaWithVariableExpenses', 'unitPrice', 'processingFixedFee'),
  totalCustomerMonthsNeededToHitGoal: function() {
    return this.get('deltaCustomerMonthsNeededToHitGoal') + this.get('totalCustomerMonths');
  }.property('deltaCustomerMonthsNeededToHitGoal', 'totalCustomerMonths'),

  // Holding everything else constant, what's the change in percent growth rate needed to hit the goal
  growthRateDeltaToHitGoal: function() {
    return this.get('growthRateToHitGoal') - this.get('growthRate');
  }.property('growthRate', 'growthRateToHitGoal'),


  growthRateToHitGoal: function() {
    var seed = this.get('growthSeed');
    var timespan = this.get('timespan');
    var total = this.get('totalCustomerMonthsNeededToHitGoal');

    function growth(rate) {
      return (seed * Math.pow(1 + rate, timespan)) - seed - (total * rate);
    }
    function derivative(rate) {
      return (timespan * seed * Math.pow(rate + 1, timespan - 1)) - timespan;
    }
    var approximated = newtonRaphson(growth, derivative, 0.5, { tolerance: 0.001 });
    return approximated;
  }.property('totalCustomerMonthsNeededToHitGoal', 'growthSeed', 'timespan'),


  // Holding everything else constant, what's the change in starting customer base
  growthSeedToHitGoal: function() {
    var totalNewCustomersNeeded = Math.abs(this.get('deltaWithVariableExpenses') / (this.get('unitPrice') - this.get('processingFixedFee')));
    var totalCustomersNeeded = totalNewCustomersNeeded + this.get('totalCustomers');
    return totalCustomersNeeded;
  }.property('deltaWithVariableExpenses', 'unitPrice', 'totalCustomers', 'growthSeed', 'timespan', 'processingFixedFee'),
  growthSeedDeltaToHitGoal: function() {
    return Math.abs(this.get('growthSeed') - this.get('growthSeedToHitGoal'));
  }.property('growthSeed', 'growthSeedToHitGoal'),

  actions: {
    toggleShowMeHow: function() {
      this.toggleProperty('showMeHow');
    },
    toggleCalculations: function() {
      this.toggleProperty('showCalculations');
    },
    toggleGrowthAsPercent: function() {
      this.toggleProperty('growthIsPercent');
    }
  }
});