'use strict';

var Intl = {
  prioritizeLocales: function(available, requested, defLang) {
    if (available.indexOf(requested[0]) === -1 || requested[0] === defLang) {
      return [defLang];
    } else {
      return [requested[0], defLang];
    }
  }
};

exports.Intl = Intl;
