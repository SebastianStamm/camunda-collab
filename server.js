var http = require("http"),
  httpProxy = require("http-proxy");
const WebSocket = require("ws");
//
// Create your proxy server and set the target in the options.
//
var proxy = httpProxy.createProxyServer({});

var server = http.createServer(function (req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.
  proxy.web(req, res, { target: "http://localhost:8080" });
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
