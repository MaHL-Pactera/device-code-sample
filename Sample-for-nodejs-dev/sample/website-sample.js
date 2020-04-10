/*
 * @copyright
 * Copyright © Microsoft Open Technologies, Inc.
 *
 * All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: *www.apache.org/licenses/LICENSE-2.0
 *
 * THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS
 * OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION
 * ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A
 * PARTICULAR PURPOSE, MERCHANTABILITY OR NON-INFRINGEMENT.
 *
 * See the Apache License, Version 2.0 for the specific language
 * governing permissions and limitations under the License.
 */
'use strict';

var express = require('express');
var logger = require('connect-logger');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var crypto = require('crypto');
//var graph = require('./graph.js');
var AuthenticationContext = require('adal-node').AuthenticationContext;

/*
 * You can override the default account information by providing a JSON file
 * with the same parameters as the sampleParameters variable below.  Either
 * through a command line argument, 'node sample.js parameters.json', or
 * specifying in an environment variable.
 * {
 *   "tenant" : "rrandallaad1.onmicrosoft.com",
 *   "authorityHostUrl" : "https://login.windows.net",
 *   "clientId" : "624ac9bd-4c1c-4686-aec8-e56a8991cfb3",
 *   "clientSecret" : "verySecret="
 * }
 */
var sampleParameters;
sampleParameters = {
  tenant: '', // tenant ID in Microsoft Azure. How to get the information,You can refer to the file(AFS-12構築手順_200324.xlsx)
  authorityHostUrl: 'https://login.microsoftonline.com/common',
  clientId: '',//APP ID in Microsoft Azure. How to get the information,You can refer to the file(AFS-12構築手順_200324.xlsx)
  clientSecret: ''//Client Secret Password. How to get the information,You can refer to the file(AFS-12構築手順_200324.xlsx)
};
var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;
var resource = '00000002-0000-0000-c000-000000000000';
var authenticationContext = new AuthenticationContext(authorityUrl);
var app = express();
app.use(logger());
app.use(cookieParser('a deep secret'));
app.use(session({ secret: '' }));//Client Secret Password. How to get the information,You can refer to the file(AFS-12構築手順_200324.xlsx)

app.get('/', function (req, res) {
  res.redirect('login');
});

app.get('/', function (req, res) {
  res.redirect('/login');
});

app.get('/login', function (req, res) {
  console.log(req.cookies);

  res.cookie('acookie', 'this is a cookie');

  res.send('\
<head>\
  <title>test</title>\
</head>\
<body>\
  <a href="./auth">Login</a>\
</body>\
    ');
});

// Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD.
// There they will authenticate and give their consent to allow this app access to
// some resource they own.
app.get('/auth', function (req, res) {
  crypto.randomBytes(48, function (ex, buf) {
    var token = buf.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

    res.cookie('authstate', token);

    res.redirect('/getDeviceCode');
  });
});

app.get('/getDeviceCode', function (req, res) {
  authenticationContext.acquireUserCode(resource, sampleParameters.clientId, 'es-mx', function (err, response) {
    var message = '';
    if (err) {
      message = 'error: ' + err.message + '\n';
      message += 'response: ' + JSON.stringify(response);
      res.send(message);
    } else {
      console.log(response);
      res.cookie('userCodeInfo', response);
      res.send(response.message + '\
      <head>\
        <title>test</title>\
      </head>\
      <body>\
        <a href="./getAuthToken">toDo</a>\
      </body>\
          ');
    }
  });
});

app.get('/getAuthToken', function (req, res) {
  console.log(req.cookies.userCodeInfo);
  var message = '';
  authenticationContext.acquireTokenWithDeviceCode(resource, sampleParameters.clientId, req.cookies.userCodeInfo, function (err, tokenResponse) {
    if (err) {
      console.log('error happens when acquiring token with device code');
      message = 'error: ' + err.message + '\n';
      message += 'response: ' + JSON.stringify(req.cookies.userCodeInfo);
      res.send(message);
    }
    else {
      console.log('refreshResponse: ' + JSON.stringify(tokenResponse));
      res.clearCookie('userCodeInfo');
      authenticationContext.acquireTokenWithClientCredentials(
        'https://graph.microsoft.com',
        sampleParameters.clientId,
        sampleParameters.clientSecret,
        function (err, tokenResponse) {
          if (err) {
            console.log('well that didn\'t work: ' + err.stack);
          } else {
            if (tokenResponse.accessToken && tokenResponse.accessToken.length > 0) {
              message += 'accessToken: ' + tokenResponse.accessToken;
              res.send(message);
            }
          }
        });
    }
  });
});

app.listen(3000);
console.log('listening on 3000');
