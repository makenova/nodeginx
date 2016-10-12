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
     |    |-- site-one
     |    +-- site-two
     +-- sites-available
          |-- site-two
```

server blocks are setup in the sites-available directory and are "turned on"
by creating a symbolic link to the sites-enabled directory. In the example
above, site-one and site-two are setup but only site-two is served by nginx.

## NOTE

**Writing tests for this has made me realize that the API is difficult to work
with. I'm slowly fixing that. That means that the documentation and tests are
incomplete.**

## Installation

This is a scoped [NPM](https://www.npmjs.com) package, [Node.js](https://nodejs.org/en/)
is a prerequisite.

```
$ npm install --g @makenova/nodeginx
```

## Use

This can be used as a standalone module but was made to be used through [`nodeginx-cli`](https://github.com/makenova/nodeginx-cli).

```
var nodeginx = require('@makenova/nodeginx')

const staticSiteObj = {
  askAddSite: 'use static template',
  tplPort: '80',
  tplServerName: 'mynameisjeffery',
  tplSiteRoot: '/home/user/mynameisjeffery'
}

nodeginx.addsite(staticSiteObj, function (err, message) {
  if (err) throw(err)
  console.log(message) // => pandas config file will be added to /etc/nginx/sites-available
})
```

## API

### `nodeginx.addsite(siteObj, cb)`

Add a site to the sites-available directory. The callback(`cb`) returns an
error `err` and a `message`.

The siteObj should have the following properties:

###### `siteObj.askAddSite `

string : 'use static template'

###### `siteObj.tplPort`

nubmer : 80 the port that the site should be served on

###### `siteObj.tplServerName`

string : 'pandas' the name of the site

###### `siteObj.tplSiteRoot`

string : '/home/user/pandas' The path to the site

### `nodeginx.removeSite(siteName, cb)`

Remove a site from the sites-available directory. If the site is enabled i.e.
has a symbolic link in the sites-enabled directory, the symbolic link will be
removed first. The callback(`cb`) only returns an `err`.

### `nodeginx.manageNginx(siteName, cb)`

Start, stop, reload, etc. nginx

### `nodeginx.toggleSites(siteName, cb)`

Enable or disable sites.

### `nodeginx.constants`

An object with useful constants

  * NGINX_PATH
  * sitesAvailableStr
  * sitesEnabledStr

## Bugs
Please report any bugs to: <https://github.com/makenova/nodeginx/issues>

## License

Licensed under the MIT License: <https://opensource.org/licenses/MIT>
