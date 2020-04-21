require('dotenv').config();
var express = require('express');
var router = express.Router();
var adal = require('adal-node');
var MemoryCache = require('../lib/memory-cache');
var tokens = require('../tokens.js');
var graph = require('../graph.js');

var sampleParameters = {
  tenant: process.env.tenant,
  authorityHostUrl: process.env.authorityHostUrl,
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret, //azure active directory registered app secret
  resource: process.env.resource
};
var http = require('http');

//var querystring = require('querystring');  
/* GET /devicecode */
router.get('/',
  async function (req, res) {
    try {
      let params = {
        active: { devicecode: true }
        ,
        userCode: '',
        deviceCode: '',
        verificationUrl: '',
        token: ''
      };

      var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

      //var cache = new MeusemoryCache();

      //var context = new adal.AuthenticationContext(authorityUrl, null, cache);
      // var context = new adal.AuthenticationContext(authorityUrl, null);
      // context.acquireUserCode(sampleParameters.resource, sampleParameters.clientId, 'es-mx', function (err, response) {
      //     if (err) {
      //         console.log('well that didn\'t work: ' + err.stack);
      //     } else {
      //         console.log(response);
      //         params.userCode = response.userCode;
      //         params.deviceCode = JSON.stringify(response);
      //         params.verificationUrl = response.verificationUrl;
      //         res.cookie('userCodeInfo', response);
      //         res.render('devicecode', params);
      //         //res.json(response);
      //     }
      // });
      // the options  
      var options = {
        host: 'localhost',
        port: '5000',
        path: '/getDeviceCode',
        method: 'GET'
      };

      // do the GET call   
      var resPost = http.request(options, function (resPost) {
        resPost.on('data', function(result) { 
          //res.json(data);
          var data = JSON.parse(result.toString()); 
          params.userCode = data.userCode;
          params.deviceCode = data.deviceCode;
          params.verificationUrl = data.verificationUrl;
          res.cookie('userCodeInfo', result.toString());
          res.render('devicecode', params);
  
        });
      });
      resPost.end();

      resPost.on('error', function (e) {
        console.error(e);
      });

    } catch (err) {
      req.flash('error_msg', {
        message: 'Could not get access token. Try signing out and signing in again.',
        debug: JSON.stringify(err)
      });
    }
  });

router.get('/callback',
  function (req, res, next) {
    let params = {
      active: { devicecode: true }
      ,
      token: ''
    };

    // var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

    // var context = new adal.AuthenticationContext(authorityUrl, null);
    // context.acquireTokenWithDeviceCode(sampleParameters.resource, sampleParameters.clientId, req.cookies.userCodeInfo, function (err, tokenResponse) {
    //   if (err) {
    //     console.log(err);
    //     req.flash('error_msg', {
    //       message: 'Could not get access token. Try signing out and signing in again.',
    //       debug: JSON.stringify(err)
    //     });
    //   }
    //   else {
    //     console.log(tokenResponse);
    //     params.token = tokenResponse.accessToken;
    //     res.render('devicecode', params);
    //     res.json(response);
    //   }
    // });
    var result = req.cookies.userCodeInfo;
    var postheaders = {  
      'Content-Type' : 'application/json; charset=UTF-8',  
      'Content-Length' : Buffer.byteLength(req.cookies.userCodeInfo, 'utf8')  
    };  
    var optionsPost = {
      host: 'localhost',
      port: '5000',
      path: '/getToken',
      method: 'POST',
      headers : postheaders 
    };
    var resPost2 = http.request(optionsPost, function (resPost2) {
      resPost2.on('data', function(result2) { 
        var data2 = JSON.parse(result2.toString()); 
        params.token = data2.accessToken;
        res.cookie('token', result2.toString());
        res.render('devicecode', params);
      });
    });
    resPost2.write(result); 
    resPost2.end();

    resPost2.on('error', function (e) {
      console.error(e);
    });
  });

  router.get('/me',
  async function (req, res, next) {
    var result = req.cookies.token;
    if (!result) {
      // Redirect unauthenticated requests to home page
      res.redirect('/')
    } else {
      let params = {
        active: { devicecode: true }
        ,
      token: ''
      };

      // Get the access token
      var accessToken = JSON.parse(result).accessToken;
      try {
        accessToken = await tokens.getAccessToken(req);
        res.cookie('token', req.cookies.token);
      } catch (err) {
        req.flash('error_msg', {
            message: 'Could not get access token. Try signing out and signing in again.',
            debug: JSON.stringify(err)
          });
      }

      if (accessToken && accessToken.length > 0) {
        try {
          // Get the events
          var events = await graph.getUserDetails(accessToken);
          params.token = events.displayName;
        } catch (err) {
            req.flash('error_msg', {
                message: 'Could not fetch events',
                debug: JSON.stringify(err)
              });
        }
      }
      res.render('devicecode', params);
    }
  });
module.exports = router;


