/**

  @module   adds usefull inheritance methods to Object.prototype

*/
if (typeof Object.prototype.extend !== "function") {

  Object.defineProperties(Object.prototype, {


    /**
      @public   creates a new copy of "this", applying the extending definition
                calls any pre and post create methods
      @param    {object} definition
      @return   object
    */
    extend: {

      value: function(definition) {

        //  if we have a pre create method, run it on the definition now
        if (typeof this.__preCreate__ === "function") {
          this.__preCreate__(definition);
        }

        //  get a new object
        var object = Object.create(typeof this === "function" ? this.prototype: this, definition || {});

        //   mr freeze...
        Object.freeze(object);

        return object;

      },

      enumerable: false

    },


    /**
      @public   creates a new copy of "this" with no extending definition
                if "this" is a function we call new on it
                are 5 args enough
      @return   object
    */
    spawn: {

      value: function() {

        if (typeof this === "function") {

          var object = new this(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);

        }
        else {

          var object = Object.create(this);
          if (typeof object.__init__ === 'function') {
            object.__init__.apply(object, arguments);
          }

        }

        return object;

      },
      enumerable: false

    }

  });

}
