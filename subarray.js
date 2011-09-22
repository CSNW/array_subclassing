var makeSubArray = (function(){

  var MAX_SIGNED_INT_VALUE = Math.pow(2, 32) - 1,
      hasOwnProperty = Object.prototype.hasOwnProperty;

  function ToUint32(value) {
    return value >>> 0;
  }

  function compareMaxIndex(object, index) {
    if (index < -1 || (index + 1 !== MAX_SIGNED_INT_VALUE && hasOwnProperty.call(object, index + 1)))
      return 1;
    else if (index >= MAX_SIGNED_INT_VALUE || (index !== -1 && !hasOwnProperty.call(object, index)))
      return -1;
    else
      return 0;
  }

  function getMaxIndexProperty(object, old_index) {
    var index = old_index,
        direction = interval = compareMaxIndex(object, old_index);
    if (direction == 0)
      return index;
    
    // find low and high by searching from old_index by powers of 2
    do {
      old_index = index;
      interval *= 2;
      index += interval;
    } while (compareMaxIndex(object, index) == direction);

    var high = direction == 1 ? index : old_index;
    var low  = direction == 1 ? old_index : index;

    if (high >= MAX_SIGNED_INT_VALUE)
      high = MAX_SIGNED_INT_VALUE - 1;
    if (low < -1)
      low = -1;
    
    // binary search (implementation from underscore's sortedIndex())
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      // var mid = (low + high) >> 1; // returns negative results for numbers near MAX_SIGNED_INT_VALUE
      compareMaxIndex(object, mid) == 1 ? low = mid + 1 : high = mid;
    }
    return low;
  }

  return function(methods) {
    var length = 0;
    methods = methods || { };

    methods.length = {
      get: function() {
        return getMaxIndexProperty(this, length - 1) + 1;
      },
      set: function(value) {
        var constrainedValue = ToUint32(value);
        if (constrainedValue !== +value) {
          throw new RangeError();
        }
        
        // optimizate for the common case where a built-in
        // prototype is setting the length to what it really is after modifications
        if (compareMaxIndex(this, value) == 0)
          length = value;
        
        var old_len = this.length;
        for (var i = constrainedValue, len = old_len; i < len; i++) {
          delete this[i];
        }
        // the hasOwnProperty() check allows sparse arrays to be made contiguous
        // via setting the length after-the-fact
        for (var i = old_len, len = constrainedValue; i < len; i++) {
          if (!hasOwnProperty.call(this, i))
            this[i] = undefined;
        }
        length = constrainedValue;
      }
    };
    methods.toString = {
      value: Array.prototype.join
    };
    return Object.create(Array.prototype, methods);
  };
})();

function SubArray() {
  var arr = makeSubArray();
  if (arguments.length === 1) {
    arr.length = arguments[0];
  }
  else {
    arr.push.apply(arr, arguments);
  }
  return arr;
}