require('dotenv').config();
var express = require('express');
var router = express.Router();
var adal = require('adal-node');
var MemoryCache = require('../lib/memory-cache');

var sampleParameters = {
    tenant: process.env.tenant,
    authorityHostUrl: process.env.authorityHostUrl,
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret, //azure active directory registered app secret
    resource: process.env.resource
  };

/* GET /devicecode */
router.get('/',
   async function(req, res) {

    try {
        let params = {
            active: { devicecode: true }
            ,
              userCode : '',
              deviceCode : '',
              verificationUrl : ''
          };

        var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

        //var cache = new MeusemoryCache();

        //var context = new adal.AuthenticationContext(authorityUrl, null, cache);
        var context = new adal.AuthenticationContext(authorityUrl, null);
        context.acquireUserCode(sampleParameters.resource, sampleParameters.clientId, 'es-mx', function (err, response) {
            if (err) {
                console.log('well that didn\'t work: ' + err.stack);
            } else {
                console.log(response);
                params.userCode = response.userCode;
                params.deviceCode = response.deviceCode;
                params.verificationUrl = response.verificationUrl;
                res.cookie('userCodeInfo', response);
                res.render('devicecode', params);
            }
        });
    } catch (err) {
      req.flash('error_msg', {
          message: 'Could not get access token. Try signing out and signing in again.',
          debug: JSON.stringify(err)
        });
   }
});

router.get('/callback',
  function(req, res, next) {
    let params = {
        active: { devicecode: true }
        ,
        token : ''
      };

    var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

    var context = new adal.AuthenticationContext(authorityUrl, null);
    context.acquireTokenWithDeviceCode(sampleParameters.resource, sampleParameters.clientId, req.cookies.userCodeInfo, function (err, tokenResponse) {
        if (err) {
            console.log(err);
            req.flash('error_msg', {
                message: 'Could not get access token. Try signing out and signing in again.',
                debug: JSON.stringify(err)
              });
        }
        else {
            console.log(tokenResponse);
            params.token = tokenResponse.accessToken;
            res.render('devicecode', params);
        }
    });
});
module.exports = router;


