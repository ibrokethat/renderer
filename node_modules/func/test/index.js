var assert  = require("assert"),
    sinon   = require("sinon"),
    func    = require("../func"),
    partial = func.partial,
    bind    = func.bind,
    compose = func.compose,
    fakes;


describe("test func module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();

  });

  afterEach(function() {

    fakes.restore();

  });


  describe("function bind", function() {

    it("should bind a function to a scope object", function() {

      var o = {
        prop: "test"
      };

      function f() {
        return this.prop;
      }

      assert.equal(undefined, f());

      f = bind(o, f);

      assert.equal(o.prop, f());

    });

    it("should bind parameters to a function", function() {

      function f (p1, p2) {
        return p1;
      };

      assert.equal(undefined, f());

      f = bind({}, f, "test");

      assert.equal("test", f());

    });

    it("should append parameters to any bound ones", function() {

      function f (p1, p2) {
        return p1 + p2;
      };

      f = bind({}, f, 10);

      assert.equal(30, f(20));

    });


  });

  describe("function partial", function() {


    it("should bind parameters to a function", function() {

      var p;

      function f (p1, p2) {
        return p1;
      };

      p = partial(f, "test");

      assert.equal("test", p());

    });

    it("should append parameters to any bound ones", function() {

      var p;

      function f (p1, p2) {
        return p1 + p2;
      };

      p = partial(f, 10);

      assert.equal(30, p(20));

    });


  });


  describe("function compose", function() {

    var f1, f2;

    beforeEach(function() {

      f1 = function(a) {return a + a;};
      f2 = function(a) {return a * a;};
    });

    afterEach(function() {

      f1 = null;
      f2 = null;

    });

    it("should create a function composed of other functions", function() {

      var func = compose(f1, f1, f1, f1, f1);

      assert.equal(32, func(1));

    });

    it("should create a function composed of other functions", function() {

      var func = compose(f1, f2);

      assert.equal(200, func(10));

    });

    it("should throw an error if passed a non funcyion", function() {

      assert.throws(function() {
        compose({});
      });

    });



  });


});
