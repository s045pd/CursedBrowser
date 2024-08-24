<template>
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
</template>

<script>
import { download_ca } from "@/components/utils.js";
export default {
  name: "DownloadCA",
  methods: {
    download_ca() {
      download_ca();
    },
  },
};
</script>
