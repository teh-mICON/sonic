import Connection from "./connection";
import _ from "lodash";
import Trace from './trace';

export default class Node {
  private id;
  private type;
  private config = {
    threshold: 0,
    lockTicks: 0,
    tickEnergy: 0,
    maxEnergy: 100,
    excitabilityMultiplier: 1.1
  };
  private connections = [];
  private lock = 0;
  private excitability = 100;
  private callback;
  private energy = 0.1;

  constructor(id, type, config = null) {
    this.id = id;
    this.type = type;
    if (config !== null) this.config = config;
  }
  setCallback(callback) {
    this.callback = callback;
  }

  initRandom() {
    this.config.threshold = Math.random();
    this.config.lockTicks = 0;
    this.config.tickEnergy = Math.random() * 10;
    this.config.maxEnergy = Math.floor(Math.random() * 1000);
    this.config.excitabilityMultiplier = 1.01
    return this;
  }

  activate(value, depth, trace: Trace = null) {
    if(trace !== null) {
      trace.activation(this, this.lock, this.energy, this.excitability, value);
    }
    if (depth > 25) return;
    if (this.lock) return;
    

    this.energy += (this.excitability / 100) * value;
    if (this.energy >= this.config.threshold) {
      this.lock = this.config.lockTicks;
      this.excitability = 1;
      if (this.type === "output") {
        this.callback();
      }
      this.lock = this.config.lockTicks;
      _.each(this.connections, (connection: Connection) =>
        connection.fire(this.energy, depth + 1, trace)
      );
      this.energy = 0.1;
    }
  }

  tick() {
    // refraction
    if (this.lock > 0) {
      this.lock--;
    }
    else {
      this.excitability *= this.config.excitabilityMultiplier;
      if (this.excitability > 100) this.excitability = 100;
    }
    console.log('ticktock')

    // add to energy by tickenergy to excitability percentage (up to max)
    this.energy += this.config.tickEnergy * (this.excitability / 100);
    if (this.energy > this.config.maxEnergy)
      this.energy = this.config.maxEnergy;
    _.each(this.connections, connection => connection.tick());
  }

  connectionExists(node: Node) {
    let exists = false;
    _.each(this.connections, connection => {
      if (connection.getNode().getID() !== node.getID()) return;
      exists = true;
      return false;
    });
    return exists;
  }

  getType() {
    return this.type;
  }
  getID() {
    return this.id;
  }
  getConnections() {
    return this.connections;
  }
  addConnection(connection: Connection) {
    this.connections.push(connection);
  }

  export() {
    return {
      id: this.id,
      type: this.type,
      config: this.config,
      connections: _.map(this.connections, connection => connection.export())
    };
  }
  static import(raw) {
    const node = new Node(raw.id, raw.type, raw.config);

    const callback = (nodes) => {
      node.connections = [];
      _.map(raw.connections, (connection, index) => {
        const fromNode = _.find(nodes, node => node.id == connection.from)
        const toNode = _.find(nodes, node => node.id == connection.to)
        if(!fromNode) {
          throw new Error('could not find from node with id (' + connection.from + ') in nodes.');
        }
        if(!toNode) {
          throw new Error('could not find to node with id (' + connection.to + ') in nodes.');
        }
        node.connections.push(new Connection(connection.type, fromNode, toNode, connection.config))
      });
    }

    // return the node and a closure that will add the connections to the node. This callback is called once all nodes have been instantiated
    // can't create connections between nodes before then.
    return {node, callback};
  }

  static importConnections(connections, lookup) {

  }
}
