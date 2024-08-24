<template>
  <div>
    <div style="overflow-x: auto">
      <b-table
        id="recording_table"
        :items="info"
        :fields="recording_fields"
        :current-page="recording_page"
        :per-page="recording_page_size"
        small
        hover
      >
        <template #cell(date)="data">
          {{ data.value }}
        </template>

        <template #cell(data)="data">
          <audio controls="controls" autobuffer="autobuffer">
            <source :src="data.item.data" />
          </audio>
        </template>
      </b-table>
    </div>
    <b-pagination
      striped
      hover
      fixed
      responsive
      stacked
      v-model="recording_page"
      :total-rows="Math.ceil(info.length / recording_page_size)"
      :per-page="recording_page_size"
      aria-controls="recording_table"
    ></b-pagination>
  </div>
</template>

<script>
import { convertToCurrentTimeZone } from "./common.js";
import { get_field } from "./utils.js";
export default {
  name: "DataRecording",
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      info: [],
      // bot recording
      recording_page: 1,
      recording_page_size: 20,
      recording_fields: [
        {
          key: "date",
          label: "日期",
        },
        {
          key: "data",
          label: "数据",
        },
      ],
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      get_field(this.id, "recording")
        .then((response) => {
          this.info = response.map((item) => {
            item.data = `data:audio/wav;base64,${item.data}`;
            item.date = convertToCurrentTimeZone(new Date(item.date));
            return item;
          });
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
