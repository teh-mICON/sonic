import _ from 'lodash'

export default class Trace {
  public events = [];

  activation(node, lock, energy, excitability, value) {
    this.events.push({ event: 'activation', node, lock, energy, excitability, value });
  }

  fire(connection, energy, strength) {
    this.events.push({ event: 'fire', connection, energy, strength });
  }

  export() {
    return _.map(this.events, data => {
      if (data.event == 'activation') {
        return {
          event: 'activation',
          node: data.node.getID(),
          lock: data.lock,
          energy: data.energy,
          excitability: data.excitability,
          value: data.value
        }
      }

      return {
        event: 'fire',
        connection: { from: data.connection.from.getID(), to: data.connection.to.getID(), strength: data.strength }
      }
    })
  }
}