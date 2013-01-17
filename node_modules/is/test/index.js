var assert           = require("assert"),
    sinon            = require("sinon"),
    is               = require("../is"),
    typeOf           = is.typeOf,
    enforce          = is.enforce,
    eq               = is.eq,
    neq              = is.neq,
    hasKey           = is.hasKey,
    hasOwnKey        = is.asOwnKey,
    hasKeyOfValue    = is.hasKeyOfValue,
    hasOwnKeyOfValue = is.hasOwnKeyOfValue,
    fakes;


describe("test is module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();

  });

  afterEach(function() {

    fakes.restore();

  });


  describe("function typeOf", function() {

    it("should identify undefined", function() {

      var isUndefined,
          notUndefined = "";

      assert.equal(true, typeOf("undefined", isUndefined));
      assert.equal(false, typeOf("undefined", notUndefined));

    });


    it("should identify null", function() {

      var isNull = null,
          notNull = "";

      assert.equal(true, typeOf("null", isNull));
      assert.equal(false, typeOf("null", notNull));

    });


    it("should identify boolean", function() {

      var isBoolean = true,
          notBoolean = "";

      assert.equal(true, typeOf("boolean", isBoolean));
      assert.equal(false, typeOf("boolean", notBoolean));

    });


    it("should identify an array", function() {

      var isArray = [],
          notArray = "";

      assert.equal(true, typeOf("array", isArray));
      assert.equal(false, typeOf("array", notArray));

    });

    it("should identify an object", function() {

      var isObject = {},
          notObject = "";

      assert.equal(true, typeOf("object", isObject));
      assert.equal(false, typeOf("object", notObject));

    });

    it("should identify a number", function() {

      var isNumber = 10,
          notNumber = "";

      assert.equal(true, typeOf("number", isNumber));
      assert.equal(false, typeOf("number", notNumber));

    });

    it("should identify a string", function() {

      var isString = "10",
          notString = 10;

      assert.equal(true, typeOf("string", isString));
      assert.equal(false, typeOf("string", notString));

    });


    it("should identify if an object is a prototype of a value", function() {

      var isPrototype = {
        is: "prototype"
      },
      notPrototype = {
        not: "prototype"
      };

      assert.equal(true, typeOf(isPrototype, Object.create(isPrototype)));
      assert.equal(false, typeOf(isPrototype, Object.create(notPrototype)));

    });


  });

  describe("function enforce", function() {

    it("should return it's value parameter if it's type is true", function() {

      var spy = sinon.spy();
      assert.equal(spy, enforce("function", spy));

    });

    it("should throw a wobbler if it's type is false", function() {

      var spy = sinon.spy();
      assert.throws(function() {
        enforce("string", spy);
      });

    });


  });


  describe("function eq", function() {

    it("should test equality", function() {

      var o  = {o: "o"};

      assert.equal(true, eq(10, 10));
      assert.equal(true, eq("string", "string"));
      assert.equal(true, eq(o, o));
      assert.equal(false, eq({}, {}));
      assert.equal(false, eq(10, 5));
      assert.equal(false, eq(10, "string"));
      assert.equal(false, eq(0, false));

    });

  });


  describe("function neq", function() {

    it("should test non equality", function() {

      var o  = {o: "o"};

      assert.equal(false, neq(10, 10));
      assert.equal(false, neq("string", "string"));
      assert.equal(false, neq(o, o));
      assert.equal(true, neq({}, {}));
      assert.equal(true, neq(10, 5));
      assert.equal(true, neq(10, "string"));
      assert.equal(true, neq(0, false));

    });

  });


});
