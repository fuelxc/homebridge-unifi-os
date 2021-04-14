import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { UnifiOsPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class UnifiClientDevice {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private states = {
    On: true
  };

  constructor(
    private readonly platform: UnifiOsPlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    const clientDevice = accessory.context.device
    const displayName = clientDevice.name || clientDevice.hostname || clientDevice.mac

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

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    if (value as boolean) {
      this.platform.controller.unblockClient(this.platform.siteName, this.accessory.context.device.mac, (error) => {
        if (error) {
          this.platform.log.error(`Can't setOn: ${error}`);
          return;
        }
        this.states.On = value as boolean;
      });
    } else {
      this.platform.controller.blockClient(this.platform.siteName, this.accessory.context.device.mac, (error) => {
        if (error) {
          this.platform.log.error(`Can't setOn: ${error}`);
          return;
        }
        this.states.On = value as boolean;
      });
    }
    

    this.platform.log.debug('Set Characteristic On ->', value);
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
    this.platform.controller.getBlockedUsers(this.platform.siteName, (error, usersData) => {
      if (error) {
        this.platform.log.error(`Can't getOn: ${error}`);
        return;
      };
      this.platform.log.debug("Blocked:", JSON.stringify(usersData[0]));
    });

    const isOn = this.states.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }
}
