var http = require("http"),
  httpProxy = require("http-proxy");
const WebSocket = require("ws");

const cacheTimeout = 2000;
const cache = {};

var proxy = httpProxy.createProxyServer({
  target: "http://localhost:8080",
  selfHandleResponse: true,
});
proxy.on("proxyRes", function (proxyRes, req, res) {
  console.log(req.method, req.url);

  cache[req.url] = cache[req.url] || {};
  cache[req.url][req.method] = {
    headers: proxyRes.headers,
    content: null,
  };

  for (key in proxyRes.headers) {
    res.setHeader(key, proxyRes.headers[key]);
  }

  proxyRes.pipe(res);

  let body = [];
  proxyRes.on("data", function (chunk) {
    body.push(chunk);
  });
  proxyRes.on("end", function () {
    cache[req.url][req.method].content = Buffer.concat(body).toString();
  });

  setTimeout(() => {
    cache[req.url][req.method] = null;
  }, cacheTimeout);
});

var server = http.createServer(function (req, res) {
  if (cache[req.url] && cache[req.url][req.method]) {
    if (cache[req.url][req.method] === true) {
      const interval = setInterval(() => {
        if (typeof cache[req.url][req.method] === "object") {
          clearInterval(interval);
          for (key in cache[req.url][req.method].headers) {
            res.setHeader(key, cache[req.url][req.method].headers[key]);
          }
          res.end(cache[req.url][req.method].content);
        }
      }, 20);
    } else {
      console.log("got cached response");
      for (key in cache[req.url][req.method].headers) {
        res.setHeader(key, cache[req.url][req.method].headers[key]);
      }
      res.end(cache[req.url][req.method].content);
    }
  } else {
    if (!cache[req.url]) {
      cache[req.url] = {};
    }
    cache[req.url][req.method] = true;
    proxy.web(req, res);
  }
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
