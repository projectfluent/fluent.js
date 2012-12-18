function WrappedContext() {
  var worker = new Worker('./worker.js'); 
  var asyncGets = {};
  
  function randomUUID() {
    var s = [], itoh = '0123456789ABCDEF';

    // Make array of random hex digits. The UUID only has 32 digits in it, but we
    // allocate an extra items to make room for the '-'s we'll be inserting.
    for (var i = 0; i <36; i++) s[i] = Math.floor(Math.random()*0x10);

    // Conform to RFC-4122, section 4.4
    s[14] = 4;  // Set 4 high bits of time_high field to version
    s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence

    // Convert to hex chars
    for (var i = 0; i <36; i++) s[i] = itoh[s[i]];

    // Insert '-'s
    s[8] = s[13] = s[18] = s[23] = '-';

    return s.join('');
  }
  function postMsg(cmd, arg1, arg2) {
    worker.postMessage([cmd, arg1, arg2]);
  }
  worker.onerror = function(e) {
    console.log(e);
  }
  worker.onmessage = function(e) {
    var type = e.data[0];
    if (type == 'get') {
      var id = e.data[1];
      var val = e.data[2];
      asyncGets[e.data[1]].cb(val);
    }
    if (type == 'getMany') {
      var id = e.data[1];
      var vals = e.data[2];
      asyncGets[e.data[1]].cb(vals);
    }
  }

  return {
    addResource: function(url) {
    },
    addResourceSource: function(str) {
      postMsg('addResourceSource', str);
    },
    freeze: function() {
      postMsg('freeze');
    },
    get: function(id, callback) {
      var reqID = randomUUID();
      postMsg('get', reqID, id);
      asyncGets[reqID] = {'cb': callback};
    },
    getMany: function(ids, callback) {
      var reqID = randomUUID();
      postMsg('getMany', reqID, ids);
      asyncGets[reqID] = {'cb': callback};
    },
  }
}




function init() {
  var ctx = new WrappedContext();
  ctx.addResourceSource('<test "value"><test2 "value2">');
  ctx.freeze();
  ctx.get('test', function(val) {
    console.log(val);
  });
  ctx.getMany(['test', 'test2'], function(vals) {
    console.log(vals);
  });
}
