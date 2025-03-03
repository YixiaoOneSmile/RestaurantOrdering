<template>
  <el-dialog
    :title="editingDish ? '编辑菜品' : '添加菜品'"
    :visible.sync="dialogVisible"
    width="500px"
    :append-to-body="false"
  >
    <el-form
      :model="localDishForm"
      ref="dishForm"
      :rules="rules"
      label-width="100px"
    >
      <EditDishName v-model="localDishForm.name" />
      <el-form-item :label="$t('dishes.price')" prop="price">
        <div class="price-input">
          <el-input-number
            v-model="localDishForm.price"
            :precision="2"
            :step="0.1"
            style="width: 180px"
          ></el-input-number>
          <el-select
            v-model="localDishForm.currency"
            style="width: 120px; margin-left: 10px"
          >
            <el-option
              v-for="(label, value) in $t('dishes.currencies')"
              :key="value"
              :label="label"
              :value="value"
            ></el-option>
          </el-select>
        </div>
      </el-form-item>
      <el-form-item :label="$t('dishes.category')" prop="categoryId">
        <el-select v-model="localDishForm.categoryId">
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('dishes.image')" prop="image">
        <el-input
          v-model="localDishForm.image"
          placeholder="图片URL"
        ></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleCancel">取 消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving"
        >确 定</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
import EditDishName from "./EditDishName.vue";

export default {
  name: "EditDish",
  components: {
    EditDishName,
  },
  data() {
    return {
      // 使用本地副本 localDishForm 替换 dishForm 进行双向绑定
      localDishForm: { ...this.dishForm },
    };
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    dishForm: {
      type: Object,
      required: true,
    },
    editingDish: {
      type: Object,
      default: null,
    },
    categories: {
      type: Array,
      default: () => [],
    },
    rules: {
      type: Object,
      default: () => ({}),
    },
    saving: {
      type: Boolean,
      default: false,
    },
  },
  watch: {
    dishForm: {
      immediate: true,
      handler(newVal) {
        this.localDishForm = { ...newVal };
      },
    },
  },
  computed: {
    dialogVisible: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  methods: {
    handleCancel() {
      this.dialogVisible = false;
      this.$emit("cancel");
    },
    handleSave() {
      this.$refs.dishForm.validate((valid) => {
        if (valid) {
          this.$emit("save", this.localDishForm);
        }
      });
    },
  },
  
};
</script>

<style scoped>
.price-input {
  display: flex;
  align-items: center;
}
</style>
