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



var observers = {};
function generateObserverId (node, type) {

  var attr = "data-" + type + "Id";

  if (!node.hasAttribute(attr)) {
    node.setAttribute(attr, generateUuid());
  }
  var id = node.getAttribute(attr);
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

  var attr = "data-" + type + "Id";

  forEach(nodesByAttribute(node, attr), function(node) {

    var id = node.getAttribute(attr);
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

      cacheControllers(data.view, event, bindListener(data.view, event, action, controller));

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

  var nodes = view.querySelectorAll("[" + attr + "]");
  var root;

  if (view.hasAttribute(attr)) {
    root = [view];
  }

  if (nodes.length && root) return chain([nodes, root]);
  else if (nodes.length) return nodes;
  else if (root) return root;
  else return [];

}


function observeSystem (data) {



  return data;
}



function observeModel (data) {

  forEach(nodesByAttribute(data.view, "data-attr"), function (node) {

    forEach(node.getAttribute("data-attr").split(","), function (key) {

      var update = partial(attr, node, key);

      bindProperty(data.model, key, update);
      cacheObservers(node, data.model, key, update);

    });

  });

  forEach(nodesByAttribute(data.view, "data-inner"), function (node) {

    var key = node.getAttribute("data-inner");
    var update = partial(inner, node);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-style"), function (node) {

    var attr = node.getAttribute("data-style").split(":");
    var key = attr[0];
    var prop = attr[1];
    var unit = attr[2] || "";
    var update = partial(style, node, prop, unit);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-stylePercent"), function (node) {

    var attr = node.getAttribute("data-stylePercent").split(":");
    var key = attr[0];
    var prop = attr[1];
    var update = partial(stylePercent, node, prop, key);

    bindProperty(data.model, key, update);
    cacheObservers(node, data.model, key, update);

  });

  forEach(nodesByAttribute(data.view, "data-on"), function (node) {

    var event = node.getAttribute("data-on");
    var view = loadView(node);
    var update = partial(renderViewOnEvent, node, view);

    system.on(event, update);

    // bindProperty(data.model, key, update);
    // cacheObservers(node, data.model, key, update);

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


function loadView (node) {
  return require("./views/" + node.getAttribute("data-view") + ".html", "/");
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


  var previous = getPrevious(node);
  renderCollection(node, data.collection);
  clean(previous);

};


function renderCollection (node, collection) {

  var view = loadView(node);
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
  observeSystem,
  observeModel,
  enforceModel,
  getView
);

  // renderHasOne,

exports.renderView = renderView;
exports.clean = compose(
  clean,
  getPrevious
);
