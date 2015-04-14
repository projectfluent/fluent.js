'use strict';

module.exports = {
  elements: [
    'a', 'em', 'strong', 'small', 's', 'cite', 'q', 'dfn', 'abbr', 'data',
    'time', 'code', 'var', 'samp', 'kbd', 'sub', 'sup', 'i', 'b', 'u',
    'mark', 'ruby', 'rt', 'rp', 'bdi', 'bdo', 'span', 'br', 'wbr'
  ],
  attributes: {
    global: [ 'title', 'aria-label', 'aria-valuetext', 'aria-moz-hint' ],
    a: [ 'download' ],
    area: [ 'download', 'alt' ],
    // value is special-cased in isAttrAllowed
    input: [ 'alt', 'placeholder' ],
    menuitem: [ 'label' ],
    menu: [ 'label' ],
    optgroup: [ 'label' ],
    option: [ 'label' ],
    track: [ 'label' ],
    img: [ 'alt' ],
    textarea: [ 'placeholder' ],
    th: [ 'abbr']
  }
};

