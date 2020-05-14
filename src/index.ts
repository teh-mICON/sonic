/*
https://www.physiologyweb.com/lecture_notes/neuronal_action_potential/neuronal_action_potential_refractory_periods.html
https://medium.com/analytics-vidhya/an-introduction-to-spiking-neural-networks-part-1-the-neurons-5261dd9358cd
*/
import * as _ from "lodash";

import Network from "./network";

const setCallbacks = (network: Network) => {
  network.setOutputCallback(0, () => {
    console.log("true");
  });
  network.setOutputCallback(1, () => {
    console.log("false");
  });
};

const network = new Network().initRandom(2, 3, 2);
setCallbacks(network);

const loop = () => {
  _.times(100, () => {
    _.times(1000, () => {
      network.activate([0, 1]);
      network.tick();
    });
  });

  setTimeout(loop, 1000);
};
loop();
console.log(network)

/*
console.log(network);

const clone = Network.import(network.export());

console.log(clone);
loop();
*/
