var http = require('http');

module.exports = {
    getAccessToken: async function(req) {
      return new Promise(resolve => {
        var result = JSON.parse(req.cookies.token);
        // Get the access token
        var accessToken = result.accessToken;
        var expiresOn = result.expiresOn;
    
        //获取当前时间
        const currentTime = new Date().toISOString();

        if (accessToken == "" || expiresOn < currentTime) {
          var postheaders = {  
            'Content-Type' : 'application/json; charset=UTF-8',  
            'Content-Length' : Buffer.byteLength(req.cookies.token, 'utf8')  
          };
          var optionsPost = {
            host: 'localhost',
            port: '5000',
            path: '/getTokenWithRefreshToken',
            method: 'POST',
            headers : postheaders 
          };

          var resPost = http.request(optionsPost, function (resPost) {
            resPost.on('data', function(result2) { 
              var data = JSON.parse(result2.toString()); 
              console.log(data);
              req.cookies.token = result2.toString();
              resolve(data.accessToken);
            });
          });

          resPost.on('error', function (e) {
            console.error(e);
          });

          resPost.write(req.cookies.token); 
          resPost.end();
        } else {
            resolve(accessToken);
        }
    });
  }
};
