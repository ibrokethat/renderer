/**
  @module   iteration methods
*/
require("Object");

var StopIteration = Error.spawn();


/**
  @description  creates an iterable object from another object
  @param        {object} obect
  @return       {iterable}
*/
function iterator(object){

  var it = false;

  if (typeof object.next ==='function') {
    it = object;
  }
  else if (typeof object.__iter__ === "function") {

    it = object.__iter__();

  }
  else if(object.length) {

    var i = 0;

    it = {
      next: function() {
        if (typeof object[i] !== 'undefined') {
          return [object[i], i++];
        }
        throw StopIteration;
      }
    };

  }
  else {

    try {

      var keys = Object.keys(object);
      var i = 0;

      it = {
        next: function() {
          if (typeof keys[i] !== 'undefined') {
            return [object[keys[i]], keys[i++]];
          }
          throw StopIteration;
        }
      };
    }
    catch(e) {
      it = false;
    }


  }

  return it;
}




/**
  @descrption   applies a function to each item in an object
                after selecting most appropriate method to perform the iteration
  @param        {object} object
  @param        {func} function
*/
function exhaust(object, func) {

  try {
    if (typeof object.length === 'number') {
      for (var i = 0, l = object.length; i < l; i++) {
        func(object[i], i);
      }
    }
    else {
      if (typeof object.__iter__ === "function") {
        object = object.__iter__();
      }
      if (typeof object.next === "function") {
        var i = 0;
        var r;
        while (true) {
          r = object.next();
          func(r[0], r[1]);
        }
      }
      else if (Object.keys && Array.prototype.forEach) {
        Object.keys(object).forEach(function(key) {
          func(object[key], key);
        });
      }
      else {
        for (var key in object) {
          func(object[key], key);
        }
      }
    }
  }
  catch (e) {
    if (e !== StopIteration) {
      throw e;
    }

  }
}



/**
  @descrption   calls a function on each item in an object
  @param        {o} object
  @param        {func} function
  @param        {object} [scope]
*/
function forEach(o, func, scope) {
  if(typeof o.forEach === 'function') {
    o.forEach(func, scope);
  }
  else {
    exhaust(o, function(value, key){
      func.call(scope, value, key);
    });
  }
}


/**
  @descrption   calls a function on each item in an object and returns the item if 'true'
  @param        {o} object
  @param        {func} function
  @param        {object} [scope]
*/
function filter(o, func, scope) {
  if(typeof o.filter === 'function') {
    return o.filter(func, scope);
  }
  var ret = o.length ? [] : {};
  exhaust(o, function(value, key){
    if (func.call(scope, value, key)) {
      if(o.length) {
        ret.push(value);
      }
      else {
        ret[key] = value;
      }
    }
  });
  return ret;
}


/**
  @descrption   calls a function on each item in an object and returns the result
  @param        {o} object
  @param        {func} function
  @param        {object} [scope]
  @return       {object|array}
*/
function map(o, func, scope) {
  if(typeof o.map === 'function') {
    return o.map(func, scope);
  }
  var ret = o.length ? [] : {};
  exhaust(o, function(value, key){
    var r = func.call(scope, value, key);
    if(o.length) {
      ret.push(r);
    }
    else {
      ret[key] = r;
    }
  });
  return ret;
}




/**
  @description  returns true if any of the items evaluate to true
                else returns false
  @param        {o} object
  @param        {func} function
  @param        {object} [scope]
  @return       {boolean}
*/
function some(o, func, scope) {
  if(typeof o.some === 'function') {
    return o.some(func, scope);
  }
  var ret = false;
  exhaust(o, function(value, key){
    if ((ret = func.call(scope, value, key))) {
      throw StopIteration;
    }
  });
  return ret;
}



/**
  @description  returns true if all of the items evaluate to true
                else returns false
  @param        {o} object
  @param        {func} function
  @param        {object} [scope]
  @return       {boolean}
*/
function every(o, func, scope) {
  if(typeof o.every === 'function') {
    return o.every(func, scope);
  }
  var ret = true;
  exhaust(o, function(value, key){
    if (!(ret = func.call(scope, value, key))) {
      throw StopIteration;
    }
  });
  return ret;
}



/**
  @description  returns the index of the first match
  @param        {o} object
  @param        {any} val
  @return       {int|string}
*/
function indexOf(o, val) {
  if(typeof o.indexOf === 'function') {
    return o.indexOf(val);
  }
  var ret = -1;
  exhaust(o, function(value, key){
    if (value === val) {
      ret = key;
      throw StopIteration;
    }
  });
  return ret;
}



/**
  @description  returns the index of the last match
  @param        {o} object
  @param        {any} val
  @return       {int|string}
*/
function lastIndexOf(o, val){
  if(typeof o.lastIndexOf === 'function') {
    return o.lastIndexOf(val);
  }
  var ret = -1;
  exhaust(o, function(value, key){
    if (value === val) {
      ret = key;
    }
  });
  return ret;
}


/**
  @description  converts an array like object to an array
  @param        {object} arrayLike
  @param        {number} [i]
  @return       {array}
*/
function toArray(arrayLike, i) {

  return Array.prototype.slice.call(arrayLike, i || 0);

}




/**
  @description  reduces the value of the object down to a single value
  @param        {any} ret
  @param        {object} o
  @param        {function} func
  @return       {any}
*/
function reduce(ret, o, func){

  var iterable;

  if(typeof o === "function" && typeof func === "undefined") {

    iterable = iterator(ret);
    func = o;
    try {
      ret = iterable.next();
    }
    catch (e) {
      if (e === StopIteration) {
        throw TypeError.spawn("reduce() of sequence with no initial value");
      }
      throw e;
    }
  }
  else {
    iterable = iterator(o);
  }

  exhaust(iterable, function(value, key){
    ret = func(ret, value, key);
  });
  return ret;
}



/**
  @description  adds the values of the object
  @param        {object} o
  @param        {any} [ret]
  @return       {number}
*/
function sum(o, ret) {
  return reduce(ret || 0, o, function(ret, a){
    return (ret + a);
  });
}




/**
  @description  creates an iterable object that iterates over all it's parameter objects
  @param        {array} args
  @return       {iterable}
*/
function chain(args) {

  if(args.length === 1) {
    return iterator(args[0]);
  }

  var iterables = map(args, iterator);

  return {

    next: function() {

      try {
        return iterables[0].next();
      }
      catch(e) {
        if (e !== StopIteration) {
          throw e;
        }
        if(iterables.length === 1) {
          throw StopIteration;
        }
        iterables.shift();
        return iterables[0].next();
      }
    }

  };
}



/**
  @description  creates an iterator map
  @param        {object} o
  @param        {function} func
  @param        {object} [scope]
  @return       {iterable}
*/
function imap(o, func, scope){

  var iterable = iterator(o);

  return {

    next: function () {
      var it = iterable.next();
      return [func.apply(scope || null, it[0]), it[1]];

    }

  };
}



/**
  @description  creates a range iterable
  @param        {number} start
  @param        {number} stop
  @param        {number} [step]
  @return       {iterable}
*/
function range(start, stop, step) {

  var i = 0;

  step = step || 1;

  return {
    next: function() {
      var ret = start;
      if(start >= stop) {
        throw StopIteration;
      }
      start = start + step;
      return [ret, i++];
    }
  };
}


exports.StopIteration = StopIteration;
exports.iterator      = iterator;
exports.exhaust       = exhaust;
exports.forEach       = forEach;
exports.filter        = filter;
exports.map           = map;
exports.some          = some;
exports.every         = every;
exports.indexOf       = indexOf;
exports.lastIndexOf   = lastIndexOf;
exports.toArray       = toArray;
exports.reduce        = reduce;
exports.sum           = sum;
exports.chain         = chain;
exports.imap          = imap;
exports.range         = range;

