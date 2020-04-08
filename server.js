var http = require("http"),
  httpProxy = require("http-proxy");
const WebSocket = require("ws");

const cacheTimeout = 2000;
const cache = {};

var proxy = httpProxy.createProxyServer({});
proxy.on("proxyRes", function (proxyRes, req, res) {
  // console.log(req.method, req.url);

  // cache[req.url] = cache[req.url] || {};
  // cache[req.url][req.method] = {
  //   headers: proxyRes.headers,
  //   content: null,
  // };

  for (key in proxyRes.headers) {
    res.setHeader(key, proxyRes.headers[key]);
  }

  // console.log("returning response");
  proxyRes.pipe(res);

  // let body = [];
  // proxyRes.on("data", function (chunk) {
  //   body.push(chunk);
  // });
  // proxyRes.on("end", function () {
  //   console.log(Buffer.concat(body).toString());
  //   // cache[req.url][req.method].content = Buffer.concat(body).toString();
  // });

  // setTimeout(() => {
  //   cache[req.url][req.method] = null;
  // }, cacheTimeout);
});

var server = http.createServer(function (req, res) {
  // if (cache[req.url] && cache[req.url][req.method]) {
  //   if (cache[req.url][req.method] === true && false) {
  //     const interval = setInterval(() => {
  //       if (typeof cache[req.url][req.method] === "object") {
  //         clearInterval(interval);
  //         for (key in cache[req.url][req.method].headers) {
  //           res.setHeader(key, cache[req.url][req.method].headers[key]);
  //         }
  //         res.end(cache[req.url][req.method].content);
  //       }
  //     }, 20);
  //   } else {
  //     console.log("got cached response");
  //     for (key in cache[req.url][req.method].headers) {
  //       console.log("setting response header", key);
  //       res.setHeader(key, cache[req.url][req.method].headers[key]);
  //     }
  //     res.end(cache[req.url][req.method].content);
  //   }
  // } else {
  //   if (!cache[req.url]) {
  //     cache[req.url] = {};
  //   }
  //   cache[req.url][req.method] = true;
  proxy.web(req, res, {
    target: "http://localhost:8080",
    selfHandleResponse: true,
  });
  // }
});

server.on("upgrade", function (req, socket, head) {
  proxy.ws(req, socket, head, { target: "ws://localhost:8101" });
});

server.listen(80);

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
