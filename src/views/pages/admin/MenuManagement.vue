<template>
  <div class="menu-management">
    
    <div class="page-header">
      <h2>{{ $t("menu.dishes") }}</h2>
      <el-button type="primary" @click="showAddDialog">
        {{ $t("dishes.add") }}
      </el-button>
    </div>

    <MenuList
      :dishes="dishes"
      :loading="loading"
      :categories="categories"
      @edit-dish="editDish"
      @delete-dish="deleteDish"
    />

    <!-- 添加/编辑菜品弹窗 -->
    <el-dialog
      :title="editingDish ? '编辑菜品' : '添加菜品'"
      :visible.sync="dialogVisible"
      width="500px"
    >
      <el-form
        :model="dishForm"
        ref="dishForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="dishForm.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('dishes.price')" prop="price">
          <div class="price-input">
            <el-input-number
              v-model="dishForm.price"
              :precision="2"
              :step="0.1"
              style="width: 180px"
            ></el-input-number>
            <el-select
              v-model="dishForm.currency"
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
          <el-select v-model="dishForm.categoryId">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="图片" prop="image">
          <el-input v-model="dishForm.image" placeholder="图片URL"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveDish" :loading="saving"
          >确 定</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import MenuList from "@/views/components/business/admin/MenuList.vue";

export default {
  name: "MenuManagement",
  components: {
    MenuList,
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
    async saveDish() {
      this.$refs.dishForm.validate(async (valid) => {
        if (!valid) return;

        this.saving = true;
        try {
          if (this.editingDish) {
            await request.put(
              `/api/admin/dishes/${this.editingDish.id}`,
              this.dishForm
            );
            this.$message.success("修改成功");
          } else {
            await request.post("/api/admin/dishes", this.dishForm);
            this.$message.success("添加成功");
          }
          this.dialogVisible = false;
          this.loadDishes();
        } catch (error) {
          this.$message.error(this.editingDish ? "修改失败" : "添加失败");
        } finally {
          this.saving = false;
        }
      });
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
