var http = require("http"),
  httpProxy = require("http-proxy");
const WebSocket = require("ws");
//
// Create your proxy server and set the target in the options.
//
var proxy = httpProxy.createProxyServer({
  target: "http://localhost:8080",
  selfHandleResponse: true,
});
proxy.on("proxyRes", function (proxyRes, req, res) {
  for (key in proxyRes.headers) {
    res.setHeader(key, proxyRes.headers[key]);
  }
  proxyRes.pipe(res);
  // proxyRes.on("end", () => {
  //   proxyRes.end();
  //   console.log("end");
  //   res.end();
  // });
  // let body = [];
  // proxyRes.on("data", function (chunk) {
  //   body.push(chunk);
  // });
  // proxyRes.on("end", function () {
  //   body = Buffer.concat(body).toString();
  //   // console.log("res from proxied server:", body);
  //   res.end("my response to cli");
  // });
});

const cacheTimeout = 3000;
const cache = {};

var server = http.createServer(function (req, res) {
  // console.log(req.method, req.url);

  // const deepResponse = new http.ServerResponse(req);
  proxy.web(req, res);
});

server.listen(8100);

const wss = new WebSocket.Server({ port: 8101 });

const connections = [];

wss.on("connection", function connection(ws) {
  const id = Math.random().toString(32).substr(2);
  let name = "--unknown--";
  connections.push({ ws });

  ws.on("close", function close() {
    connections.forEach((connection) => {
      if (connection.ws !== ws) {
        connection.ws.send(JSON.stringify({ a: "d", u: id }));
      }
    });
    connections.forEach((connection) => {
      if (connection.ws === ws) {
        connections.splice(connections.indexOf(connection), 1);
      }
    });
  });

  ws.on("message", function incoming(message) {
    const outgoing = JSON.parse(message);
    if (outgoing.a === "n") {
      name = outgoing.d;
    }
    outgoing.u = id;
    outgoing.n = name;
    connections.forEach((connection) => {
      if (connection.ws !== ws) {
        connection.ws.send(JSON.stringify(outgoing));
      }
    });
  });
});
