import { BootstrapVue, IconsPlugin } from "bootstrap-vue";
import Vue from "vue";
import App from "./App.vue";

import "bootstrap-vue/dist/bootstrap-vue.css";
import "bootstrap/dist/css/bootstrap.css";

// Install BootstrapVue
Vue.use(BootstrapVue);

// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

Vue.use(require("vue-moment"));

import VueToastr from "vue-toastr";
Vue.use(VueToastr, {
  escapeHtml: true,
  progressBar: true,
});

import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(fas);
library.add(fab);

Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.config.productionTip = false;

import BootstrapVueTreeview from "bootstrap-vue-treeview";
Vue.use(BootstrapVueTreeview);

new Vue({
  render: (h) => h(App),
}).$mount("#app");
