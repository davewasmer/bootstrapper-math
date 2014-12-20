import Ember from 'ember';

export default Ember.Controller.extend({

  // 
  // Graph controls
  // 

  showCustomers: true,
  showMonthlyRevenue: true,
  showCumulativeRevenue: true,

  // 
  // Goals
  // 

  salaryEquivalent: 60000,
  timespan: 12,
  monthlyIncome: function(key, value) {
    if (arguments.length > 1) {
      this.set('salaryEquivalent', value * 12);
    }
    return this.get('salaryEquivalent') / 12;
  }.property('salaryEquivalent'),
  annualRevenueGoal: function() {
    var withTaxes = this.get('salaryEquivalent') * (1 + this.get('businessTaxPercent'));
    var withExpenses = withTaxes + this.get('totalCreditCardPercent') + this.get('totalCreditCardFixed');
    return withExpenses;
  }.property('salaryEquivalent', 'businessTaxPercent', 'totalCreditCardPercent', 'totalCreditCardFixed'),
  monthlyRevenueGoal: function() {
    return this.get('annualRevenueGoal') / 12;
  }.property('annualRevenueGoal'),

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
  incomeTaxPercent: .25,
  businessTaxPercent: .15,
  combinedTaxPercent: function() {
    return this.get('incomeTaxPercent') + this.get('businessTaxPercent');
  }.property('incomeTaxPercent', 'businessTaxPercent'),

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
          cumulativeRevenue: 0
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
      var customers         = Math.min(netCustomers, this.get('growthCap'));

      // Revenue
      var grossRevenue      = customers * this.get('unitPrice');

      // Expenses
      var creditCardPercent = Math.round(grossRevenue * this.get('processingPercent'));
      var creditCardFixed   = Math.round(customers * this.get('processingFixedFee'));

      // Income
      var netRevenue        = grossRevenue - creditCardPercent - creditCardFixed;
      var cumulativeRevenue = previousMonth.cumulativeRevenue + netRevenue;

      projectedMonths.push({
        newCustomers: newCustomers,
        churnedCustomers: churnedCustomers,
        netCustomers: netCustomers,
        customers: customers,
        grossRevenue: grossRevenue,
        creditCardPercent: creditCardPercent,
        creditCardFixed: creditCardFixed,
        netRevenue: netRevenue,
        cumulativeRevenue: cumulativeRevenue
      });
    }, this);
    return projectedMonths;
  }.property(
    'months.[]',
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

  newCustomersByMonth:       Ember.computed.mapBy('projection', 'newCustomers'),
  churnedCustomersByMonth:   Ember.computed.mapBy('projection', 'churnedCustomers'),
  netCustomersByMonth:       Ember.computed.mapBy('projection', 'netCustomers'),
  customersByMonth:          Ember.computed.mapBy('projection', 'customers'),
  grossRevenueByMonth:       Ember.computed.mapBy('projection', 'grossRevenue'),
  creditCardPercentByMonth:  Ember.computed.mapBy('projection', 'creditCardPercent'),
  creditCardFixedByMonth:    Ember.computed.mapBy('projection', 'creditCardFixed'),
  netRevenueByMonth:         Ember.computed.mapBy('projection', 'netRevenue'),
  cumulativeRevenueByMonth:  Ember.computed.mapBy('projection', 'cumulativeRevenue'),

  totalNewCustomers:         Ember.computed.sum('newCustomersByMonth'),
  totalChurnedCustomers:     Ember.computed.sum('churnedCustomersByMonth'),
  totalCustomers:            Ember.computed.sum('customersByMonth'),
  totalGrossRevenue:         Ember.computed.sum('grossRevenueByMonth'),
  totalCreditCardPercent:    Ember.computed.sum('creditCardPercentByMonth'),
  totalCreditCardFixed:      Ember.computed.sum('creditCardFixedByMonth'),
  totalNetRevenue:           Ember.computed.sum('netRevenueByMonth'),
  totalCumulativeRevenue:    Ember.computed.sum('cumulativeRevenueByMonth'),

  visibleSeries: {
    newCustomers:            false,
    churnedCustomers:        false,
    customers:               false,
    grossRevenue:            false,
    netRevenue:              true,
    cumulativeRevenue:       true
  },

  seriesNames: [
    'newCustomers',
    'churnedCustomers',
    'customers',
    'grossRevenue',
    'netRevenue',
    'cumulativeRevenue'
  ],

  seriesUnits: {
    newCustomers:            'each',
    churnedCustomers:        'each',
    customers:               'each',
    grossRevenue:            'currency',
    netRevenue:              'currency',
    cumulativeRevenue:       'currency'
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
    'grossRevenueByMonth',
    'netRevenueByMonth',
    'cumulativeRevenueByMonth'
  ),


  // 
  // Annual figures
  // 

  incomeTaxes: function() {
    return this.get('totalCumulativeRevenue') * this.get('');
  }.property('totalCumulativeRevenue', ''),

  selfEmploymentTaxes: function() {
    return this.get('totalCumulativeRevenue') * this.get('businessTaxPercent');
  }.property('totalCumulativeRevenue', 'businessTaxPercent'),

  netTaxes: function() {
    return this.get('totalCumulativeRevenue') + this.get('combinedTaxPercent')
  }.property('totalCumulativeRevenue', 'combinedTaxPercent'),

  salaryEquivalentIncome: function() {
    return this.get('totalCumulativeRevenue') - this.get('selfEmploymentTaxes');
  }.property('totalCumulativeRevenue', 'selfEmploymentTaxes'),

  afterTaxIncome: function() {
    return this.get('totalCumulativeRevenue') - this.get('netTaxes');
  }.property('totalCumulativeRevenue', 'netTaxes'),


  // 
  // Results and Deltas
  // 

  // How far from our goal are we?
  delta: function() {
    return this.get('annualRevenueGoal') - this.get('salaryEquivalentIncome');
  }.property('annualRevenueGoal', 'salaryEquivalentIncome'),
  isShortOfGoal: Ember.computed.lt('delta', 0),
  isOverGoal: Ember.computed.gt('delta', 0),

  // The revenue delta including taxes and CC variable fees
  deltaWithVariableAssumptions: function() {
    var delta = this.get('delta') * (1 + this.get('businessTaxPercent')); // Factor in taxes
    delta = delta / (1 - this.get('processingPercent')); // Factor in variable CC processing fees
    return delta;
  }.property('delta', 'businessTaxPercent', 'processingPercent'),

  // Holding everything else constant, what's the change in price needed to hit the goal
  priceDeltaToHitGoal: function() {
    this.get('deltaWithVariableAssumptions') / this.get('totalCustomers');
  }.property('deltaWithVariableAssumptions', 'totalCustomers'),
  priceToHitGoal: function() {
    return this.get('unitPrice') + this.get('priceDeltaNeeded');
  }.property('unitPrice', 'priceDeltaNeeded'),

  // Holding everything else constant, how many new customers over the entire timespan would we need.
  growthNeededToHitGoal: function() {
    return this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee'));
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'processingFixedFee'),

  // Holding everything else constant, what's the change in percent growth rate needed to hit the goal
  growthDeltaRateToHitGoal: function() {
    this.get('growthRate') - this.get('growthRateToHitGoal')
  }.property('growthRate', 'growthRateToHitGoal'),
  growthRateToHitGoal: function() {
    var totalNewCustomersNeeded = this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee'));
    var totalCustomersNeeded = totalNewCustomersNeeded + this.get('totalCustomers');
    return 1 - Math.pow(totalCustomersNeeded / this.get('growthSeed'), 1 / this.get('timespan'));
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'totalCustomers', 'growthSeed', 'timespan', 'processingFixedFee'),

  growthSeedToHitGoal: function() {
    var totalNewCustomersNeeded = this.get('deltaWithVariableAssumptions') / (this.get('unitPrice') - this.get('processingFixedFee'));
    var totalCustomersNeeded = totalNewCustomersNeeded + this.get('totalCustomers');
     return totalCustomersNeeded / Math.pow(1 + this.get('growthRate'), this.get('timespan'))
  }.property('deltaWithVariableAssumptions', 'unitPrice', 'totalCustomers', 'growthSeed', 'timespan', 'processingFixedFee'),
  growthAmountToHitGoal
  churnRateToHitGoalIsPositive
  churnRateToHitGoal
  

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