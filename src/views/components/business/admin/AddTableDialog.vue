<template>
  <el-dialog :title="$t('table.addTable')" :visible.sync="localVisible" width="400px">
    <el-form :model="tableForm" ref="tableForm" :rules="rules" label-width="100px">
      <el-form-item :label="$t('table.number')" prop="number">
        <el-input-number 
          v-model="tableForm.number" 
          :min="1" 
          controls-position="right"
        ></el-input-number>
      </el-form-item>
      <el-form-item :label="$t('table.capacity')" prop="capacity">
        <el-input-number 
          v-model="tableForm.capacity" 
          :min="1" 
          :max="20" 
          controls-position="right"
        ></el-input-number>
      </el-form-item>
    </el-form>
    <span slot="footer">
      <el-button @click="handleCancel">
        {{ $t("common.cancel") }}
      </el-button>
      <el-button 
        type="primary" 
        @click="handleConfirm" 
        :loading="loading"
      >
        {{ $t("common.confirm") }}
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'AddTableDialog',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tableForm: {
        number: 1,
        capacity: 4
      },
      rules: {
        number: [
          { required: true, message: this.$t('table.numberRequired'), trigger: 'blur' }
        ],
        capacity: [
          { required: true, message: this.$t('table.capacityRequired'), trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    localVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },
  methods: {
    handleCancel() {
      this.resetForm()
      this.$emit('update:visible', false)
    },
    async handleConfirm() {
      try {
        await this.$refs.tableForm.validate()
        this.$emit('confirm', { ...this.tableForm })
      } catch (error) {
        return false
      }
    },
    resetForm() {
      this.$refs.tableForm?.resetFields()
      this.tableForm = {
        number: 1,
        capacity: 4
      }
    }
  }
}
</script>