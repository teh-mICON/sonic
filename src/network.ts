import _ from "lodash";
import uuid from "uuid/v4";
import Connection from "./connection";
import Node from "./node";
import Trace from './trace'

export default class Network {
  private nodes: Node[] = [];
  private filteredNodes = {};
  private trace: Trace;

  constructor(trace = null) {
    this.trace = trace;
  }

  //TODO: move this.
  initRandom(input, hidden, output) {
    _.times(input, () => {
      this.nodes.push(new Node(uuid(), "input"));
    });
    _.times(hidden, () => {
      this.nodes.push(new Node(uuid(), "hidden"));
    });
    _.times(output, () => {
      this.nodes.push(new Node(uuid(), "output"));
    });
    _.each(this.nodes, node => node.initRandom());

    const connectRandom = (times, node, type, candidates: any) => {
      // remove fromNode from candidates
      _.remove(candidates, (candidate: Node) => candidate.getID() === node.getID());

      _.times(times, () => {
        const tmp = _.map(candidates, candidate => candidate);
        const target = _.sample(tmp);
        if (!target) {
          throw new Error("invalid target");
        }
        // add connection to toNode
        node.addConnection(new Connection(type, node, target).initRandom());
        // remove toNode from candidates
        _.remove(tmp, candidate => candidate.getID() === target.getID());
      });
    };

    // add connections from inputs to random hidden nodes
    _.each(this.getInputNodes(), node =>
      connectRandom(3, node, "excite", this.getHiddenNodes(false))
    );

    //add random connections between hidden nodes
    _.each(this.getHiddenNodes(), node =>
      connectRandom(
        3,
        node,
        Math.random() > 0.5 ? "excite" : "inhibit",
        this.getHiddenNodes(false)
      )
    );

    // add connections from random hidden nodes to output nodes
    _.each(this.getHiddenNodes(), node =>
      connectRandom(
        3,
        node,
        Math.random() > 0.5 ? "excite" : "inhibit",
        this.getOutputNodes(false)
      )
    );

    return this;
  }

  activate(index: number, value: number) {
    this.getInputNodes()[index].activate(value, 0, this.trace);
  }
  activateMultiple(values) {
    _.each(values, (value, index: number) => {
      this.activate(index, value);
    });
  }
  tick() {
    _.each(this.nodes, node => node.tick());
  }

  getFilteredNodes(type, cache = true): Node[] {
    // node filter callback
    const nodeFilter = type => node => node.getType() === type;

    // if no caching, just return filtered nodes
    if (!cache) return _.filter(this.nodes, nodeFilter(type));

    // cache filtered nodes, then return
    if (this.filteredNodes[type] === undefined) {
      this.filteredNodes[type] = _.filter(this.nodes, nodeFilter(type));
    }
    return this.filteredNodes[type];
  }
  getInputNodes(cache = false): Node[] {
    return this.getFilteredNodes("input", cache);
  }
  getHiddenNodes(cache = false): Node[] {
    return this.getFilteredNodes("hidden", cache);
  }
  getOutputNodes(cache = false): Node[] {
    return this.getFilteredNodes("output", cache);
  }

  setOutputCallback(index, callback) {
    this.getOutputNodes()[index].setCallback(callback);
  }
  setOutputCallbacks(callbacks) {
    _.each(this.getOutputNodes(), (node, index) => {
      this.setOutputCallback(index, callbacks[index]);
    });
  }

  export() {
    return { nodes: _.map(this.nodes, node => node.export()) };

  }
  static import(raw, trace: Trace = null) {
    if (raw.nodes.length === undefined) {
      throw new Error();
    }

    const network = new Network(trace);
    const nodeInstances = [];
    const callbacks = [];

    _.map(raw.nodes, nodeRaw => {
      // for each raw node, let Node create an instance and a callback when all nodes are instantiated
      const result = Node.import(nodeRaw);
      nodeInstances.push(result.node)
      callbacks.push(result.callback)
    });

    _.each(callbacks, callback => {
      // all nodes are instantiated, run callback, create connections.
      callback(nodeInstances);
    })

    network.nodes = nodeInstances;
    return network;
  }
}
