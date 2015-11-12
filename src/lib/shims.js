'use strict';
// Safari 9 and iOS 9 does not support Intl
export const L20nIntl = typeof Intl !== 'undefined' ?
  Intl : {
  NumberFormat: function() {
    return {
      format: function(v) {
        return v;
      }
    };
  }
};
