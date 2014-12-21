import Ember from 'ember';

export default Ember.Controller.extend({

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
  annualProfitGoal: function() {
    var withTaxes = this.get('salary') * (1 + this.get('businessTaxPercent'));
    var withExpenses = withTaxes * (1 + this.get('processingPercent'));
    withExpenses += this.get('totalCreditCardFixed');
    return withExpenses;
  }.property('salary', 'businessTaxPercent', 'processingPercent', 'totalCreditCardFixed'),
  monthlyProfitGoal: function() {
    return this.get('annualProfitGoal') / 12;
  }.property('annualProfitGoal'),

  // 
  // Assumptions
  // 

  showingAssumptions: false,

  // Credit card processing
  processingPercent: 0.029,
  processingFixedFee: 0.30,

  // Churn
  churnRate: 0.10,
  churnMin: 1,

  // Taxes
  businessTaxPercent: .15,

  // 
  // Income
  // 

  // Pricing
  unitPrice: 50,

  // Growth
  growthRate: 0.10,
  growthAmount: 1,
  growthIsPercent: true,
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
          cumulativeProfit: 0
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
      var creditCardPercent = Math.round(revenue * this.get('processingPercent'));
      var creditCardFixed   = Math.round(customers * this.get('processingFixedFee'));

      // Income
      var profit            = revenue - creditCardPercent - creditCardFixed;
      var cumulativeProfit  = previousMonth.cumulativeProfit + profit;

      projectedMonths.push({
        newCustomers: newCustomers,
        churnedCustomers: churnedCustomers,
        netCustomers: netCustomers,
        customers: customers,
        revenue: revenue,
        creditCardPercent: creditCardPercent,
        creditCardFixed: creditCardFixed,
        profit: profit,
        cumulativeProfit: cumulativeProfit
      });
    }, this);
    return projectedMonths;
  }.property(
    'months',
    'growthSeed',
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
  profitByMonth:            function() { return this.get('projection').mapBy('profit');  }.property('projection'),
  cumulativeProfitByMonth:  function() { return this.get('projection').mapBy('cumulativeProfit');  }.property('projection'),

  totalNewCustomers:         Ember.computed.sum('newCustomersByMonth'),
  totalChurnedCustomers:     Ember.computed.sum('churnedCustomersByMonth'),
  totalCustomers:            Ember.computed.alias('customersByMonth.lastObject'),
  totalCustomerMonths:       Ember.computed.sum('customersByMonth'),
  totalRevenue:              Ember.computed.sum('revenueByMonth'),
  totalCreditCardPercent:    Ember.computed.sum('creditCardPercentByMonth'),
  totalCreditCardFixed:      Ember.computed.sum('creditCardFixedByMonth'),
  totalProfit:               Ember.computed.sum('profitByMonth'),


  // 
  // Charting
  // 

  visibleSeries: {
    newCustomers:            false,
    churnedCustomers:        false,
    customers:               false,
    revenue:                 false,
    profit:                  true,
    cumulativeProfit:        true
  },

  seriesNames: [
    'newCustomers',
    'churnedCustomers',
    'customers',
    'revenue',
    'profit',
    'cumulativeProfit'
  ],

  seriesUnits: {
    newCustomers:         'each',
    churnedCustomers:     'each',
    customers:            'each',
    revenue:              'currency',
    profit:               'currency',
    cumulativeProfit:     'currency'
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
    }, this)
  }.property(
    'newCustomersByMonth',
    'churnedCustomersByMonth',
    'customersByMonth',
    'revenueByMonth',
    'profitByMonth',
    'cumulativeProfitByMonth'
  ),


  // 
  // Annual figures
  // 

  businessTaxes: function() {
    return this.get('totalProfit') * this.get('businessTaxPercent');
  }.property('totalProfit', 'businessTaxPercent'),

  salaryEquivalentIncome: function() {
    return this.get('totalProfit') - this.get('businessTaxes');
  }.property('totalProfit', 'businessTaxes'),

  // 
  // Results and Deltas
  // 

  // How far from our goal are we?
  delta: function() {
    return this.get('totalProfit') - this.get('annualProfitGoal');
  }.property('annualProfitGoal', 'totalRevenue'),
  isShortOfGoal: Ember.computed.lt('delta', 0),
  isOverGoal: Ember.computed.gt('delta', 0),
  displayDelta: function() {
    return Math.abs(this.get('delta'));
  }.property('delta'),

  // The revenue delta including CC variable fees
  deltaWithVariableAssumptions: function() {
    return this.get('delta') / (1 - this.get('processingPercent')); // Factor in variable CC processing fees
  }.property('delta', 'businessTaxPercent', 'processingPercent'),

  // Holding everything else constant, what's the change in price needed to hit the goal
  priceDeltaToHitGoal: function() {
    return Math.ceil(Math.abs(this.get('deltaWithVariableAssumptions')) / this.get('totalCustomerMonths'));
  }.property('deltaWithVariableAssumptions', 'totalCustomerMonths'),
  priceToHitGoal: function() {
    return this.get('unitPrice') + this.get('priceDeltaToHitGoal');
  }.property('unitPrice', 'priceDeltaToHitGoal'),

  // Holding everything else constant, how many new customer months would we need to make up the difference.
  deltaCustomerMonthsNeededToHitGoal: function() {
    return Math.abs(this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee')));
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'processingFixedFee'),
  totalCustomerMonthsNeededToHitGoal: function() {
    return this.get('deltaCustomerMonthsNeededToHitGoal') + this.get('totalCustomerMonths');
  }.property('deltaCustomerMonthsNeededToHitGoal', 'totalCustomerMonths'),

  // Holding everything else constant, what's the change in percent growth rate needed to hit the goal
  growthRateDeltaToHitGoal: function() {
    return this.get('growthRateToHitGoal') - this.get('growthRate');
  }.property('growthRate', 'growthRateToHitGoal'),


  growthRateToHitGoal: function() {
    var totalCustomersNeeded = this.get('totalCustomerMonthsNeededToHitGoal') / this.get('timespan');
    return (Math.pow(totalCustomersNeeded / this.get('growthSeed'), 1 / this.get('timespan')) - 1) * 12;
  }.property('totalCustomerMonthsNeededToHitGoal', 'growthSeed', 'timespan'),


  // Holding everything else constant, what's the change in starting customer base
  growthSeedToHitGoal: function() {
    var totalNewCustomersNeeded = Math.abs(this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee')));
    var totalCustomersNeeded = totalNewCustomersNeeded + this.get('totalCustomers');
    return totalCustomersNeeded;
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'totalCustomers', 'growthSeed', 'timespan', 'processingFixedFee'),
  growthSeedDeltaToHitGoal: function() {
    return Math.abs(this.get('growthSeed') - this.get('growthSeedToHitGoal'));
  }.property('growthSeed', 'growthSeedToHitGoal'),

  // Holding everything else constant, what's the change in absolute growth rate needed to hit the goal
  growthAmountToHitGoal: function() {
    var totalNewCustomersNeeded = this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee'));
    var totalCustomersNeeded = totalNewCustomersNeeded + this.get('totalCustomers');
    return totalCustomersNeeded / this.get('timespan');
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'totalCustomers', 'growthSeed', 'timespan', 'processingFixedFee'),

  actions: {
    toggleAssumptions: function() {
      this.toggleProperty('showingAssumptions');
    },
    setGrowthAsPercent: function() {
      this.set('growthIsPercent', true);
    },
    setGrowthAsAbsolute: function() {
      this.set('growthIsPercent', false);
    }
  }
});