'use strict';

/* jshint node:true */

require('string.prototype.startswith');
require('string.prototype.endswith');

import { fetch } from './io';
import { Env } from '../../lib/env';

module.exports = {
  fetch,
  Env
};
