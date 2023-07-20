import http from 'http';
import fs from "fs";
import path from "path";
import process from "process";
import url from "url";
import qs from "querystring";
import express from 'express';
import bodyParser from 'body-parser';

const hostname = '127.0.0.1';
const port = 3000;

const rootFileSystem = process.cwd();

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
  fileResponse(res, "PublicResources/html/Main.html");
});


function handleRequest(req, res) {
  console.log("GOT: " + req.method + " " + req.url);

  let baseURL = 'http://' + req.headers.host + '/';
  let url = new URL(req.url, baseURL);
  let searchParms = new URLSearchParams(url.search);
  let queryPath = decodeURIComponent(url.pathname);

  switch (req.method) {
    case "GET":
      console.log("GET");
      let pathElements = queryPath.split("/");
      console.log(pathElements);
      //USE "sp" from above to get query search parameters
      switch (pathElements[1]) {
        case "":
          fileResponse(res, "PublicResources/html/Main.html");
          break;
        case "Main.html":
        case "MagicItems.html":
        case "Spells.html":
        case "Creatures.html":
          let htmlPath = "PublicResources/html/";
          htmlPath += pathElements[1];
          fileResponse(res, htmlPath);
          break;

        case "JSItems.js":
          let JSPath = "PublicResources/JS/";
          JSPath += pathElements[1];
          console.log("\n" + JSPath);
          fileResponse(res, JSPath);
          break;
        default: //for anything else we assume it is a file to be served
          fileResponse(res, req.url);
          break;
      }
      break;

    case "POST": {
      console.log("POST");
      let pathElements = queryPath.split("/");
      console.log(pathElements[pathElements.length - 1]); //to be looked at /cg
      switch (pathElements[pathElements.length - 1]) {
        case "itemSearch":
          let object = JSON.parse(req);
          let object2 = JSON.parse(res);
          console.log(object);
          console.log("\n");
          console.log(object2);

          break;
        default:
          console.error("Resource doesn't exist");
          reportError(res, new Error(NoResourceError));
      }
    }
      break;
    default:
      console.log("Fault");
      break;

  }
}


function handlePOST(req, res) {
  console.log("POST");
  console.log(req.body);
}

function fileResponse(res, filename) {
  const sPath = securePath(filename);
  console.log("Reading:" + sPath);
  fs.readFile(sPath, (err, data) => {
    if (err) {
      console.error(err);
      errorResponse(res, 404, String(err));
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', guessMimeType(filename));
      res.write(data);
      res.end('\n');
    }
  })
}

//A helper function that converts filename suffix to the corresponding HTTP content type
//better alternative: use require('mmmagic') library
function guessMimeType(fileName) {
  const fileExtension = fileName.split('.').pop().toLowerCase();
  console.log(fileExtension);
  const ext2Mime = { //Aught to check with IANA spec
    "txt": "text/txt",
    "html": "text/html",
    "ico": "image/ico", // CHECK x-icon vs image/vnd.microsoft.icon
    "js": "text/javascript",
    "json": "application/json",
    "css": 'text/css',
    "png": 'image/png',
    "jpg": 'image/jpeg',
    "wav": 'audio/wav',
    "mp3": 'audio/mpeg',
    "svg": 'image/svg+xml',
    "pdf": 'application/pdf',
    "doc": 'application/msword',
    "docx": 'application/msword'
  };
  //incomplete
  return (ext2Mime[fileExtension] || "text/plain");
}

function errorResponse(res, code, reason) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'text/txt');
  res.write(reason);
  res.end("\n");
}

function securePath(userPath) {
  if (userPath.indexOf('\0') !== -1) {
    // could also test for illegal chars: if (!/^[a-z0-9]+$/.test(filename)) {return undefined;}
    return undefined;

  }
  userPath = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');

  let p = path.join(rootFileSystem, path.normalize(userPath));
  //console.log("The path is:"+p);
  return p;
}


app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
