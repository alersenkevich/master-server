import { spectatorController, slaveController } from '../controllers'


export default {
  Spectator: {
    auth: spectatorController.authorize,
  },
  Slave: {
    auth: slaveController.authorize,
    switchServer: slaveController.switchServer,
  },
}
