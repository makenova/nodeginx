#!/usr/bin/env node

var fs = require('fs');
var chalk = require('chalk');
var async = require('async');
var inquirer = require('inquirer');
var exec = require('child_process').exec;

// TODO: account for alternate install locations
// http://nginx.org/en/docs/beginners_guide.html
// nginx may be installed in /usr/local/nginx/conf, /etc/nginx, or
// /usr/local/etc/nginx.

// nginx constants
const NGINX_PATH = '/etc/nginx/';
const sitesAvailableStr = 'sites-available';
const sitesEnabledStr = 'sites-enabled';
const CR = '\n';

// actions
const toggleSiteStr = 'enable/disable a site';
const addSiteStr = 'add a site';
const removeSiteStr = 'remove a site';
const manageNginxStr = 'start/stop/restart nginx';
const exitProgramStr = 'exit';

fs.readdir(NGINX_PATH, (err, files) => {
  bail(err);
  var sitesFolders = files.some((file)=>{
    return file === sitesAvailableStr || file === sitesEnabledStr;
  });
  if (sitesFolders){
    fs.readdir(NGINX_PATH + sitesAvailableStr, (err, files) => {
      'use strict';
      bail(err);
      let sitesAvailable = files;
      fs.readdir(NGINX_PATH + sitesEnabledStr, (err, files) => {
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
            message: 'Select sites to enable (spacebar to select)',
            choices: markedSites,
            when: function (answers){
              return answers.action === toggleSiteStr;
            }
          },
          {
            type: 'input',
            name: 'askAddSite',
            message: 'Enter path to config file',
            when: function (answers){
              return answers.action === addSiteStr;
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
            toggleSites(sitesEnabled, answers.askToggleSite, (err)=>{
              bail(err);
            });
          }else if (answers.askAddSite) {
            addSite(answers.askAddSite);
          }else if (answers.askConfirmRemoveSite) {
            removeSite(answers.askRemoveSite, (err)=>{
              bail(err);
              gracefulExit();
            });
          }else if (answers.askManageNginx) {
            manageNginx(answers.askManageNginx, (err)=>{
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
function xorleft (array0, array1){
  return array0.filter(array0element=>{
    return !array1.some(array1element=>{
      return array1element === array0element;
    });
  });
}

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

function fileExists(filepath){
  fs.stat(filepath, (err, stats)=>{
    return Boolean(stats);
  });
}

function sudoRemove(filepath, callback) {
  // Would prefer `fs.unlink` but, I don't know how to make it work with sudo
  exec(`sudo rm ${filepath}`, (err, stdout, stderr)=>{
    if(err) return callback(err);
    console.log(stdout, stderr);
    callback();
  });
}

// Nginx process functions
function manageNginx(action, callback) {
  // TODO: research if sending signals is better
  // i.e. sudo nginx -s stop|quit|reload
  exec(`sudo service nginx ${action}`, (err, stdout, stderr)=>{
    if(err){
      console.log(`failed to $(action) nginx`);
      return callback(err);
    }
    console.log(`${action}ed nginx`);
    return callback();
  });
}

// Toggle site function and helpers
function enableSite (site, callback){
  // would prefer `fs.symlink` but, sudo
  exec(`sudo ln -s ${NGINX_PATH}${sitesAvailableStr}/${site} ${NGINX_PATH}${sitesEnabledStr}/${site}`, (err, stdout, stderr)=>{
    if(err) return callback(err);
    console.log(`enable ${site}`, stdout, stderr);
    callback();
  });
}

function disableSite (site, callback){
  sudoRemove(`${NGINX_PATH}${sitesEnabledStr}/${site}`, (err)=>{
    if(err) return callback(err);
    console.log(`disabled ${site}`);
    callback();
  });
}

function toggleSites (sitesEnabled, askToggleSiteAnswers, toggleDoneCB){
  async.series([
    // enable sites
    (callback)=>{
      async.eachSeries(xorleft(askToggleSiteAnswers, sitesEnabled),enableSite,
        callback);
    },
    // disable sites
    (callback)=>{
      async.eachSeries(xorleft(sitesEnabled, askToggleSiteAnswers),disableSite,
        callback);
    },
    // reload nginx configuration
    (callback)=>{
      manageNginx('reload', callback);
    }
  ], (err)=>{
    if (err) {
      return toggleDoneCB(err);
    }
    toggleDoneCB();
  });
}

// Add and remove virtual host file
function addSite (pathToConfig){
  console.log('addSite', pathToConfig);
}

function removeSite (site, removeSiteDoneCB){
  // if the file is currently enabled, disable it before removing it.
  async.series([
    (callback)=>{
      if(fileExists(`${NGINX_PATH}${sitesEnabledStr}/${site}`)){
        disableSite(site, callback);
      }else{
        return callback();
      }
    }, (callback)=>{
      sudoRemove(`${NGINX_PATH}${sitesAvailableStr}/${site}`, (err)=>{
        if(err) return callback(err);
        console.log(`${site} removed`);
        return callback();
      });
    }, (callback)=>{
      manageNginx('reload', callback);
    }
  ], (err)=>{
    if(err) return removeSiteDoneCB(err);
    return removeSiteDoneCB();
  });
}
