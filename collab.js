define([], function () {
  const lodash = document.createElement("script");
  lodash.setAttribute("type", "application/javascript");
  lodash.setAttribute("src", "/camunda/app/cockpit/scripts/lodash.min.js");

  document.head.appendChild(lodash);

  const ws = new WebSocket("ws://localhost:8101");

  let sendEvents = true;
  ws.addEventListener("message", ({ data }) => {
    console.log("got something", data);
    const { a, d, u } = JSON.parse(data);

    switch (a) {
      case "m":
        const cursor = createOrFindCursorFor(u);
        cursor.style.left = d[0] + "px";
        cursor.style.top = d[1] + "px";
        break;
      case "c":
        sendEvents = false;
        document.querySelector(d).click();
        sendEvents = true;
        break;
      case "i":
        sendEvents = false;
        const element = document.querySelector(d.t);
        element.value = d.v;
        element.dispatchEvent(new Event("input"));
        sendEvents = true;
        break;
    }
  });

  ws.addEventListener("open", () => {
    const int = setInterval(() => {
      if (typeof _ !== "undefined") {
        clearInterval(int);
        setup();
      }
    }, 200);
  });

  function setup() {
    document.body.addEventListener(
      "mousemove",
      _.throttle(({ pageX, pageY }) => {
        ws.send(
          JSON.stringify({
            a: "m",
            d: [pageX, pageY],
          })
        );
      }, 33),
      true
    );

    document.body.addEventListener(
      "click",
      (evt) => {
        if (sendEvents) {
          ws.send(
            JSON.stringify({ a: "c", d: getSelectorForElement(evt.target) })
          );
        }
      },
      true
    );

    document.body.addEventListener(
      "input",
      (evt) => {
        if (sendEvents) {
          ws.send(
            JSON.stringify({
              a: "i",
              d: { t: getSelectorForElement(evt.target), v: evt.target.value },
            })
          );
        }
      },
      true
    );
  }
});

const cursors = {};
function createOrFindCursorFor(user) {
  if (cursors[user]) {
    return cursors[user];
  }

  const newCursor = document.createElement("div");
  newCursor.style.position = "absolute";
  newCursor.style.zIndex = "9999999";
  newCursor.style.pointerEvents = "none";

  newCursor.innerHTML =
    '<div style="background-color: rgba(200,200,255,.6); padding: 2px 8px; font-size: 11px; position: absolute; top: 10px; left: 5px; color: #333;">' +
    user +
    '</div><img style="position:absolute;" src="/camunda/app/cockpit/scripts/cursor.png" />';

  document.body.appendChild(newCursor);

  cursors[user] = newCursor;
  return newCursor;
}

function getSelectorForElement(elem) {
  let path;
  while (elem) {
    let subSelector = elem.localName;
    if (!subSelector) {
      break;
    }
    subSelector = subSelector.toLowerCase();

    const parent = elem.parentElement;

    if (parent) {
      const sameTagSiblings = parent.children;
      if (sameTagSiblings.length > 1) {
        let nameCount = 0;
        const index =
          [...sameTagSiblings].findIndex((child) => {
            if (elem.localName === child.localName) {
              nameCount++;
            }
            return child === elem;
          }) + 1;
        if (index > 1 && nameCount > 1) {
          subSelector += ":nth-child(" + index + ")";
        }
      }
    }

    path = subSelector + (path ? ">" + path : "");
    elem = parent;
  }
  return path;
}
