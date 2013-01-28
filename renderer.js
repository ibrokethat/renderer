/*
  @description  mvc overlord






*/
require("Object");

var Base         = require("Base");
var is           = require("is");
var iter         = require("iter");
var func         = require("func");
var uuid         = require("uuid");
var system       = require("system");
var enforce      = is.enforce;
var typeOf       = is.typeOf;
var forEach      = iter.forEach;
var map          = iter.map;
var chain        = iter.chain;
var partial      = func.partial;
var identity     = func.identity;
var compose      = func.compose;
var generateUuid = uuid.generate;
var some         = iter.some;

var eventMap = identity;


function attr (node, key, data) {

  node.dataset[key] = data.value;

}


function inner (node, data) {

  node.innerHTML = data.value;

}


function style (node, prop, unit, data) {

  node.style[prop] = data.value + unit;

}


function stylePercent (node, prop, key, data) {

  var min = data.model.properties[key].min;
  var max = data.model.properties[key].max;
  var val = ((data.value - min) / (max - min)) * 100;

  node.style[prop] = val + "%";
}



var observers = {};

function generateObserverId (node, type) {

  var attr = type + "Id";

  if (!node.dataset[attr]) {
    node.dataset[attr] = generateUuid();
  }
  var id = node.dataset[attr];

  if (!observers.hasOwnProperty(id)) {
    observers[id] = [];
  }

  return id;

}

function cacheControllers (node, event, func) {

  var id = generateObserverId(node, "controller");

  observers[id].push({
    node: node,
    event: event,
    func: func
  });
}


function cacheObservers (node, model, key, func) {

  var id = generateObserverId(node, "observer");

  observers[id].push({
    model: model,
    key: key,
    func: func
  });
}


function bindProperty (model, key, update) {

  model.on(key, update);

  update({
    value: model[key],
    model: model
  });

}


function removeObserver (data) {
  data.model.removeListener(data.key, data.func);
}

function removeController (data) {
  data.node.removeEventListener(data.event, data.func, false);
}

function removeObservers (type, func, node) {

  var attr = type + "Id";

  forEach(nodesByAttribute(node, attr), function(node) {

    var id = node.dataset[attr];
    forEach(observers[id], func);
    observers[id] = null;
    delete observers[id];

  });

  return node;

}

var clean = compose(
  partial(removeObservers, "observer", removeObserver),
  partial(removeObservers, "controller", removeController)
);



function render (data) {

  data.root.appendChild(data.view);

  return data;

}


function renderHasMany (data) {

  forEach(nodesByAttribute(data.view, "hasMany"), function (node) {

    var relation = node.dataset.hasMany;
    var collection = data.model[relation];
    var update = partial(updateCollection, node);

    collection.on("add", update);
    collection.on("remove", update);

    cacheObservers(node, collection, "add", update);
    cacheObservers(node, collection, "remove", update);

    renderCollection(node, collection);

  });

  return data;

}


function bindListener (node, event, func, action) {

  var listener = typeOf("undefined", action) ? func : function (e) {

    var node = e.target;
    while (node !== e.currentTarget) {
      if (node.dataset.action === action) {
        e.delegateTarget = node;
        return func.call(node, e);
      }
      node = node.parentNode;
    }

  };

  node.addEventListener(event, listener, false);

  return listener;

}



function bindController (data) {

  if (data.controller) {

    forEach(data.controller, function(controller, bindings) {


      var bindings = bindings.split(":");

      var event = eventMap(bindings[0]);
      var action = bindings[1];

      cacheControllers(data.view, event, bindListener(data.view, event, controller, action));

    });

  }

  return data;

}


function getController (data) {

  var controller = data.view.dataset.controller;

  data.controller = controller ? require("./controllers/" + controller, "/") : false;

  return data;

}


function runCustomRenderer (data) {

  var renderer = data.view.dataset.renderer;
  var render = renderer ? require("./renderers/" + renderer, "/").render : identity;

  return render(data);

}


function nodesByAttribute (view, attr) {

  var nodes = view.querySelectorAll("[data-" + attr.replace(/([A-Z])/, "-$1").toLowerCase() + "]");
  var root;

  if (view.dataset[attr]) {
    root = [view];
  }

  if (nodes.length && root) return chain([nodes, root]);
  else if (nodes.length) return nodes;
  else if (root) return root;
  else return [];

}




function observeModel (data) {

  forEach(nodesByAttribute(data.view, "attr"), function (node) {

    forEach(node.dataset.attr.split(","), function (key) {

      var update = partial(attr, node, key);

      bindProperty(data.model, key, update);
      cacheObservers(node, data.model, key, update);

    });

  });

  forEach(nodesByAttribute(data.view, "inner"), function (node) {

    var key = node.dataset.inner;
    var update = partial(inner, node);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "style"), function (node) {

    var attr = node.dataset.style.split(":");
    var key = attr[0];
    var prop = attr[1];
    var unit = attr[2] || "";
    var update = partial(style, node, prop, unit);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "stylePercent"), function (node) {

    var attr = node.dataset.stylePercent.split(":");
    var key = attr[0];
    var prop = attr[1];
    var update = partial(stylePercent, node, prop, key);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "on"), function (node) {

    var event = node.dataset.on;
    var view = loadView(node);
    var update = partial(renderViewOnEvent, node, view);

    system.on(event, update);

    // bindProperty(data.model, key, update);
    // cacheObservers(node, data.model, key, update);

  });

  return data;

}



function enforceModel (data) {

  var allowedModel = data.view.dataset.model;
  if (allowedModel) {
    try {
      enforce(require("/models/" + allowedModel), data.model);
    }
    catch (e) {
      console.error(e);
    }
  }

  return data;

}


function loadView (node) {
  return require("./views/" + node.dataset.view + ".html", "/");
}

function getView (data) {

  var div = document.createElement("div");
  div.innerHTML = data.view;

  data.view = div.firstChild;

  return data;

}


function getPrevious (root, collection) {

  var previous = document.createElement("div");

  if (collection) {

    some(collection.items, function (item) {

      var toRemove = root.querySelector('[data-id="' + item.id + '"]');
      if (toRemove) {

        forEach(root.querySelectorAll('[data-model="' + toRemove.dataset.model + '"]'), function (node) {
          previous.appendChild(node);
        });

        return true;
      }
      return false;

    });

  }
  else {
    while (root.firstChild) {
      previous.appendChild(root.firstChild);
    }
   }

  return previous;

}



function renderViewOnEvent (node, view, data) {

  var previous = getPrevious(node);
  renderView({
    root: node,
    view: view,
    model: data.model
  });
  clean(previous);

}

function updateCollection (node, data) {


  var previous = getPrevious(node, data.collection);
  renderCollection(node, data.collection);
  clean(previous);

};


function renderCollection (node, collection) {

  var view = loadView(node);

  forEach(collection.items, function (item) {
    renderView({
      root: node,
      view: view,
      model: item
    })
  });

}



var renderView = compose(
  renderHasMany,
  render,
  bindController,
  getController,
  observeModel,
  runCustomRenderer,
  enforceModel,
  getView
);

  // renderHasOne,

exports.renderView = renderView;
exports.clean = compose(
  clean,
  getPrevious
);


//  add caching of system.on and model.on("update") listeners
//  and then add them to the clean script...
//  move all observers, cache and cleaning to own module
