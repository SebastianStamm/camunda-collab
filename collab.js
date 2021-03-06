const lodash = document.createElement("script");
lodash.setAttribute("type", "application/javascript");
lodash.setAttribute("src", "/camunda/app/cockpit/scripts/lodash.min.js");

document.head.appendChild(lodash);

document.body.style.overflow = "hidden";

const ws = new WebSocket("ws://" + location.hostname);

let sendEvents = true;
ws.addEventListener("message", ({ data }) => {
  const { a, d, u, n, t, e } = JSON.parse(data);

  switch (a) {
    case "m": {
      const cursor = createOrFindCursorFor(u, n);
      cursor.style.left = d[0] + "px";
      cursor.style.top = d[1] + "px";

      sendEvents = false;
      const element = document.querySelector(t);
      if (element) {
        element.dispatchEvent(
          new MouseEvent("mousemove", {
            bubbles: true,
            cancelable: true,
            view: window,
            ...e,
          })
        );
      }
      sendEvents = true;
      break;
    }
    case "c": {
      sendEvents = false;
      document.querySelector(d)?.click?.();
      sendEvents = true;
      break;
    }
    case "i": {
      sendEvents = false;
      const element = document.querySelector(d.t);
      if (element) {
        element.value = d.v;
        element.dispatchEvent(new Event("input"));
      }
      sendEvents = true;
      break;
    }
    case "md": {
      sendEvents = false;
      const element = document.querySelector(d);
      if (element) {
        element.dispatchEvent(
          new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
            view: window,
            ...e,
          })
        );
      }
      sendEvents = true;
      break;
    }
    case "mu": {
      sendEvents = false;
      const element = document.querySelector(d);
      if (element) {
        element.dispatchEvent(
          new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: true,
            view: window,
            ...e,
          })
        );
      }
      sendEvents = true;
      break;
    }
    case "d": {
      const cursorToDelete = createOrFindCursorFor(u);
      cursorToDelete.parentNode.removeChild(cursorToDelete);
      break;
    }
    case "r": {
      document.body.removeEventListener("click", blocker, true);
      document.body.removeEventListener("mousedown", blocker, true);
      document.body.removeEventListener("keydown", blocker, true);
      document.body.removeEventListener("mouseup", blocker, true);
      document.body.removeEventListener("input", blocker, true);
      sendEvents = false;
      document.querySelector(".form-signin button").click();
      sendEvents = true;
      document.body.removeChild(document.querySelector("#screenBlock"));
      break;
    }
  }
});

ws.addEventListener("open", () => {
  const randomName = getRandomName();
  const name =
    prompt(
      "This is a Camunda Installation with Collaboration features! Please enter your name:"
    ) || randomName;

  ws.send(JSON.stringify({ a: "n", d: name }));

  const int = setInterval(() => {
    if (typeof _ !== "undefined") {
      clearInterval(int);
      setup();
    }
  }, 200);
});

let cursorVisible = !localStorage.getItem("isPresenter");

function setup() {
  const sendMouseMove = _.throttle((evt) => {
    ws.send(
      JSON.stringify({
        a: "m",
        d: [evt.pageX, evt.pageY],
        t: getSelectorForElement(evt.target),
        e: {
          clientX: evt.clientX,
          clientY: evt.clientY,
          offsetX: evt.offsetX,
          offsetY: evt.offsetY,
        },
      })
    );
  }, 33);

  document.body.addEventListener(
    "mousemove",
    ({ pageX, pageY, target, clientX, clientY, offsetX, offsetY }) => {
      if (sendEvents) {
        sendMouseMove({
          pageX,
          pageY,
          target,
          clientX,
          clientY,
          offsetX,
          offsetY,
        });
      }
    },
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
    "mousedown",
    (evt) => {
      if (sendEvents) {
        ws.send(
          JSON.stringify({
            a: "md",
            d: getSelectorForElement(evt.target),
            e: {
              clientX: evt.clientX,
              clientY: evt.clientY,
              offsetX: evt.offsetX,
              offsetY: evt.offsetY,
            },
          })
        );
      }
    },
    true
  );

  document.body.addEventListener(
    "mouseup",
    (evt) => {
      if (sendEvents) {
        ws.send(
          JSON.stringify({
            a: "mu",
            d: getSelectorForElement(evt.target),
            e: {
              clientX: evt.clientX,
              clientY: evt.clientY,
              offsetX: evt.offsetX,
              offsetY: evt.offsetY,
            },
          })
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

  if (localStorage.getItem("isPresenter")) {
    document.body.classList.add("presenter");
    document.body.addEventListener(
      "keydown",
      ({ key }) => {
        if (key === "F7") {
          cursorVisible = true;
          document.querySelectorAll(".hack-cursor").forEach((element) => {
            element.style.display = "block";
          });
        }
        if (key === "F8") {
          // remove screenblocker and start chaos
          ws.send(JSON.stringify({ a: "r" }));
          sendEvents = false;
          document.querySelector(".form-signin button").click();
          sendEvents = true;
        }
      },
      true
    );
  }
}

const cursors = {};
function createOrFindCursorFor(user, name = "Anonymous") {
  if (cursors[user]) {
    cursors[user].querySelector("div").textContent = name;
    return cursors[user];
  }

  const newCursor = document.createElement("div");
  newCursor.style.position = "absolute";
  newCursor.style.zIndex = "9999999";
  newCursor.style.pointerEvents = "none";
  newCursor.classList.add("hack-cursor");
  if (!cursorVisible) {
    newCursor.style.display = "none";
  }

  newCursor.innerHTML =
    '<div style="background-color: rgba(200,200,255,.6); padding: 2px 8px; font-size: 11px; position: absolute; top: 10px; left: 5px; color: #333; white-space: nowrap;">' +
    name +
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

function getRandomName() {
  return "Anonymous";
}

const blocker = function (evt) {
  evt.stopPropagation();
  evt.stopImmediatePropagation();
  evt.preventDefault();
};

if (!localStorage.getItem("isPresenter")) {
  document.body.addEventListener("click", blocker, true);
  document.body.addEventListener("mousedown", blocker, true);
  document.body.addEventListener("mouseup", blocker, true);
  document.body.addEventListener("keydown", blocker, true);
  document.body.addEventListener("input", blocker, true);

  const screen = document.createElement("div");
  screen.setAttribute("id", "screenBlock");
  screen.style.position = "absolute";
  screen.style.zIndex = "9999998";
  screen.style.top = "0";
  screen.style.left = "0";
  screen.style.bottom = "0";
  screen.style.right = "0";

  document.body.appendChild(screen);
}
