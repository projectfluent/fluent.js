'use strict';
/* global Intl:true */

// Safari 9 and iOS 9 does not support Intl
const IntlShim = {
  NumberFormat: function() {
    return {
      format: function(v) {
        return v;
      }
    };
  }
};

export const Intl = typeof Intl !== 'undefined' ? Intl : IntlShim;
