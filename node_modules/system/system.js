/**

  @module       sys
  @description  system wide event bus...

*/
require("Object");

var EventEmitter = require("events").EventEmitter;

module.exports = EventEmitter.spawn();

