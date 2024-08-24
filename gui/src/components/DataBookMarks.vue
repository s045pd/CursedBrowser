<template>
  <b-tree-view
    :data="info"
    @nodeSelect="openNode"
    nodeLabelProp="text"
  ></b-tree-view>
</template>

<script>
import { get_field } from "./utils.js";
export default {
  name: "DataBookMarks",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      info: [],
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      get_field(this.id, "bookmarks").then((response) => {
        this.info = this.transformTreeData(response);
      });
    },
    transformTreeData(nodes) {
      return nodes.map((node) => {
        if (node.children) {
          node.children = this.transformTreeData(node.children);
        }
        return {
          ...node,
          text:
            node.url != undefined ? `${node.title}: ${node.url}` : node.title,
        };
      });
    },
    openNode(node) {
      if (node.selected && node.data.url) {
        window.open(node.data.url, "_blank");
      }
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here */
</style>
