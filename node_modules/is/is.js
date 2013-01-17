/**
  @description  detection and comparison
  @note         the parameter signature of type then value might seem a little
                backward; but is done this way to allow easy partial application
                var isFunc = partial(typeOf, "function")
                isFunc(function() {});
*/
require("Object");


/**
  @description  test to see if a value is aspecific type
  @param        {object|string} type
  @param        {any} value
  @return       boolean
*/
function typeOf(type, value) {

  if (type === "null" && eq(value, null)) return true;
  if (typeof value === type) return true;
  if (type === "array") type = Array.prototype;
  if (type.isPrototypeOf(value)) return true;

  return false;

}


/**
  @description  type enforcement throws an error if type is incorrect
  @param        {object|string} type
  @param        {any} value
  @return       value
*/
function enforce(type, value) {

  if (!typeOf(type, value)) throw TypeError.spawn(value + " is not of correct type: " + type);

  return value;

}


function eq(a, b) {
  return a === b;
}

function neq(a, b) {
  return a !== b;
}

function hasOwnKeyOfValue(key, value, object) {
  return hasOwnKey(key, object) && hasKeyOfValue(key, value, object);
}


function hasKeyOfValue(key, value, object) {
  return eq(object[key], value);
}

function hasOwnKey(key, object) {
  return object.hasOwnProperty(key);
}

function hasKey(key, object) {
  return (key in object);
}


exports.enforce          = enforce;
exports.typeOf           = typeOf;
exports.eq               = eq;
exports.neq              = neq;
exports.hasKey           = hasKey;
exports.hasOwnKey        = hasOwnKey;
exports.hasKeyOfValue    = hasKeyOfValue;
exports.hasOwnKeyOfValue = hasOwnKeyOfValue;
