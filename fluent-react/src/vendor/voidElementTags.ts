/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in this directory.
 */

import { OMITTED_CLOSE_TAGS } from './omittedCloseTags';

// For HTML, certain tags cannot have children. This has the same purpose as
// `omittedCloseTags` except that `menuitem` should still have its closing tag.

export let VOID_ELEMENTS = {
  menuitem: true,
  ...OMITTED_CLOSE_TAGS,
};
