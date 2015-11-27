#!/usr/bin/env node

var fs = require('fs');
var chalk = require('chalk');
var inquirer = require('inquirer');

var nodeginx = require('./nodeginx');

const CR = '\n';

// user actions
const toggleSiteStr = 'enable/disable a site';
const addSiteStr = 'add a site';
const addSitePathStr = 'enter path to config file';
const addSiteStaticTplStr = 'use static template';
const addSiteProxyTplStr = 'use proxy template';
const removeSiteStr = 'remove a site';
const manageNginxStr = 'start/stop/restart nginx';
const exitProgramStr = 'exit';

fs.readdir(nodeginx.constants.NGINX_PATH, (err, files) => {
  bail(err);
  var sitesFolders = files.some((file)=>{
    return file === nodeginx.constants.sitesAvailableStr || file === nodeginx.constants.sitesEnabledStr;
  });
  if (sitesFolders){
    fs.readdir(nodeginx.constants.NGINX_PATH + nodeginx.constants.sitesAvailableStr, (err, files) => {
      'use strict';
      bail(err);
      let sitesAvailable = files;
      fs.readdir(nodeginx.constants.NGINX_PATH + nodeginx.constants.sitesEnabledStr, (err, files) => {
        bail(err);
        let sitesEnabled = files;

        // print list of sites, marked those that are enabled
        console.log(`${chalk.green('\u2714')} is enabled ${CR}${chalk.red('\u2718')} is disabled ${CR}`);
        let markedSites = sitesAvailable.map(site =>{
          let isEnabled = sitesEnabled.some( enabledSite => {
            return site === enabledSite;
          });
          if(isEnabled){
            console.log(site + chalk.green(' \u2714'));
            return {name: site, checked:isEnabled};
          }else{
            console.log(site + chalk.red(' \u2718'));
            return {name: site, checked:isEnabled};
          }
        });

        console.log(CR);

        // prep questions for user
        var questions = [
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              toggleSiteStr,
              addSiteStr,
              removeSiteStr,
              manageNginxStr,
              exitProgramStr
            ]
          },
          {
            type: 'checkbox',
            name: 'askToggleSite',
            message: 'Select sites to enable (spacebar to select):',
            choices: markedSites,
            when: function (answers){
              return answers.action === toggleSiteStr;
            }
          },
          {
            type: 'list',
            name: 'askAddSite',
            message: 'How would you like to add a site?',
            choices: [addSitePathStr, addSiteStaticTplStr, addSiteProxyTplStr],
            when: function (answers){
              return answers.action === addSiteStr;
            }
          },
          {
            type: 'input',
            name: 'askAddSiteConfig',
            message: 'Enter path to config file:',
            when: function (answers){
              return answers.askAddSite === addSitePathStr;
            }
          },
          {
            type: 'input',
            name: 'tplPort',
            message: 'What port is Nginx listening on?',
            default: '80',
            when: function (answers){
              return (answers.askAddSite === addSiteStaticTplStr ||
                answers.askAddSite === addSiteProxyTplStr);
            }
          },
          {
            type: 'input',
            name: 'tplServerName',
            message: 'Enter the site name:',
            when: function (answers){
              return Boolean(answers.tplPort);
            }
          },
          {
            type: 'input',
            name: 'tplSiteRoot',
            message: 'Enter the path to the site root:',
            when: function (answers){
              return Boolean(answers.askAddSite === addSiteStaticTplStr &&
                answers.tplServerName);
            }
          },
          {
            type: 'input',
            name: 'proxyServerIp',
            message: 'Enter the proxy server IP address:',
            default: '127.0.0.1',
            filter: (userport)=>{
              if (userport.toLowerCase() === 'localhost')
                userport = '127.0.0.1';
              return userport;
            },
            when: function (answers){
              return (answers.askAddSite === addSiteProxyTplStr &&
                answers.tplServerName);
            }
          },
          {
            type: 'input',
            name: 'proxyServerPort',
            message: 'Enter the proxy server port:',
            default: '6969',
            when: function (answers){
              return answers.proxyServerIp;
            }
          },
          {
            type: 'list',
            name: 'askRemoveSite',
            message: 'Select a site to remove',
            choices: sitesAvailable,
            when: function (answers){
              return answers.action === removeSiteStr;
            }
          },
          {
            type: 'confirm',
            name: 'askConfirmRemoveSite',
            message: (answers)=>{return `Are you sure you want to remove ${answers.askRemoveSite}:`;},
            default: false,
            when: function (answers){
              return answers.action === removeSiteStr;
            }
          },
          {
            type: 'list',
            name: 'askManageNginx',
            message: `Choose action:`,
            choices: [ 'start', 'stop', 'restart', 'reload', 'force-reload',
              'status', 'configtest', 'rotate', 'upgrade' ],
            default: false,
            when: function (answers){
              return answers.action === manageNginxStr;
            }
          }
        ];

        // prompt user for action and handle user answers
        inquirer.prompt(questions, function (answers){
          if (answers.askToggleSite) {
            nodeginx.toggleSites(sitesEnabled, answers.askToggleSite, (err)=>{
              bail(err);
            });
          }else if (answers.askAddSite) {
            nodeginx.addSite(answers, (err)=>{
              bail(err);
              gracefulExit();
            });
          }else if (answers.askConfirmRemoveSite) {
            nodeginx.removeSite(answers.askRemoveSite, (err)=>{
              bail(err);
              gracefulExit();
            });
          }else if (answers.askManageNginx) {
            nodeginx.manageNginx(answers.askManageNginx, (err)=>{
              bail(err);
            });
          }else {
            gracefulExit();
          }
        });
      });
    });
  }
});

// Utility
function gracefulExit() {
  console.log('Bye!');
  process.exit(0);
}

function bail(err){
  if (err) {
    console.log(err);
    process.exit(1);
  }
}
