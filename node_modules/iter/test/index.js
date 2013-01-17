var assert        = require("assert"),
    sinon         = require("sinon"),
    iter          = require("../iter"),
    exhaust       = iter.exhaust,
    forEach       = iter.forEach,
    map           = iter.map,
    filter        = iter.filter,
    StopIteration = iter.StopIteration,
    fakes;


describe("test iter module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();

  });

  afterEach(function() {

    fakes.restore();

  });

  describe("function exhaust", function() {

    it("should iterate over an array", function() {

      var spy = sinon.spy();
      exhaust([10, 20, 30, 40, 50], spy);

      assert.equal(5, spy.callCount);

      assert.equal(10, spy.args[0][0]);
      assert.equal(0, spy.args[0][1]);
      assert.equal(20, spy.args[1][0]);
      assert.equal(1, spy.args[1][1]);
      assert.equal(30, spy.args[2][0]);
      assert.equal(2, spy.args[2][1]);
      assert.equal(40, spy.args[3][0]);
      assert.equal(3, spy.args[3][1]);
      assert.equal(50, spy.args[4][0]);
      assert.equal(4, spy.args[4][1]);

    });


    it("should iterate over an object", function() {

      var spy = sinon.spy();
      exhaust({
        ten: 10,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50
      }, spy);

      assert.equal(5, spy.callCount);

      assert.equal(10, spy.args[0][0]);
      assert.equal("ten", spy.args[0][1]);
      assert.equal(20, spy.args[1][0]);
      assert.equal("twenty", spy.args[1][1]);
      assert.equal(30, spy.args[2][0]);
      assert.equal("thirty", spy.args[2][1]);
      assert.equal(40, spy.args[3][0]);
      assert.equal("forty", spy.args[3][1]);
      assert.equal(50, spy.args[4][0]);
      assert.equal("fifty", spy.args[4][1]);

    });


    it("should iterate over an object with a next() method", function() {

      var spy = sinon.spy();
      exhaust({
        ten: 10,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50,
        keys: ["ten", "twenty", "thirty", "fifty"],
        next: function () {
          var key = this.keys.shift();
          if (this[key]) return [this[key], key];
          throw StopIteration;
        }
      }, spy);

      assert.equal(4, spy.callCount);

      assert.equal(10, spy.args[0][0]);
      assert.equal("ten", spy.args[0][1]);
      assert.equal(20, spy.args[1][0]);
      assert.equal("twenty", spy.args[1][1]);
      assert.equal(30, spy.args[2][0]);
      assert.equal("thirty", spy.args[2][1]);
      assert.equal(50, spy.args[3][0]);
      assert.equal("fifty", spy.args[3][1]);

    });

  });


  describe("function forEach", function() {

    it("should delegate to Array.prototype.forEach", function() {

      var spy = sinon.spy(),
          fforEach = fakes.spy(Array.prototype, "forEach");
      forEach([0, 1, 2, 3, 4], spy);

      assert.equal(1, fforEach.callCount);
      assert.equal(5, spy.callCount);

    });

  });


  describe("function filter", function() {

    it("should delegate to Array.prototype.filter", function() {

      var ffilter = fakes.spy(Array.prototype, "filter"),
          results;

      results = filter([0, 1, 2, 3, 4], function(value) {
        return value < 3;
      });

      assert.equal(1, ffilter.callCount);
      assert.equal(3, results.length);
      assert.equal(0, results[0]);
      assert.equal(1, results[1]);
      assert.equal(2, results[2]);

    });

    it("should filter using filter", function() {

      var results;

      results = filter({
        ten: 10,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50
      }, function(value) {
        return value < 30;
      });

      assert.equal(10, results.ten);
      assert.equal(20, results.twenty);
      assert.equal(undefined, results.thirty);
      assert.equal(undefined, results.forty);
      assert.equal(undefined, results.fifty);

    });

  });



  describe("function map", function() {

    it("should delegate to Array.prototype.map", function() {

      var fmap = fakes.spy(Array.prototype, "map"),
          results;

      results = map([0, 1, 2, 3, 4], function(value) {
        return value * 2;
      });

      assert.equal(1, fmap.callCount);
      assert.equal(5, results.length);
      assert.equal(0, results[0]);
      assert.equal(2, results[1]);
      assert.equal(4, results[2]);
      assert.equal(6, results[3]);
      assert.equal(8, results[4]);

    });

    it("should map using map", function() {

      var results;

      results = map({
        ten: 10,
        twenty: 20,
        thirty: 30,
        forty: 40,
        fifty: 50
      }, function(value) {
        return value * 10;
      });

      assert.equal(100, results.ten);
      assert.equal(200, results.twenty);
      assert.equal(300, results.thirty);
      assert.equal(400, results.forty);
      assert.equal(500, results.fifty);

    });

  });


});

