//var compiler = require('./compiler').Compiler;
var obj = [];
var ast = [
// <plural($n) { $n == 1 ? "one" : "many" }>

{
  "type": "macro",
  "id": "plural",
  "args": [
    {
      "type": "variable",
      "name": "n"
    }
  ],
  "attrs": [],
  "expression": {
    "type": "conditionalExpression",
    "test": {
      "type": "logicalExpression",
      "left": {
        "type": "binaryExpression",
        "left": {
          "type": "variable",
          "name": "n"
        },
        "operator": "==",
        "right": {
          "type": "number",
          "content": 1
        }
      }
    },
    "consequent": {
      "type": "string",
      "content": "one"
    },
    "alternate": {
      "type": "string",
      "content": "many"
    }
  }
},


// <brandName1 "Firefox">

{
  "type": "entity",
  "id": "brandName1",
  "local": false,
  "index": [],
  "attrs": [],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},


// <_brandName "Firefox">

{
  "type": "entity",
  "id": "_brandName",
  "local": true,
  "index": [],
  "attrs": [],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},


// <brandName2 [
//   *"Firefox", 
//    "Mozilla Firefox"
// ]>

{
  "type": "entity",
  "id": "brandName2",
  "index": [],
  "attrs": [],
  "value": {
    "type": "array",
    "content": [
      {
        "type": "string",
        "content": "Firefox",
        "default": true
      },
      {
        "type": "string",
        "content": "Mozilla Firefox"
      }
    ]
  }
},




// <brandName3 { 
//   *nominative: "Firefox", 
//    genitive: "Firefox's" 
// }>

{
  "type": "entity",
  "id": "brandName3",
  "index": [],
  "attrs": [],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",  // needed?
        "id": "nominative",
        "value": {
          "type": "string",
          "content": "Firefox"
        },
        "default": true
      },
      {
        "type": "keyValuePair",
        "id": "genitive",
        "value": {
          "type": "string",
          "content": "Firefox's"
        },
        "default": false
      }
    ]
  }
},


// <brandName31 { 
//   *nominative: "Firefox", 
//    genitive: "Firefox's" 
// }
// title: "Whose is this? {{ ~.genitive }}">

{
  "type": "entity",
  "id": "brandName31",
  "index": [],
  "attrs": [
    {
      "id": "title",
      "value": {
        "type": "complexString",
        "content": [
          {
            "type": "string",
            "content": "Whose is this? "
          },
          {
            "type": "propertyExpression",
            "expression": {
              "type": "this",
            },
            "property": {
              "type": "identifier",
              "name": "genitive"
            },
            "computed": false
          }
        ]
      },
      "local": false
    }
  ],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",  // needed?
        "id": "nominative",
        "value": {
          "type": "string",
          "content": "Firefox"
        },
        "default": true
      },
      {
        "type": "keyValuePair",
        "id": "genitive",
        "value": {
          "type": "string",
          "content": "Firefox's"
        },
        "default": false
      }
    ]
  }
},


// <brandName32 { 
//  *male: "Firefox",
//   female: {
//    *nominative: "Aurora", 
//     genitive: "Aurora's" 
//   }
// }>

{
  "type": "entity",
  "id": "brandName32",
  "index": [],
  "attrs": [],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",  // needed?
        "id": "male",
        "value": {
          "type": "string",
          "content": "Firefox"
        },
        "default": true
      },
      {
        "type": "keyValuePair",
        "id": "female",
        "value": {
          "type": "hash",
          "content": [
            {
              "type": "keyValuePair",  // needed?
              "id": "nominative",
              "value": {
                "type": "string",
                "content": "Aurora"
              },
              "default": true
            },
            {
              "type": "keyValuePair",
              "id": "genitive",
              "value": {
                "type": "string",
                "content": "Aurora's"
              },
              "default": false
            }
          ]
        },
        "default": false
      }
    ]
  }
},

// <brandName4 "Firefox"
//   _gender: 'male'
// >

{
  "type": "entity",
  "id": "brandName4",
  "index": [],
  "attrs": [
    {
      "id": "_gender",
      "value": {
        "type": "string",
        "content": "male"
      },
      "local": true
    }
  ],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},



// <brandName5 "Firefox"
//   accesskey: 'F'
// >

{
  "type": "entity",
  "id": "brandName5",
  "index": [],
  "attrs": [
    {
      "id": "accesskey",
      "value": {
        "type": "string",
        "content": "F"
      },
      "local": false
    }
  ],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},


// <brandName6 "Firefox"
//   accesskey: "F"
//   title: "This is {{ ~ }}"
// >

{
  "type": "entity",
  "id": "brandName6",
  "index": [],
  "attrs": [
    {
      "id": "accesskey",
      "value": {
        "type": "string",
        "content": "F"
      },
      "local": false
    },
    {
      "id": "title",
      "value": {
        "type": "complexString",
        "content": [
          {
            "type": "string",
            "content": "This is "
          },
          {
            "type": "this"
          }
        ]
      },
      "local": false
    }
  ],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},


// <brandName61 "Firefox"
//   accesskey: "F"
//   title: "This is {{ ~..accesskey }}"
// >

{
  "type": "entity",
  "id": "brandName61",
  "index": [],
  "attrs": [
    {
      "id": "accesskey",
      "value": {
        "type": "string",
        "content": "F"
      },
      "local": false
    },
    {
      "id": "title",
      "value": {
        "type": "complexString",
        "content": [
          {
            "type": "string",
            "content": "This is "
          },
          {
            "type": "attributeExpression",
            "expression": {
              "type": "this",
            },
            "attribute": {
              "type": "identifier",
              "name": "accesskey"
            },
            "computed": false
          }
        ]
      },
      "local": false
    }
  ],
  "value": {
    "type": "string",
    "content": "Firefox"
  }
},


// <about1 "About {{ brandName1 }}...">

{
  "type": "entity",
  "id": "about1",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "identifier",
        "name": "brandName1"
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},



// <about12 "About {{ about12 }}...">

{
  "type": "entity",
  "id": "about12",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "identifier",
        "name": "about12"
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},




// <about2 "About {{ brandName3.nominative }}...">

{
  "type": "entity",
  "id": "about2",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName3"
        },
        "property": {
          "type": "identifier",
          "name": "nominative"
        },
        "computed": false
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},



// <about22 """
//   About {{ brandName32 }} {{ brandName32.male }}
//   {{ brandName32.female }} {{ brandName32.female.nominative }}
//   {{ brandName32.female.genitive }}
// """>


{
  "type": "entity",
  "id": "about22",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "identifier",
        "name": "brandName32"
      },
      {
        "type": "string",
        "content": " "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName32"
        },
        "property": {
          "type": "identifier",
          "name": "male"
        },
        "computed": false
      },
      {
        "type": "string",
        "content": " "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName32"
        },
        "property": {
          "type": "identifier",
          "name": "female"
        },
        "computed": false
      },
      {
        "type": "string",
        "content": " "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "propertyExpression",
          "expression": {
            "type": "identifier",
            "name": "brandName32"
          },
          "property": {
            "type": "identifier",
            "name": "female"
          },
          "computed": false
        },
        "property": {
          "type": "identifier",
          "name": "nominative"
        },
        "computed": false
      },
      {
        "type": "string",
        "content": " "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "propertyExpression",
          "expression": {
            "type": "identifier",
            "name": "brandName32"
          },
          "property": {
            "type": "identifier",
            "name": "female"
          },
          "computed": false
        },
        "property": {
          "type": "identifier",
          "name": "genitive"
        },
        "computed": false
      }
    ]
  }
},




// <about23 "About {{ brandName32.female.genitive }}">

{
  "type": "entity",
  "id": "about23",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "propertyExpression",
          "expression": {
            "type": "identifier",
            "name": "brandName32"
          },
          "property": {
            "type": "identifier",
            "name": "female"
          },
          "computed": false
        },
        "property": {
          "type": "identifier",
          "name": "genitive"
        },
        "computed": false
      }
    ]
  }
},

// <about3 "About {{ brandName3['nominative'] }}...">

{
  "type": "entity",
  "id": "about3",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName3"
        },
        "property": {
          "type": "identifier",
          "name": "nominative"
        },
        "computed": true
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},

// ctx.l10nData.case = "nominative";
// <about4 "About {{ brandName3[$case] }}...">

{
  "type": "entity",
  "id": "about4",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName3"
        },
        "property": {
          "type": "variable",
          "name": "case"
        },
        "computed": true
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},


// <about5 "About {{ brandName3[case] }}...">

{
  "type": "entity",
  "id": "about5",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "propertyExpression",
        "expression": {
          "type": "identifier",
          "name": "brandName3"
        },
        "property": {
          "type": "identifier",
          "name": "case"
        },
        "computed": true
      },
      {
        "type": "string",
        "content": "..."
      }
    ]
  }
},


// <about6 "About {{ brandName3.nominative || $payload / 1024 }}">

{
  "type": "entity",
  "id": "about6",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "string",
        "content": "About "
      },
      {
        "type": "logicalExpression",
        "operator": "||",
        "left": {
          "type": "propertyExpression",
          "expression": {
            "type": "identifier",
            "name": "brandName3"
          },
          "property": {
            "type": "identifier",
            "name": "nominative"
          },
          "computed": false
        },
        "right": {
          "type": "binaryExpression",
          "operator": "/",
          "left": {
            "type": "identifier",
            "name": "payload"
          },
          "right": {
            "type": "number",
            "content": "1024"
          }
        }
      }
    ]
  }
},


// <updateSuccessful[brandName.._gender] {
//   *male: "{{ brandName }} a été mis à jour",
//    female: "{{ brandName }} a été mise à jour"
// }>

{
  "type": "entity",
  "id": "updateSuccessful",
  "index": [
    {
      "type": "attributeExpression",
      "expression": {
        "type": "identifier",
        "name": "brandName"
      },
      "attribute": {
        "type": "identifier",
        "name": "_gender"
      },
      "computed": false
    },
  ],
  "attrs": [],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",
        "id": "male",
        "value": {
          "type": "complexString",
          "content": [
            {
              "type": "identifier",
              "name": "brandName"
            },
            {
              "type": "string",
              "content": " a été mis à jour",
            }
          ]
        },
        "default": true
      },
      {
        "type": "keyValuePair",
        "id": "female",
        "value": {
          "type": "complexString",
          "content": [
            {
              "type": "identifier",
              "name": "brandName"
            },
            {
              "type": "string",
              "content": " a été mise à jour",
            }
          ]
        },
        "default": false
      }
    ]
  }
},



// <progress[plural($timeRemaining)] {
//   one: '1 minute left',
//   many: '{{ $timeRemaining }} minutes left'
// }>

{
  "type": "entity",
  "id": "progress",
  "index": [
    {
      "type": "callExpression",
      "callee": {
        "type": "identifier",
        "name": "plural"
      },
      "arguments": [
        {
          "type": "variable",
          "name": "timeRemaining"
        }
      ]
    },
  ],
  "attrs": [],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",
        "id": "one",
        "value": {
          "type": "string",
          "content": "1 minute left"
        },
        "default": false
      },
      {
        "type": "keyValuePair",
        "id": "many",
        "value": {
          "type": "complexString",
          "content": [
            {
              "type": "variable",
              "name": "timeRemaining"
            },
            {
              "type": "string",
              "content": " minutes left",
            }
          ]
        },
        "default": false
      }
    ]
  }
},





// <updateSuccessful[plural($num), brandName4.._gender] {
//   *one: {
//     *male: "{{ brandName4 }} a été mis à jour",
//      female: "{{ brandName4 }} a été mise à jour"
//    },
//    many: {
//     *male: "Ils ont été mis à jour",
//      female: "Elles ont été mises à jour"
//    },
// }>

{
  "type": "entity",
  "id": "updateSuccessful",
  "index": [
    {
      "type": "callExpression",
      "callee": {
        "type": "identifier",
        "name": "plural"
      },
      "arguments": [
        {
          "type": "variable",
          "name": "num"
        }
      ]
    },
    {
      "type": "attributeExpression",
      "expression": {
        "type": "identifier",
        "name": "brandName4"
      },
      "attribute": {
        "type": "identifier",
        "name": "_gender"
      },
      "computed": false
    },
  ],
  "attrs": [],
  "value": {
    "type": "hash",
    "content": [
      {
        "type": "keyValuePair",
        "id": "one",
        "value": {
          "type": "hash",
          "content": [
            {
              "type": "keyValuePair",
              "id": "male",
              "value": {
                "type": "complexString",
                "content": [
                  {
                    "type": "identifier",
                    "name": "brandName4"
                  },
                  {
                    "type": "string",
                    "content": " a été mis à jour",
                  }
                ]
              },
              "default": true
            },
            {
              "type": "keyValuePair",
              "id": "female",
              "value": {
                "type": "complexString",
                "content": [
                  {
                    "type": "identifier",
                    "name": "brandName4"
                  },
                  {
                    "type": "string",
                    "content": " a été mise à jour",
                  }
                ]
              },
              "default": false
            }
          ]
        },
        "default": true
      },
      {
        "type": "keyValuePair",
        "id": "many",
        "value": {
          "type": "hash",
          "content": [
            {
             "type": "keyValuePair",
              "id": "male",
              "value": {
                "type": "string",
                "content": "Ils ont été mis à jour",
              },
              "default": true
            },
            {
              "type": "keyValuePair",
              "id": "female",
              "value": {
                "type": "string",
                "content": "Elles ont été mises à jour",
              },
              "default": false
            }
          ]
        },
        "default": false
      }
    ]
  }
},


// <foo "{{ bar }}">

{
  "type": "entity",
  "id": "foo",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "identifier",
        "name": "bar"
      },
    ]
  }
},


// <bar "{{ foo }}">

{
  "type": "entity",
  "id": "bar",
  "index": [],
  "attrs": [],
  "value": {
    "type": "complexString",
    "content": [
      {
        "type": "identifier",
        "name": "foo"
      },
    ]
  }
},

];

Compiler.compile(ast, obj);

console.log('Firefox', obj['brandName1'].get(obj));
console.log('Firefox', obj['_brandName'].get(obj));
console.log('Firefox', obj['brandName2'].get(obj));
console.log('Firefox', obj['brandName3'].get(obj));
console.log('Whose is this? Firefox\'s', obj['brandName31'].getAttribute('title', obj));
console.log('Firefox', obj['brandName4'].get(obj));
console.log('male', obj['brandName4'].getAttribute('_gender', obj));
console.log('Firefox', obj['brandName5'].get(obj));
console.log('F', obj['brandName5'].getAttribute('accesskey', obj));

console.log('This is Firefox', obj['brandName6'].getAttribute('title', obj));
console.log('This is F', obj['brandName61'].getAttribute('title', obj));
console.log('About Firefox...', obj['about1'].get(obj));
console.log('About Firefox...', obj['about2'].get(obj));

console.log('About Firefox...', obj['about3'].get(obj));
console.log('About Firefox\'s...', obj['about4'].get(obj, {case: 'genitive'}));

// XXX index undefined errors
//console.log('About Aurora\'s', obj['about23'].get(obj));
//console.log('About Firefox Firefox Aurora Aurora Aurora\'s', obj['about22'].get(obj));


// Throw a recursion error
//console.log('Error', obj['about12'].get(obj));
//console.log('Error', obj['foo'].get(obj));
