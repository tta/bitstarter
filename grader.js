#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var DOWNLOADFILE = "temp.html";
var rest = require('restler');
var util = require('util');

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};



//var assertUrlExists = function(inurl) {
//    var responsefn = buildfn(DOWNLOADFILE);
//    rest.get(inurl).on('complete',responsefn);
//};
    

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(DOWNLOADFILE) {
    var responsefn = function(result) {
        console.log('in responsefn');
        if (result instanceof Error) {
            console.log("result instanceof error");
            console.error('Error: ' + util.format(result.message));
            process.exit(1);
        } else {
            console.log("Write to temp.html");
            fs.writeFileSync(DOWNLOADFILE, result); //might need to check for existence of temp.html here
        }
    };
    console.log("in buildfn");
    return responsefn;
    console.log("in buildfn");
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <file_url>', 'URL to html file to check') 
        .parse(process.argv);
    var filename = "";
    if (program.url) {
//        var responsefn = buildfn(DOWNLOADFILE);
//        rest.get(program.url.toString()).on('complete',responsefn);
        rest.get(program.url.toString()).on('complete', function(result) {
            if (result instanceof Error) {
                console.log("result instanceof error");
                console.error('Error: ' + util.format(result.message));
                process.exit(1);
            } else {
                console.log("Write to temp.html");
                fs.writeFileSync(DOWNLOADFILE, result); //might need to check for existence of temp.html here
                var checkJson = checkHtmlFile(DOWNLOADFILE, program.checks);
                var outJson = JSON.stringify(checkJson, null, 4);
                console.log(outJson);
//                fs.unlink(DOWNLOADFILE);
            }
        });
    } else {
        filename = program.file;
        var checkJson = checkHtmlFile(filename, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
