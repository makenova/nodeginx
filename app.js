#!/usr/bin/env node

var fs = require('fs');
var chalk = require('chalk');
var async = require('async');
var inquirer = require('inquirer');
var exec = require('child_process').exec;

// nginx constants
const NGINX_PATH = '/etc/nginx/';
const sitesAvailableStr = 'sites-available';
const sitesEnabledStr = 'sites-enabled';
const CR = '\n';

// actions
const toggleSiteStr = 'enable/disable a site';
const manageSiteStr = 'add/remove a site';
const restartNginxStr = 'start/stop/restart nginx';
const exitProgramStr = 'exit';

// var cmdArgs = process.argv.slice(2);

fs.readdir(NGINX_PATH, (err, files) => {
  if (err) throw err;
  // if (err) process.exit(1);
  var sitesFolders = files.some((file)=>{
    return file === sitesAvailableStr || file === sitesEnabledStr;
  });
  if (sitesFolders){
    fs.readdir(NGINX_PATH + sitesAvailableStr, (err, files) => {
      'use strict';
      if (err) throw err;
      let sitesAvailable = files;
      fs.readdir(NGINX_PATH + sitesEnabledStr, (err, files) => {
        if (err) throw err;
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
              manageSiteStr,
              restartNginxStr,
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
            type: 'list',
            name: 'askManageSite',
            message: 'Select site to ',
            choices: [],
            when: function (answers){
              return answers.action === manageSiteStr;
            }
          }
        ];

        // prompt user for action
        inquirer.prompt(questions, function (answers){

          console.log(answers);
          if(answers.askToggleSite){
            toggleSite(sitesEnabled, answers.askToggleSite);
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

// Toggle site function and helpers
function enableSite (site, callback){
  // TODO: change for console.log to exec
  console.log(`sudo ln -s ${NGINX_PATH}${sitesAvailableStr}/${site} ${NGINX_PATH}${sitesEnabledStr}/${site}`);
  callback();
}

function disableSite (site, callback){
  // TODO: change for console.log to exec
  console.log(`sudo rm ${NGINX_PATH}${sitesEnabledStr}/${site}`);
  callback();
}

function toggleSite (sitesEnabled, askToggleSiteAnswers){
    // enable sites
    async.eachSeries(xorleft(askToggleSiteAnswers, sitesEnabled),
    enableSite, (err)=>{
      if(err){
        console.log(err);
        process.exit(1);
      }
    });
    // disable sites
    async.eachSeries(xorleft(sitesEnabled, askToggleSiteAnswers),
    disableSite, (err)=>{
      if(err){
        console.log(err);
        process.exit(1);
      }
    });
}
