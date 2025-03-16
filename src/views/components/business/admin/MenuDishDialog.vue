<template>
  <el-dialog :title="editingDish ? $t('dishes.editDish') : $t('dishes.addDish')" :visible.sync="localVisible"
    width="500px">
    <el-form :model="form" ref="dishForm" :rules="rules" label-width="80px">
      <el-form-item :label="$t('dishes.nameEN')" prop="name">
        <el-input v-model="form.name" :placeholder="$t('dishes.nameENPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('dishes.nameCN')" prop="nameCN">
        <el-input v-model="form.nameCN" :placeholder="$t('dishes.nameCNPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('dishes.nameJP')" prop="nameJP">
        <el-input v-model="form.nameJP" :placeholder="$t('dishes.nameJPPlaceholder')"></el-input>
      </el-form-item>
      <el-form-item :label="$t('dishes.price')" prop="price">
        <div class="price-input">
          <el-input-number v-model="form.price" :precision="2" :step="0.1" style="width: 180px"></el-input-number>
          <el-select v-model="form.currency" style="width: 120px; margin-left: 10px">
            <el-option v-for="(label, value) in $t('dishes.currencies')" :key="value" :label="label"
              :value="value"></el-option>
          </el-select>
        </div>
      </el-form-item>
      <el-form-item :label="$t('dishes.category')" prop="categoryId">
        <el-select v-model="form.categoryId">
          <el-option v-for="category in categories" :key="category.id" :label="category.name"
            :value="category.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('dishes.image')" prop="image">
        <div class="image-upload-container">
          <el-input v-model="form.image" :placeholder="$t('dishes.imagePlaceholder')" :disabled="uploading"></el-input>
          <el-upload class="image-uploader" :action="`${baseUrl}/admin/upload`" :show-file-list="false"
            :on-success="handleUploadSuccess" :on-error="handleUploadError" :before-upload="beforeUpload"
            :headers="uploadHeaders" name="image">
            <el-button type="primary" :loading="uploading" size="mini" icon="el-icon-upload">
              {{ $t('dishes.uploadImage') }}
            </el-button>
          </el-upload>
        </div>
        <div class="image-preview" v-if="form.image">
          <img :src="previewImageUrl" class="preview-image" alt="Preview">
        </div>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleCancel">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">
        {{ $t('common.confirm') }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'MenuDishDialog',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    dish: {
      type: Object,
      default: null
    },
    categories: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        name: '',
        nameCN: '',
        nameJP: '',
        price: 0,
        currency: 'CNY',
        categoryId: '',
        image: ''
      },
      rules: {
        name: [{ required: true, message: this.$t('dishes.nameRequired'), trigger: 'blur' }],
        nameCN: [{ required: true, message: this.$t('dishes.nameRequiredCN'), trigger: 'blur' }],
        nameJP: [{ required: true, message: this.$t('dishes.nameRequiredJP'), trigger: 'blur' }],
        price: [{ required: true, message: this.$t('dishes.priceRequired'), trigger: 'blur' }],
        categoryId: [{ required: true, message: this.$t('dishes.categoryRequired'), trigger: 'change' }],
        image: [{ required: true, message: this.$t('dishes.imageRequired'), trigger: 'blur' }]
      },
      uploading: false,
      baseUrl: process.env.VUE_APP_API_URL || '',
      uploadHeaders: {}
    };
  },
  computed: {
    editingDish() {
      return !!this.dish;
    },
    localVisible: {
      get() {
        return this.visible;
      },
      set(val) {
        this.$emit('update:visible', val);
      }
    },
    previewImageUrl() {
      if (!this.form.image) return '';

      // 如果是完整URL，直接返回
      if (this.form.image.startsWith('http')) {
        return this.form.image;
      }

      // 如果是相对路径，拼接baseUrl
      const baseApiUrl = process.env.VUE_APP_URL;
      return `${baseApiUrl}${this.form.image}`;
    },
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm();
      }
    },
    dish: {
      handler() {
        this.initForm();
      },
      deep: true
    }
  },
  methods: {
    initForm() {
      if (this.dish) {
        this.form = {
          ...this.dish,
          nameCN: this.dish.nameCN || '',
          nameJP: this.dish.nameJP || '',
          currency: this.dish.currency || 'CNY'
        };
        this.imageUrl = this.dish.image;
      } else {
        this.form = {
          name: '',
          nameCN: '',
          nameJP: '',
          price: 0,
          currency: 'CNY',
          categoryId: '',
          image: ''
        };
        this.imageUrl = '';
      }
      this.$nextTick(() => {
        this.$refs.dishForm && this.$refs.dishForm.clearValidate();
      });
    },
    handleCancel() {
      this.localVisible = false;
    },
    handleSave() {
      if (this.$refs.dishForm) {
        this.$refs.dishForm.validate(valid => {
          if (valid) {
            this.$emit('save', { ...this.form });
          }
        });
      } else {
        console.warn('Form reference not found, submitting without validation');
        this.$emit('save', { ...this.form });
      }
    },
    beforeUpload(file) {
      const isImage = /image\/(jpeg|png|gif|jpg|webp)/.test(file.type);
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isImage) {
        this.$message.error(this.$t('dishes.onlyImageAllowed'));
        return false;
      }

      if (!isLt5M) {
        this.$message.error(this.$t('dishes.imageTooLarge'));
        return false;
      }

      this.uploading = true;
      return true;
    },
    handleUploadSuccess(res) {
      this.uploading = false;
      if (res.code === 0 && res.data) {
        const baseApiUrl = process.env.VUE_APP_URL 
        this.form.image = `${baseApiUrl}${res.data}`;
        this.$message.success(this.$t('dishes.uploadSuccess'));
      } else {
        this.$message.error(res.message || this.$t('dishes.uploadFailed'));
      }
    },
    handleUploadError(err) {
      this.uploading = false;
      console.error('Upload error:', err);
      this.$message.error(this.$t('dishes.uploadFailed'));
    }
  }
};
</script>

<style scoped>
.price-input {
  display: flex;
  align-items: center;
}
.image-upload-container {
  display: flex;
  align-items: center;
}

.image-uploader {
  margin-left: 10px;
}

.image-preview {
  margin-top: 10px;
  width: 100%;
  height: 180px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>