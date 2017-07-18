const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

// console.log(http);

const server = http.createServer(function(request, response){
  // console.log(request.method);

  //checking if url stipulates a valid file name
  var validFileNames = ['/hydrogen.html', '/helium.html', '/', '/index.html', '/', '/css/styles.css'];
  if (validFileNames.indexOf(request.url) != -1){
    response.writeHead(200);

    if (request.method === 'GET'){
      if (request.url === '/' || request.url === ' '){
        request.url = '/index.html';
      }
      streamFileContents(request.url, response);
    }

  } else {
    response.statusCode = 404;
    response.writeHead(404);
    streamFileContents('/404.html', response);
  }



  //if it's a GET request, we want to serve the contents of files
  //this means we gots to reads the contents of files first - prolly using fs.readFile, I'm guessing?!?!?
  //



  // response.write('<html>');
  // response.write('<body>');
  // response.write('<h1>Hi bitchezzz!</h1>');
  // response.write('</body>');
  // response.write('</html>');

  // console.log(request.method, request.url);

  var body = [];

  request.on('data', (chunk) => {
    body.push(chunk);
    // console.log('this is the console log from DATA');
    // console.log(body);
  })

  request.on('end', () => {
    body = Buffer.concat(body).toString();
    console.log('this is the console log from END');
    console.log(body);

    if (request.method === 'POST') {
      var parsedObj = querystring.parse(body);
      console.log('PARSED');
      console.log(parsedObj);
      createNewElementFile(response, parsedObj);
    }

  });

  request.on('error', (err) => {
    console.error(err);
    response.statusCode = 400;
    response.end();
  });

  response.on('error', (err) => {
    console.error(err);
  });
});

server.listen(8080);

server.on('connect', (req, cltSocket, head) => {
  console.log('picking up a connection');

  clientConnection.on('data', (input) =>{
    console.log(input.toString());
  })
});


  // var status = 200;

  // var validPathArr = ['/index.html', '/hydrogen.html', '/helium.html', '/css/styles.css'];
  // if (validPathArr.indexOf(path) === -1){
  //   if (path === '' || path === ' ' || path === '/'){
  //     path = '/index.html';
  //   } else {
  //     path = '/404.html';
  //     status = 404;
  //   }
  // }


function streamFileContents(url, response){

  fs.readFile(('./public/' + url), function read(err, data) {
      if (err) {
        console.log('errrrrrroooorrrr');
        // connection.write('HTTP/1.1 500 ERROR');
      } else {

        response.write(data);
        response.end();
      }
    // connection.end();
  });
}

// server.on('request', (request, response) => {
//   console.log('got a request');

//   console.log(request.url);
//   response.end();
// });

function createNewElementFile (response, elementObj){
  var filePath = './public/' + elementObj.elementName.toLowerCase() + '.html';
  console.log('FILEPATH', filePath);

  var stringTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${elementObj.elementName}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${elementObj.elementName}</h1>
  <h2>${elementObj.elementSymbol}</h2>
  <h3>${elementObj.elementAtomicNumber}</h3>
  <p>${elementObj.elementDescription}</p>
  <p><a href="/">back</a></p>
</body>
</html>`;

  fs.writeFile(filePath, stringTemplate, (err) => {
    if (err) {
      response.writeHead(500, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'success': false}));
      console.log(err);
    } else {
      console.log('The file has been saved.');
      response.writeHead(200, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'success': true}));
    }
    response.end();
  });
}

