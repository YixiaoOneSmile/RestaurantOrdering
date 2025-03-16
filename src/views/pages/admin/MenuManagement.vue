<template>
  <div class="menu-management">

    <div class="page-header">
      <h2>{{ $t("menu.dishes") }}</h2>
      <el-button type="primary" @click="showAddDialog">
        {{ $t("dishes.add") }}
      </el-button>
    </div>

    <MenuList :dishes="dishes" :loading="loading" :categories="categories" @edit-dish="editDish"
      @delete-dish="deleteDish" />

    <MenuDishDialog :visible.sync="dialogVisible" :dish="editingDish" :categories="categories" :loading="saving"
      @save="saveDish" />

  </div>
</template>

<script>
import request from "@/utils/request";
import MenuList from "@/views/components/business/admin/MenuList.vue";
import MenuDishDialog from "@/views/components/business/admin/MenuDishDialog.vue";

export default {
  name: "MenuManagement",
  components: {
    MenuList,
    MenuDishDialog
  },
  data() {
    return {
      dishes: [],
      loading: false,
      dialogVisible: false,
      saving: false,
      editingDish: null,
      dishForm: {
        name: "",
        price: 0,
        currency: "CNY",
        categoryId: "",
        image: "",
      },
      categories: [
        { id: 1, name: "热菜" },
        { id: 2, name: "凉菜" },
        { id: 3, name: "主食" },
        { id: 4, name: "饮品" },
      ],
      rules: {
        name: [{ required: true, message: "请输入菜品名称", trigger: "blur" }],
        price: [{ required: true, message: "请输入价格", trigger: "blur" }],
        categoryId: [
          { required: true, message: "请选择分类", trigger: "change" },
        ],
        image: [{ required: true, message: "请输入图片URL", trigger: "blur" }],
      },
    };
  },
  created() {
    this.loadDishes();
  },
  methods: {

    async loadDishes() {
      this.loading = true;
      try {
        const res = await request.get("/api/admin/dishes");
        this.dishes = res.data;
      } catch (error) {
        this.$message.error("加载菜品失败");
      } finally {
        this.loading = false;
      }
    },
    getCategoryName(categoryId) {
      const category = this.categories.find((c) => c.id === categoryId);
      return category ? category.name : "未知分类";
    },
    showAddDialog() {
      this.editingDish = null;
      this.dishForm = {
        name: "",
        price: 0,
        categoryId: "",
        image: "",
      };
      this.dialogVisible = true;
    },
    editDish(dish) {
      this.editingDish = dish;
      this.dishForm = {
        ...dish,
        currency: dish.currency || "CNY",
      };
      this.dialogVisible = true;
    },
    async saveDish(formData) {
      this.saving = true;
      try {
        if (this.editingDish) {
          await request.put(`/api/admin/dishes/${this.editingDish.id}`, formData);
          this.$message.success(this.$t('dishes.updateSuccess'));
        } else {
          await request.post('/api/admin/dishes', formData);
          this.$message.success(this.$t('dishes.addSuccess'));
        }
        this.dialogVisible = false;
        this.loadDishes();
      } catch (error) {
        console.error('Save dish error:', error);
        this.$message.error(this.editingDish
          ? this.$t('dishes.updateFailed')
          : this.$t('dishes.addFailed'));
      } finally {
        this.saving = false;
      }
    },
    async deleteDish(dish) {
      try {
        await this.$confirm("确定要删除这个菜品吗？");
        await request.delete(`/api/admin/dishes/${dish.id}`);
        this.$message.success("删除成功");
        this.loadDishes();
      } catch (error) {
        if (error !== "cancel") {
          this.$message.error("删除失败");
        }
      }
    },
  },
};
</script>

<style scoped>
.menu-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.danger {
  color: #f56c6c;
}
</style>
