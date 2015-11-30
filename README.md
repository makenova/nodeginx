# nodeginx

This is a work in progress, built with my narrow use case in mind.

Nodeginx is a CLI helper for managing [Nginx](https://www.nginx.com) virtual
host configs. This assumes you are using the sites-available and
sites-enabled setup, where those directories are arranged as so,

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

## Installation

This is a scoped [NPM](https://www.npmjs.com) package, [Node.js](https://nodejs.org/en/) is a prerequisite.

```
$ npm install --g @makenova/nodeginx
```

## Use

Type `nodeginx` on the command line, your sites should be listed, and you
will be prompted. The nginx config files are usually in a directory that
requires root permission. You may be prompted for you password if your user is
not set up for pasword-less sudo (not tested).

```
makenova@gia:~$ nodeginx
✔ is enabled
✘ is disabled

default ✘
makenova ✔
votebot ✔
webtask ✘


? What would you like to do? (Use arrow keys)
❯ enable/disable a site
  add a site
  remove a site
  start/stop/restart nginx
  exit
```
## Bugs
Please report any bugs to: <https://github.com/makenova/nodeginx/issues>

## License

Licensed under the MIT License: <https://opensource.org/licenses/MIT>
