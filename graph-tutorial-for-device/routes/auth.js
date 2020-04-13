var express = require('express');
var passport = require('passport');
var router = express.Router();
var devicecode = require('../routes/devicecode.js');
var adal = require('adal-node');
var MemoryCache = require('../lib/memory-cache');

/* GET auth callback. */
router.get('/signin',
 function  (req, res, next) {
    try {
        let params = {
            active: { deviceReponse: true }
            ,
            response:{
              userCode : '',
              deviceCode : '',
              verificationUrl : ''
           }
          };

        var sampleParameters;
        
        var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

        var resource = '00000002-0000-0000-c000-000000000000';

        //var cache = new MeusemoryCache();

        //var context = new adal.AuthenticationContext(authorityUrl, null, cache);
        var context = new adal.AuthenticationContext(authorityUrl, null);
        context.acquireUserCode(resource, sampleParameters.clientId, 'es-mx', function (err, response) {
            if (err) {
                console.log('well that didn\'t work: ' + err.stack);
            } else {
                console.log(response);
                params.response.userCode = response.userCode;
                params.response.deviceCode = response.deviceCode;
                params.response.verificationUrl = response.verificationUrl;
                // context.acquireTokenWithDeviceCode(resource, sampleParameters.clientId, response, function (err, tokenResponse) {
                //     if (err) {
                //         console.log('error happens when acquiring token with device code');
                //         console.log(err);
                //     }
                //     else {
                //         console.log(tokenResponse);
                //         res.redirect('/auth/callback');
                //     }
                // });
                res.render('deviceReponse', params);
            }
        });
    } catch (err) {
      req.flash('error_msg', {
          message: 'Could not get access token. Try signing out and signing in again.',
          debug: JSON.stringify(err)
        });
    }
}


    // passport.authenticate('azuread-openidconnect',
    //   {
    //     response: res,
    //     prompt: 'login',
    //     failureRedirect: '/',
    //     failureFlash: true,
    //     successRedirect: '/'
    //   }
    // )(req,res,next);
);

router.post('/callback',
  function(req, res, next) {
    var sampleParameters;
    
    var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;

    var context = new adal.AuthenticationContext(authorityUrl, null);
    context.acquireTokenWithDeviceCode(resource, sampleParameters.clientId, response, function (err, tokenResponse) {
        if (err) {
            console.log('error happens when acquiring token with device code');
            console.log(err);
        }
        else {
            console.log(tokenResponse);
        }
    });
// passport.authenticate('azuread-openidconnect',
    //   {
    //     response: res,
    //     failureRedirect: '/',
    //     failureFlash: true
    //   }
    // )(req,res,next);
  }
);

router.get('/signout',
  function(req, res) {
    req.session.destroy(function(err) {
      req.logout();
      res.redirect('/');
    });
  }
);

module.exports = router;