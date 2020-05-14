import _ from 'lodash'
import Network from './network';
import Connection from './connection';

export default class Nature {
  static createMutatedNetwork(network, amount) {
    let clone: any = Network.import(network).export();
    Nature.mutateConfigs(clone, amount);
    Nature.createRandomConnection(clone)
    Nature.removeRandomConnection(clone)
    return clone;
  }

  static removeRandomConnection(clone) {
    // maybe remove random connection
    if (Math.random() > .5) return;

    const node = _.sample(clone.nodes);
    if(node.connections.length == 0) return;

    const connectionIndex = _.sample(_.range(0, node.connections.length));
    _.remove(node.connections, (connection, index) => index == connectionIndex)
  }

  static createRandomConnection(clone) {
    // maybe create new connection randomly
    if (Math.random() > .5) return;

    if(!clone.nodes.length) {
    }

    const randomFrom = _.sample(clone.nodes);
    const randomNodeConnected = _.map(randomFrom.connections, connection => connection.to);
    const candidates = _.filter(clone.nodes, node => {
      // no self connections
      if (node.id === randomFrom.id) return false;
      // no duplicate connections
      if (_.includes(randomNodeConnected, node.id)) return false;
      // no connections to input nodes
      if (node.type == 'input') return false;
      return true;

    })
    const randomTo = _.sample(candidates);
    if (randomTo) {
      randomFrom.connections.push({
        type: Math.random() > .5 ? 'excite' : 'inhibit',
        from: randomFrom.id,
        to: randomTo.id,
        config: Connection.getRandomConfig()
      });
    }
  }

  static mutateConfigs(clone, amount) {
    const minmax = (value, min, max = null) => {
      if (value < min) value = min;
      if (max !== null && value > max) value = max;
      return value;
    }

    
    _.each(clone.nodes, node => {
      node.config.threshold += Nature.getAmount(amount);
      node.config.threshold = minmax(node.config.threshold, .0001)
      

      node.config.tickEnergy += Nature.getAmount(amount);
      node.config.tickEnergy = minmax(node.config.tickEnergy, .0001)

      node.config.maxEnergy += Nature.getAmount(amount)
      node.config.maxEnergy = minmax(node.config.maxEnergy, 1, 1000)

      node.config.excitabilityMultiplier += Nature.getAmount(amount)
      node.config.excitabilityMultiplier = minmax(node.config.excitabilityMultiplier, 1.0001)

      _.each(node.connections, connection => {
        connection.config.strengthIncrease += this.getAmount(amount)
        connection.config.strengthIncrease = minmax(connection.config.strengthIncrease, .0001)

        connection.config.strengthDecrease += this.getAmount(amount)
        connection.config.strengthDecrease = minmax(connection.config.strengthDecrease, .0001)
        if (Math.random() < .1) {
          connection.type = connection.type == 'excite' ? 'inhibit' : 'excite'
        }
      });
      node.config.lockTicks += Math.round(Nature.getAmount(amount))
    });
  }

  static getAmount(amount) {
    return Math.random() * amount * (Math.random() > .5 ? 1 : -1)
  }
}