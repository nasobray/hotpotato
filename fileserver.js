const fs = require('fs-extra');
const config = require('./config');
const utilities = require("./utilities")
var chalk = require('chalk');
const FtpSrv = require('ftp-srv');
var ftpServer = null;

module.exports = {

    initFileReceiveServer: function () {

        let options = {
            url: 'ftp://' + config.nodeIP + ':' + config.FileReceiveServerPort,
            anonymous: true,
            greeting: ["Hello HotPotato"],
            pasv_url: config.nodeIP
        }

        ftpServer = new FtpSrv(options);



        ftpServer.on('login', (data, resolve, reject) => {



            resolve({
                root: config.landingZone
            });


        });

        ftpServer.on('client-error', (connection, context, error) => {
            console.log('connection: ' + connection);
            console.log('context: ' + context);
            console.log('error: ' + error);
        });

        ftpServer.on('STOR', (error, fileName) => {
            console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[NEW]') + `\tNew file has been uploaded to the FTP File Server`);
        });





        ftpServer.listen()
            .then(() => {
                console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[STARTED]') + `\tFTP file receiving server running at ftp://${config.nodeIP}:${config.FileReceiveServerPort}/`);
            }).catch(err => {
                console.log("[error]", err);
            });






    }

};