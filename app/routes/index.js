import Ember from 'ember';

export default Ember.Route.extend({

  queryParams: {
    'salary'                : { replace: true },
    'timespan'              : { replace: true },
    'processing-percent'    : { replace: true },
    'processing-fixed-fee'  : { replace: true },
    'churn-rate'            : { replace: true },
    'churn-min'             : { replace: true },
    'business-tax-percent'  : { replace: true },
    'unit-price'            : { replace: true },
    'growth-rate'           : { replace: true },
    'growth-amount'         : { replace: true },
    'growth-is-percent'     : { replace: true },
    'growth-min'            : { replace: true },
    'growth-cap'            : { replace: true },
    'growth-seed'           : { replace: true },
    'is-growth-capped'      : { replace: true }
  }

});