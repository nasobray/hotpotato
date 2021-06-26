var http = require('http'),
    path = require('path'),
    os = require('os'),
    fs = require('fs-extra');

const config = require('./config');
const utilities = require("./utilities")
var chalk = require('chalk');


module.exports = {

    initFileReceiveServer: function () {


        console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.yellow('[START]') + "\tStarting the file receiving server");


        var Busboy = require('busboy');

        http.createServer(function (req, res) {

            if (req.method === 'POST') {

                var busboy = new Busboy({
                    headers: req.headers,
                    highWaterMark: config.RecieveBufferSize
                });

                busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
                    let saveTo = path.join(config.landingZone, path.basename(filename));
                    file.pipe(fs.createWriteStream(saveTo));


                    file.on('end', function (stream) {
                        console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[DONE]') + "\tFile "+filename+" has been recieved successfully");
                        //file.removeListener("data");
                        
                    });

                });


                busboy.on('finish', function () {
                    res.writeHead(200, {
                        'Connection': 'close'
                    });
                    res.end(chalk.blue(utilities.consoleTimestamp()) + " Closing connection");
                    console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[DONE]') + " Closing connection");
                });

                return req.pipe(busboy);
            }

            res.writeHead(404);
            res.end();

        }).listen(config.FileReceiveServerPort, function () {
            console.log(chalk.blue(utilities.consoleTimestamp()) + 'File upload server has been turned on. Listening on port ' + config.FileReceiveServerPort);
        });



    }

};