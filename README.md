
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge Unifi Plugin

Ubiquiti Unifi plug-in for [Homebridge](https://github.com/nfarina/homebridge).

`homebridge-unifi-os` currently allows you to block/unblock clients. If you choose to get notifications when a user is blocked or unblocked 
the plugin will setup each client device as a lock, otherwise they will be switches.  Currently to find new clients you have to restart the 
bridge but support for auto discover will be added soon.

## Installation

Before installing this plugin, you should install Homebridge using the [official instructions](https://github.com/homebridge/homebridge/wiki).

### Install via Homebridge Config UI X
1. Search for `Homebridge Unifi OS` on the Plugins tab of [Config UI X](https://www.npmjs.com/package/homebridge-config-ui-x).
2. Install the `Homebridge Unifi OS` plugin and use the form to enter your configuration.

### Manual Installation
2. Install this plug-in using: `npm install -g homebridge-unifi-os`
3. Update your configuration file. See example `config.json` snippet below.

## Configuration

Configuration sample (edit `~/.homebridge/config.json`):

```json
{
  "platform": "UnifiOS",
  "username": "<unifi login>",
  "password": "<password>",
  "notifications": true,
  "siteName": "default",
  "controllerAddress": "192.168.1.1",
  "controllerPort": "443"
}
```

Required fields:

* `"username"`: The username you use to login to the controller.
* `"password"`: The password you use to login to the controller.
* `"controllerAddress"`: The address or hostname of the controller.


Optional fields:

* `"controllerPort"`: The port you use to connect to the controller (default: 443).
* `"siteName"`: The name of the site in the controller (default: default).
* `"notifications"`: Whether or not you wish to get notified of state changes (default: false).