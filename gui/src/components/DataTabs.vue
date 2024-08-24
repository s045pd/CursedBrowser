<template>
  <b-sidebar
    v-if="show"
    id="sidebar-tabs"
    title="Tabs"
    right
    shadow
    width="500"
  >
    <b-list-group>
      <b-list-group-item v-for="tab in info" v-bind:key="tab.id">
        <b-link target="_blank" :href="tab.url"> {{ tab.title }}</b-link>
      </b-list-group-item>
    </b-list-group>
  </b-sidebar>
</template>

<script>
import { get_field } from "./utils.js";
export default {
  name: "DataTabs",
  props: {
    id: {
      type: String,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      info: [],
    };
  },
  watch: {
    show() {
      if (this.show) {
        this.fetchData();
      }
    },
  },
  methods: {
    fetchData() {
      get_field(this.id, "tabs")
        .then((response) => {
          this.info = response;
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
