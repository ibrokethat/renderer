/**
  @module  function
*/
require("Object");

var iter    = require("iter");
var is      = require("is");
var map     = iter.map;
var toArray = iter.toArray;
var typeOf  = is.typeOf;
var enforce = is.enforce;



/**
  @description  binds and partially applies a method to a given scope
  @param        {object} [scope]
  @param        {function} func
  @return       {function}
*/
function bind(scope, func) {

  var args = toArray(arguments);
  args.splice(1, 1);

  return func.bind.apply(func, args);


}


/**
  @description  binds and partially applies a method to this at run time
  @param        {object} [scope]
  @param        {function} func
  @return       {function}
*/
function lateBind(func) {

  var args = toArray(arguments, 1);

  return function() {

    return func.apply(this, args.concat(toArray(arguments)));

  };

}


/**
  @description  partially applies a function
  @param        {function} func
  @return       {function}
*/
function partial(func) {

    return func.bind.apply(func, arguments);

}





/**
  @description  creates a function composed of other functions
                all functions must have the same input/output signature
  @params       {function} f1, f2, f3...
  @return       {function}
*/
function compose() {

  var functions = map(arguments, partial(enforce, "function"));

  return function () {

    var funcs = [].concat(functions);
    var args = arguments;
    var func;

    while (funcs.length) {
      args = [funcs.pop().apply(null, args)];
    }

    return args;

  }

}


function identity (value) {
  return value;
}


exports.bind     = bind;
exports.lateBind = lateBind;
exports.partial  = partial;
exports.compose  = compose;
exports.identity = identity;
