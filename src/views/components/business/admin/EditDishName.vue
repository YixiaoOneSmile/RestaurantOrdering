<template>
  <el-form-item :label="$t('dishes.name')" prop="name">
    <el-input v-model="inputValue" style="width: 200px"></el-input>
  </el-form-item>
</template>

<script>
export default {
  name: "DishNameInput",
  props: {
    value: {
      type: String,
      default: ""
    }
  },
  computed: {
    inputValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      }
    }
  }
};
</script>
