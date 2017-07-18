const http = require('http');
const fs = require('fs');
const querystring = require('querystring');

var elementListArr = [];
var validFileNames = ['/hydrogen.html', '/helium.html', '/', '/index.html', , ' ', '/css/styles.css'];

fs.readdir('./public/', (err, files) => {
  if (err){
    console.log('Directory look up error');
  } else {

    var filesToIgnore = ['404.html', '.keep', '.DS_Store', 'css', 'index.html'];

    files.forEach((fileName) => {
      if (filesToIgnore.indexOf(fileName) === -1 ){
        if (fileName.indexOf('.') !== -1){
          var elName = fileName.substring(0, fileName.indexOf('.'));
          elementListArr.push(elName);
          // console.log('pushing everything before the dot', elName);
        } else {
          elementListArr.push(fileName);
          // console.log('pushing the entire name', fileName);
        }
      }
    });

    const server = http.createServer(requestHandler);
    server.listen(8080);
  }
});

function requestHandler (request, response){
  console.log('Got a request - ', request.method);

  console.log('starting list of element files', elementListArr);

  if (request.method === 'GET'){

    if (validFileNames.indexOf(request.url) != -1){
      response.writeHead(200);
      if (request.url === '/' || request.url === ' '){
        request.url = '/index.html';
      }
      streamFileContents(request.url, response);

    } else {
      response.statusCode = 404;
      response.writeHead(404);
      streamFileContents('/404.html', response);
    }
  } else {
    response.writeHead(200);
  }

  var body = [];

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    body = Buffer.concat(body).toString();
    console.log('this is the console log from END');
    console.log(body);

    if ((request.method === 'POST' && request.url === '/elements') || (request.method === 'PUT' && validFileNames.indexOf(request.url) !== -1)){

      var parsedObj = querystring.parse(body);

      var requiredFields = ['elementName', 'elementSymbol', 'elementAtomicNumber', 'elementDescription'];

      if (requiredFields.every(field => field in parsedObj && parsedObj[field] !== '')) {
        createNewElementFile(request, response, parsedObj);
      } else {
        console.log('error - not providing all of the required fields');
        response.writeHead(500, {'content-Type': 'application/JSON'});
        response.write(JSON.stringify({'error': 'not all of the required fields were provided'}));
        response.end();
      }
    }

    if (request.method === 'PUT' && validFileNames.indexOf(request.url) === -1){
      response.writeHead(500, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'error': 'resource does not exist'}));
      console.log('error - trying to modify a non-existing file');
      response.end();
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
}


function streamFileContents(url, response){

  fs.readFile(('./public/' + url), function read(err, data) {
      if (err) {
        console.log('errrrrrroooorrrr');
        response.write('HTTP/1.1 500 ERROR');
      } else {
        response.write(data.toString());
        response.end();
      }
  });
}

function createNewElementFile (request, response, elementObj){
  var elementFilePath = './public/' + elementObj.elementName.toLowerCase() + '.html';

  var elementStringTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements - ${elementObj.elementName}</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>${elementObj.elementName}</h1>
  <h2>${elementObj.elementSymbol}</h2>
  <h3>Atomic number ${elementObj.elementAtomicNumber}</h3>
  <p>${elementObj.elementDescription}</p>
  <p><a href="/">back</a></p>
</body>
</html>`;

  if (request.method === 'POST'){
    validFileNames.push('/'+elementObj.elementName.toLowerCase()+'.html');
    elementListArr.push(elementObj.elementName.toLowerCase());
    console.log('now the element array looks like this');
    console.log(elementListArr);
  }

  var elementsListStr = '';
  elementListArr.forEach((element, index, array,) => {
    var elementTitle = element.charAt(0).toUpperCase() + element.substring(1);
    elementsListStr += `
      <li>
        <a href="/${element}.html">${elementTitle}</a>
      </li>`
    ;
  });

  fs.writeFile(elementFilePath, elementStringTemplate, (err) => {
    if (err) {
      response.writeHead(500, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'success': false}));
      console.log(err);
      response.end();
    } else {
      console.log('The file has been saved.');
      modifyIndexFile (request, response, elementsListStr);
    }
  });
}

function modifyIndexFile (request, response, elementListStr){

  var indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Elements</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <h1>The Elements</h1>
  <h2>These are all the known elements.</h2>
  <h3>These are ${elementListArr.length}</h3>
  <ol> ${elementListStr}
  </ol>
</body>
</html>`

  fs.writeFile('./public/index.html', indexTemplate, (err) => {
    if (err){
      response.writeHead(500, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'success': false}));
      console.log(err);
      response.end();
    } else {
      response.writeHead(200, {'content-Type': 'application/JSON'});
      response.write(JSON.stringify({'success': true}));
    }
    response.end();
  });
}