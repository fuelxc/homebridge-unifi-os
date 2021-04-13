import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { UnifiOsPlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, UnifiOsPlatform);
};

