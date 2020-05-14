import Node from "./node";
import _ from "lodash";
import Trace from './trace';

export default class Connection {
  // 'excite' or 'inhibit'
  private type: string;
  private energy = 0.1;
  private from: Node;
  private to: Node;
  private strength = 1;
  private config = {
    strengthIncrease: 0,
    strengthDecrease: 0
  };

  constructor(type, from: Node, to: Node, config = null) {
    if(from === undefined) {
      throw new Error('undefined from node in connection')
    }
    if(to === undefined) {
      throw new Error('undefined to node in connection')
    }
    this.type = type;
    this.from = from;
    this.to = to;
    if (config !== null) this.config = config;
  }

  initRandom() {
    this.config = Connection.getRandomConfig();
    return this;
  }

  static getRandomConfig() {
    return {
      strengthIncrease: Math.random(),
      strengthDecrease: Math.random() / 100
    };

  }

  fire(energy, depth, trace: Trace) {
    if(trace !== null) {
      trace.fire(this, energy, this.strength)
    }
    energy = this.type === "excite" ? energy : -energy;
    this.to.activate(energy * this.strength, depth, trace);
    this.energy = 0.1;
    this.strength += this.config.strengthIncrease;
  }

  getNode() {
    return this.to;
  }

  tick() {
    this.strength -= this.config.strengthDecrease;
  }

  export() {
    return { type: this.type, from: this.from.getID(), to: this.to.getID(), config: this.config };
  }
  static import(raw, from, to) {
    return new Connection(raw.type, from, to, raw.config);
  }
}
