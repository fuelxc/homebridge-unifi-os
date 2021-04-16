import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { UnifiOsPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class UnifiClientDevice {
  private service: Service;

  private states = {
    On: true,
  };

  constructor(
    private readonly platform: UnifiOsPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly initialIsOn: boolean,
  ) {

    const clientDevice = accessory.context.device;
    const displayName = clientDevice.name || clientDevice.hostname || clientDevice.device_name || clientDevice.mac;

    this.states.On = initialIsOn;

    if (displayName === clientDevice.mac) {
      this.platform.log.debug('No name for client: ', clientDevice);
    }

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.SerialNumber, clientDevice.mac);

    if (this.platform.config.notifications) {
      this.platform.log.debug('Build Lock');
      const switchService = this.accessory.getService(this.platform.Service.Switch);
      if (switchService) {
        this.accessory.removeService(switchService);
      }

      this.service = this.buildLock();
    } else {
      this.platform.log.debug('Build Switch');
      const lockService = this.accessory.getService(this.platform.Service.LockMechanism);
      if (lockService) {
        this.accessory.removeService(lockService);
      }

      this.service = this.buildSwitch();
    }

    this.service.setCharacteristic(this.platform.Characteristic.Name, displayName);
  }

  buildLock(): Service {
    const service = this.accessory.getService(this.platform.Service.LockMechanism) ||
      this.accessory.addService(this.platform.Service.LockMechanism);

    service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getLockState.bind(this));

    service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.setLockState.bind(this))
      .onGet(this.getLockState.bind(this));

    return service;
  }

  buildSwitch(): Service {
    const service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setSwitchOn.bind(this))
      .onGet(this.getSwitchOn.bind(this));

    return service;
  }

  updateClientState(turnOn: CharacteristicValue): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (turnOn) {
        this.platform.controller.unblockClient(this.platform.siteName, this.accessory.context.device.mac, (error, resp) => {
          if (error) {
            this.platform.log.error('Error: ', error);
            reject(error);
          }
          this.platform.log.debug('updateClientState resp: ', resp);
          resolve(resp[0][0].blocked);
        });
      } else {
        this.platform.controller.blockClient(this.platform.siteName, this.accessory.context.device.mac, (error, resp) => {
          if (error) {
            this.platform.log.error('Error: ', error);
            reject(error);
          }
          this.platform.log.debug('updateClientState resp: ', resp);
          resolve(resp[0][0].blocked);
        });
      }
    });
  }

  getClientState(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.platform.controller.getBlockedUsers(this.platform.siteName, (error, userData) => {
        if (error) {
          this.platform.log.error('Error: ', error);
          reject(error);
        }
        const isOn = !(userData[0].map(client => client.mac).includes(this.accessory.context.device.mac));

        resolve(isOn);
      });
    });
  }

  async setSwitchOn(value: CharacteristicValue) {
    this.updateClientState(value)
      .then(isOn => {
        this.states.On = isOn;
      })
      .catch(error => {
        this.platform.log.error(`Error in setOn: ${error}`);
      });
  }

  async getSwitchOn(): Promise<CharacteristicValue> {
    return this.getClientState();
  }

  async getLockState(): Promise<CharacteristicValue> {
    return new Promise((resolve, reject) => {
      this.getClientState()
        .then(state => {
          this.platform.log.debug('State: ', state);
          resolve( state ? this.platform.Characteristic.LockCurrentState.UNSECURED :
            this.platform.Characteristic.LockCurrentState.SECURED);
        })
        .catch(error => {
          this.platform.log.error('Error: ', error);
          reject(error);
        });
    });
  }

  async setLockState(value: CharacteristicValue) {
    this.updateClientState(value === this.platform.Characteristic.LockCurrentState.UNSECURED)
      .then(isOn => {
        this.states.On = isOn;
      })
      .catch(error => {
        this.platform.log.error(`Error in setOn: ${error}`);
      });
  }
}
