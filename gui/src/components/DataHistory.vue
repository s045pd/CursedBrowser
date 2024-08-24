<template>
  <b-sidebar
    v-if="show"
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
        v-for="history in info.filter((item) => {
          const url = item.url ? item.url.toString().toLowerCase() : '';
          const title = item.title ? item.title.toString().toLowerCase() : '';
          const searchWord = history_search_word.toLowerCase();

          return url.includes(searchWord) || title.includes(searchWord);
        })"
        v-bind:key="history.id"
      >
        <p>
          {{ history.lastVisitTime | moment("YYYY-MM-DD hh:mm:ss") }}
        </p>
        <p>
          <span>
            <b-badge href="#" variant="primary">{{
              history.visitCount
            }}</b-badge></span
          >&nbsp;<b-link target="_blank" :href="history.url">{{
            history.title
          }}</b-link>
        </p>
      </b-list-group-item>
    </b-list-group>
  </b-sidebar>
</template>

<script>
import { get_field } from "./utils.js";
export default {
  name: "DataHistory",
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
      history_search_word: "",
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
      get_field(this.id, "history")
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

<style scoped>
/* Add component-specific styles here */
</style>
