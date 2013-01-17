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
var forEach      = iter.forEach;
var map          = iter.map;
var chain        = iter.chain;
var partial      = func.partial;
var identity     = func.identity;
var compose      = func.compose;
var generateUuid = uuid.generate;

var eventMap = identity;


function attr (node, key, data) {

  node.setAttribute("data-" + key, data.value);

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


var controllers = {};
function cacheControllers (node, event, func) {

  if (!node.hasAttribute("data-controllerId")) {
    node.setAttribute("data-controllerId", generateUuid());
  }
  var id = node.getAttribute("data-controllerId");
  if (!controllers.hasOwnProperty(id)) {
    controllers[id] = [];
  }
  controllers[id].push({
    node: node,
    event: event,
    func: func
  });
}


var observers = {};
function cacheObservers (node, model, key, func) {

  if (!node.hasAttribute("data-observerId")) {
    node.setAttribute("data-observerId", generateUuid());
  }
  var id = node.getAttribute("data-observerId");
  if (!observers.hasOwnProperty(id)) {
    observers[id] = [];
  }
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


function clean (previous) {

  forEach(nodesByAttribute(previous, "data-observerId"), function(node) {

    var id = node.getAttribute("data-observerId");
    forEach(observers[id], function (data) {
      data.model.removeListener(data.key, data.func);
    });
    observers[id] = null;
    delete observers[id];

  });

  forEach(nodesByAttribute(previous, "data-controllerId"), function(node) {

    var id = node.getAttribute("data-controllerId");
    forEach(controllers[id], function (data) {
      data.node.removeEventListener(data.event, data.func, false);
    });
    controllers[id] = null;
    delete controllers[id];

  });

  previous = null;

}


function render (data) {

  data.root.appendChild(data.view);

  return data;

}


function renderHasMany (data) {

  forEach(nodesByAttribute(data.view, "data-hasMany"), function (node) {

    var relation = node.getAttribute("data-hasMany");
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


function bindListener (node, event, action, func) {

  function listener (e) {

    var node = e.target;
    while (node !== e.currentTarget) {
      if (node.getAttribute("data-action") === action) {
        e.delegateTarget = node;
        func.call(node, e);
        break;
      }
      node = node.parentNode;
    }

  }

  node.addEventListener(event, listener, false);

  return listener;

}



function bindController (data) {

  if (data.controller) {

    forEach(data.controller, function(controller, bindings) {


      var bindings = bindings.split(":");

      var event = eventMap(bindings[0]);
      var action = bindings[1];

      var listener = bindListener(data.view, event, action, controller);

      cacheControllers(data.view, event, listener);

    });

  }

  return data;

}


function getController (data) {

  var controller = data.view.getAttribute("data-controller");

  data.controller = controller ? require("./controllers/" + controller, "/") : false;

  return data;

}


function nodesByAttribute (view, attr) {

  var nodes = view.querySelectorAll("[" + attr + "]")
  var root;

  if (view.hasAttribute(attr)) {
    root = [view];
  }

  if (nodes.length && root) return chain([nodes, root]);
  else if (nodes.length) return nodes;
  else if (root) return root;
  else return [];

}



function observeModel (data) {

  forEach(nodesByAttribute(data.view, "data-attr"), function (node) {

    var key = node.getAttribute("data-attr");
    var update = partial(attr, node, key);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-inner"), function (node) {

    var key = node.getAttribute("data-inner");
    var update = partial(inner, node);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-style"), function (node) {

    var data = node.getAttribute("data-style").split(":");
    var key = data[0];
    var prop = data[1];
    var unit = data[2] || "";
    var update = partial(style, node, prop, unit);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-stylePercent"), function (node) {

    var data = node.getAttribute("data-stylePercent").split(":");
    var key = data[0];
    var prop = data[1];
    var update = partial(stylePercent, node, prop, key);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  return data;

}



function enforceModel (data) {

  var allowedModel = data.view.getAttribute("data-model");
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


function getView (data) {

  var div = document.createElement("div");
  div.innerHTML = data.view;

  data.view = div.firstChild;

  return data;

}


function getPrevious (node) {

  previous = document.createElement("div");

  while (node.firstChild) {
    previous.appendChild(node.firstChild);
  }

  return previous;

}


function updateCollection (node, data) {


  var previous = getPrevious(node);
  renderCollection(node, data.collection);
  clean(previous);

};


function renderCollection (node, collection) {

  var view = require("./views/" + node.getAttribute("data-view") + ".html", "/");
  var fragment = document.createDocumentFragment();

  forEach(collection.items, function (item) {
    renderView({
      root: fragment,
      view: view,
      model: item
    })
  });

  node.appendChild(fragment);
}


var renderView = compose(
  render,
  renderHasMany,
  bindController,
  getController,
  observeModel,
  enforceModel,
  getView
);

  // renderHasOne,

exports.renderView = renderView;
