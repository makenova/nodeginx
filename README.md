# nodeginx

A helper library for managing [Nginx](https://www.nginx.com) virtual
host configs and the `nginx` process. This assumes you are using the
sites-available and sites-enabled setup, where those directories are arranged as
so,

```
/etc
|-- nginx
     |-- nginx.config
     |-- sites-enabled
     |    +-- site-two
     +-- sites-available
          |-- site-one
          +-- site-two
```

server blocks are setup in the sites-available directory and are "turned on"
by creating a symbolic link to the sites-enabled directory. In the example
above, site-one and site-two are setup but only site-two is served by nginx.

## Installation

This is a scoped [NPM](https://www.npmjs.com) package, [Node.js](https://nodejs.org/en/)
is a prerequisite.

```
$ npm install -g @makenova/nodeginx
```

## Use

This can be used as a standalone module but was made to be used through [`nodeginx-cli`](https://github.com/makenova/nodeginx-cli).

```
var nodeginx = require('@makenova/nodeginx')

const staticSiteObj = {
  askAddSite: 'use static template',
  port: '80',
  serverName: 'panda',
  siteRoot: '/home/user/panda'
}

nodeginx.addStaticSite(staticSiteObj, function (err, message) {
  if (err) throw(err)
  console.log(message) // => panda config file will be added to /etc/nginx/sites-available
})
```

## API

### `nodeginx.addStaticSite(siteObj, cb)`

Add a static site to the sites-available directory. The callback(`cb`) returns an error `err` and a `message`.

The siteObj should have the following properties:

###### `siteObj.port`

nubmer : 80 the port that the site should be served on

###### `siteObj.serverName`

string : 'panda' the name of the site

###### `siteObj.siteRoot`

string : '/home/user/panda' The absolute path to the site

### `nodeginx.addProxySite(siteObj, cb)`

Add a proxy site to the sites-available directory. The callback(`cb`) returns an error `err` and a `message`.

The siteObj should have the following properties:

###### `siteObj.port`

nubmer : 80 the port that the site should be served on

###### `siteObj.serverName`

string : 'panda' the name of the site

###### `siteObj.proxyServerIp`

string : '127.0.0.1' The IP address of the server where the site is running

###### `siteObj.proxyServerPort`

string : '8080' The port that the application is running on

### `nodeginx.addSiteFromUserFile(siteObj, cb)`

Add a site from a users config file. The file will be copied to the `sites-available` directory.

###### `siteObj.path`

string : '/home/user/panda' An absolute path to the config file

### `nodeginx.removeSite(siteName, cb)`

Remove a site from the sites-available directory. If the site is enabled i.e.
has a symbolic link in the sites-enabled directory, the symbolic link will be
removed first. The callback(`cb`) only returns an `err`.

### `nodeginx.enableSite(siteName, cb)`

Enable a site. All this does is create a symlink of a site in the
`sites-available` directory to the `sites-enabled` directory.

### `nodeginx.disableSite(siteName, cb)`

Disable a site. Delete a symlink of a site from the `sites-enabled` directory.

### `nodeginx.manageNginx(action, cb)`

Start, stop, reload, etc. nginx

### `nodeginx.constants`

An object with useful constants

  * NGINX_PATH - the `nginx.conf` location, defaults to '/etc/nginx'
  * sitesAvailableStr - the name of the `sites-available` directory
  * sitesEnabledStr - the name of the `sites-enabled` directory

## Bugs
Please report any bugs to: <https://github.com/makenova/nodeginx/issues>

## License

Licensed under the MIT License: <https://opensource.org/licenses/MIT>
