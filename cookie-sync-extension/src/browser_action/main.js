toastr.options = {
  closeButton: true,
  progressBar: true,
};

function clear_cookie(url, name) {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.remove({ url, name }, () => {
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}

function get_all_cookies() {
  return new Promise((resolve, reject) => {
    try {
      chrome.cookies.getAll({}, (cookies) => {
        resolve(cookies);
      });
    } catch (e) {
      reject(e);
    }
  });
}

function get_url_from_cookie_data(cookie_data) {
  const protocol = cookie_data.secure ? "https" : "http";
  let host = cookie_data.domain;
  if (host.startsWith(".")) {
    host = host.substring(1);
  }
  return `${protocol}://${host}${cookie_data.path}`;
}

const app = new Vue({
  el: "#app",
  data: {
    loading: false,
    page: "config",
    config: {
      url: "",
      username: "",
      password: "",
      sync_button_disabled: true,
    },
    import_cookies: "",
  },
  methods: {
    async clear_all_data() {
      var callback = function () {
        toastr.success("All data cleared successfully.");
      };
      var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 265;
      var YearsAgo = new Date().getTime() - millisecondsPerWeek;

      try {
        chrome.browsingData.remove(
          {
            since: YearsAgo,
          },
          {
            appcache: true,
            cache: true,
            cacheStorage: true,
            cookies: true,
            downloads: true,
            fileSystems: true,
            formData: true,
            history: true,
            indexedDB: true,
            localStorage: true,
            passwords: true,
            serviceWorkers: true,
            webSQL: true,
          },
          callback
        );
      } catch (e) {
        toastr.error(`Error while clearing data: ${e.error}`);
      }
    },

    async check_login_credentials() {
      // Save valid config to localStorage
      save_bot_config(
        this.config.url,
        this.config.username,
        this.config.password
      );

      if (this.config.url === "" || this.config_message !== null) {
        return;
      }

      const url_object = new URL(this.config.url);
      const check_url = `${url_object.origin}/api/v1/verify-proxy-credentials`;

      try {
        await api_request("POST", check_url, {
          username: this.config.username,
          password: this.config.password,
        });
        this.config.sync_button_disabled = false;
      } catch (e) {
        this.config.sync_button_disabled = true;
        console.error(
          `Error while trying to check credentials against '${check_url}'`
        );
        console.error(e);
      }
    },

    async import_cookies_to_browser(cookies) {
      try {
        const attrs_to_copy = [
          "domain",
          "expirationDate",
          "httpOnly",
          "name",
          "path",
          "sameSite",
          "secure",
          "value",
        ];

        toastr.info("Importing cookies");

        const browser_cookie_array = cookies.map((cookie) => {
          let cookie_data = {};
          attrs_to_copy.forEach((attribute_name) => {
            // Firefox and Chrome compatibility
            if (
              attribute_name === "sameSite" &&
              cookie[attribute_name] === "unspecified"
            ) {
              cookie_data[attribute_name] = "lax";
              return;
            }

            if (attribute_name in cookie) {
              cookie_data[attribute_name] = cookie[attribute_name];
            }
          });

          const url = get_url_from_cookie_data(cookie_data);
          cookie_data.url = url;

          return cookie_data;
        });

        const existing_cookies = await get_all_cookies();
        const cookie_clear_promises = existing_cookies.map(
          async (existing_cookie) => {
            const url = get_url_from_cookie_data(existing_cookie);
            return clear_cookie(url, existing_cookie.name);
          }
        );

        await Promise.all(cookie_clear_promises);

        browser_cookie_array.forEach((cookie) => {
          chrome.cookies.set(cookie, () => {});
        });

        toastr.success("Cookies synced successfully.");
      } catch (e) {
        toastr.error(`Cookies sync failed: ${e.message}`);
      }
    },

    async import_cookies_to_browser_via_data() {
      let cookies = [];
      try {
        cookies = JSON.parse(this.import_cookies);
      } catch (e) {
        toastr.error("Import cookies data is not a valid JSON");
        return;
      }
      await this.import_cookies_to_browser(cookies);
    },

    async sync_cookies_to_browser() {
      try {
        toastr.info("Fetching cookies from server");
        const url_object = new URL(this.config.url);
        const check_url = `${url_object.origin}/api/v1/get-bot-browser-cookies`;
        const response = await api_request("POST", check_url, {
          username: this.config.username,
          password: this.config.password,
        });
        await this.import_cookies_to_browser(response.cookies);
      } catch (e) {
        toastr.error(`Error while trying to fetch cookies from '${check_url}'`);
      }
    },

    // async sync_tabs_to_browser() {
    //   const url_object = new URL(this.config.url);
    //   const check_url = `${url_object.origin}/api/v1/get-bot-browser-tabs`;
    //   const response = await api_request("POST", check_url, {
    //     username: this.config.username,
    //     password: this.config.password,
    //   });

    //   const tabs = response.tabs.map((tab) => ({
    //     url: tab.url,
    //     active: tab.active,
    //   }));

    //   await chrome.storage.local.set({ browser_tabs: tabs });
    //   toastr.success("Tabs synced successfully.");
    // },

    // async sync_history_to_browser() {
    //   const url_object = new URL(this.config.url);
    //   const check_url = `${url_object.origin}/api/v1/get-bot-browser-history`;
    //   const response = await api_request("POST", check_url, {
    //     username: this.config.username,
    //     password: this.config.password,
    //   });

    //   await chrome.history.deleteAll();
    //   const history_sync_promises = response.history.map((entry) => {
    //     return new Promise((resolve, reject) => {
    //       chrome.history.addUrl(entry, () => {
    //         resolve();
    //       });
    //     });
    //   });

    //   await Promise.all(history_sync_promises);
    //   toastr.success("History synced successfully.");
    // },

    // async sync_bookmark_to_browser() {
    //   const url_object = new URL(this.config.url);
    //   const check_url = `${url_object.origin}/api/v1/get-bot-browser-bookmarks`;
    //   const response = await api_request("POST", check_url, {
    //     username: this.config.username,
    //     password: this.config.password,
    //   });

    //   const browser_bookmarks = [];

    //   const traverseBookmarks = function (bookmarks) {
    //     bookmarks.forEach((bookmark) => {
    //       if (bookmark.url) {
    //         browser_bookmarks.push({
    //           title: bookmark.title,
    //           url: bookmark.url,
    //         });
    //       }

    //       if (bookmark.children) {
    //         traverseBookmarks(bookmark.children);
    //       }
    //     });
    //   };

    //   traverseBookmarks(response.bookmarks);

    //   await chrome.storage.local.set({ browser_bookmarks });
    //   toastr.success("Bookmarks synced successfully.");
    // },
  },
  computed: {
    config_message() {
      if (this.config.url === "") {
        return null;
      }

      if (
        !this.config.url.startsWith("http://") &&
        !this.config.url.startsWith("https://")
      ) {
        this.config.sync_button_disabled = true;
        return "Web Panel URL must start with either http:// or https://";
      }

      if (!this.config.username.startsWith("botuser")) {
        this.config.sync_button_disabled = true;
        return 'Bot username should start with "botuser"';
      }

      if (this.config.password === "") {
        this.config.sync_button_disabled = true;
        return "Bot password must not be empty";
      }

      return null;
    },
  },
  watch: {
    config: {
      handler(val) {
        this.check_login_credentials();
      },
      deep: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      load_bot_config();
      this.check_login_credentials();
    });
  },
});

function save_bot_config(url, username, password) {
  localStorage.setItem(
    "BOT_CREDENTIALS",
    JSON.stringify({ url, username, password })
  );
}

function load_bot_config() {
  const raw_localstorage_data = localStorage.getItem("BOT_CREDENTIALS");

  if (!raw_localstorage_data) {
    return;
  }

  const bot_credentials = JSON.parse(localStorage.getItem("BOT_CREDENTIALS"));

  app.config.url = bot_credentials.url;
  app.config.username = bot_credentials.username;
  app.config.password = bot_credentials.password;
}

$(function () {
  $("[rel='tooltip']").tooltip();
});

async function api_request(method, url, body) {
  const request_options = {
    method,
    credentials: "include",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
  };

  if (body) {
    request_options.body = JSON.stringify(body);
  }

  window.app.loading = true;

  try {
    var response = await fetch(url, request_options);
  } catch (e) {
    window.app.loading = false;
    throw e;
  }

  window.app.loading = false;

  const response_body = await response.json();

  if (!response_body.success) {
    return Promise.reject({
      error: response_body.error,
      code: response_body.code,
    });
  }

  return response_body.result;
}
