<template>
  <div>
    <b-input-group prepend="Bot Name" class="mt-3">
      <b-form-input v-model="name" autofocus></b-form-input>
    </b-input-group>

    <b-input-group prepend="Bot Switch" class="mt-3">
      <b-form-checkbox
        v-for="key in Object.keys(switch_config)"
        v-bind:key="key"
        v-model="switch_config[key]"
        >{{ key }}</b-form-checkbox
      >
    </b-input-group>

    <b-button variant="primary" v-on:click="update_bot_config">
      <font-awesome-icon :icon="['fas', 'edit']" class="icon alt mr-1 ml-1" />
      Update
    </b-button>
  </div>
</template>

<script>
import { api_request, get_field } from "./utils.js";
export default {
  name: "DataConfig",
  props: {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    refresh: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      switch_config: {},
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      get_field(this.id, "switch_config")
        .then((response) => {
          this.switch_config = response;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async update_bot_config() {
      await api_request(
        "PUT",
        "/bots",
        {},
        {
          bot_id: this.id,
          name: this.name,
          switch_config: this.switch_config,
        }
      );
      this.$toastr.s("Bot renamed successfully.");
      this.refresh();
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
