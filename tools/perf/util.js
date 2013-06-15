exports.mean = function mean(elems) {
  return elems.reduce(function(prev, curr) { 
    return prev + curr;
  }) / elems.length;
}

exports.stdev = function stdev(elems, mean) {
  var stdev = elems.reduce(function(prev, curr) { 
    return prev + Math.pow(curr - mean, 2) 
  }, Math.pow(elems[0] - mean, 2)) / (elems.length - 1);
  return Math.sqrt(stdev);
}
