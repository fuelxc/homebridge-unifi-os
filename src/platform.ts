import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { UnifiClientDevice } from './platformAccessory';

import { Controller } from 'node-unifi';

export class UnifiOsPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly accessories: PlatformAccessory[] = [];

  public readonly controller: Controller;
  public readonly siteName: String;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    let requiredConfig = argName => {
      this.log.error(`${argName} is required. Check config.json.`)
      return;
    };
    
    let {
      username = requiredConfig('username'),
      password = requiredConfig('password'),
      controllerAddress = requiredConfig('controllerAddress'),
      controllerPort = 8443,
      siteName = "default"
    } = config;

    
    this.log.debug('Connecting to controller', controllerAddress);
    this.log.debug('Connecting to port', controllerPort);
    this.controller = new Controller(controllerAddress, controllerPort);
    this.siteName = siteName;

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      
      this.controller.login(username, password, (error) => {
        if (error) {
          this.log.error(`Can't login: ${error}`);
          return;
        };

        this.discoverDevices();
      });
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    this.accessories.push(accessory);
  }

  discoverDevices() {
    this.controller.getAllUsers(this.siteName, (error, usersData) => {
      if (error) {
        this.log.error(`Can't discover: ${error}`);
        return;
      };
      this.registerDevices(usersData[0], true)
    });

    this.controller.getBlockedUsers(this.siteName, (error, usersData) => {
      if (error) {
        this.log.error(`Can't discover: ${error}`);
        return;
      };
      this.registerDevices(usersData[0], false)
    });
  }

  registerDevices(devices, isOn) {
    for (const clientDevice of devices) {
      const uuid = this.api.hap.uuid.generate(clientDevice.mac);
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
      this.log.debug('Processing', JSON.stringify(clientDevice));
      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        this.log.debug('isOn: ', isOn);
        new UnifiClientDevice(this, existingAccessory, isOn);
      } else {
        // the accessory does not yet exist, so we need to create it
        let displayName = clientDevice.name || clientDevice.hostname || clientDevice.device_name || clientDevice.mac
        this.log.info('Adding new accessory:', displayName);

        const accessory = new this.api.platformAccessory(displayName, uuid);
        accessory.context.device = clientDevice;

        new UnifiClientDevice(this, accessory, isOn);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
