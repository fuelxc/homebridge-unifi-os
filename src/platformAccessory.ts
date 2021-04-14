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

    if (displayName == clientDevice.mac) {
      this.platform.log.debug('No name for client: ', clientDevice);
    }

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.SerialNumber, clientDevice.mac);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }

  updateClient(turnOn: CharacteristicValue): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (turnOn) {
        return this.platform.controller.unblockClient(this.platform.siteName, this.accessory.context.device.mac, (error, resp) => {
          if (error) return reject(error);
          resolve(resp[0][0].blocked);
        });
      } else {
        return this.platform.controller.blockClient(this.platform.siteName, this.accessory.context.device.mac, (error, resp) => {
          if (error) return reject(error);
          resolve(resp[0][0].blocked);
        });
      }
    });
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    this.updateClient(value)
      .then(isOn => { this.states.On = isOn })
      .catch(error => { this.platform.log.error(`Error in setOn: ${error}`) });
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    return new Promise((resolve, reject) => {
      this.platform.controller.getBlockedUsers(this.platform.siteName, (error, userData) => {
        if (error) return reject(error);
        const isOn = !(userData[0].map(client => client.mac).includes(this.accessory.context.device.mac));

        resolve(isOn);
      });
    });
  }
}
