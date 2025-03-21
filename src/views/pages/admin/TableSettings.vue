<template>
  <div class="table-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>{{ $t('menu.tableSettings') }}</h2>
      <el-button type="primary" @click="showAddDialog">
        {{ $t('table.addTable') }}
      </el-button>
    </div>
    <!-- 桌台列表 -->
    <el-table :data="tables" v-loading="loading">
      <!-- 桌号 -->
      <el-table-column prop="number" :label="$t('table.number')" width="120">
        <template #default="{ row }">
          {{ $t('table.numberFormat', { number: row.number }) }}
        </template>
      </el-table-column>
      <!-- 容纳人数 -->
      <el-table-column prop="capacity" :label="$t('table.capacity')" width="120">
        <template #default="{ row }">
          {{ row.capacity || 4 }}{{ $t('table.people') }}
        </template>
      </el-table-column>
      <!-- 状态 -->
      <el-table-column prop="status" :label="$t('table.status')" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ $t(`table.${row.status}`) }}
          </el-tag>
        </template>
      </el-table-column>
      <!-- 操作 -->
      <el-table-column :label="$t('table.operations')" width="350">
        <template #default="{ row }">
          <!-- 编辑 -->
          <el-button type="text" @click="editTable(row)" :disabled="row.status !== 'empty'">{{ $t('common.edit')
          }}</el-button>
          <!-- 删除 -->
          <el-button type="text" class="danger" @click="deleteTable(row)" :disabled="row.status !== 'empty'">{{
            $t('common.delete') }}</el-button>
          <!-- 查看点餐码 -->
          <el-button type="text" @click="showQRCode(row)">{{ $t('table.viewQRCode') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加/编辑桌台弹窗 -->
    <el-dialog :title="editingTable ? $t('table.editTable') : $t('table.addTable')" :visible.sync="dialogVisible"
      width="400px">
      <el-form :model="tableForm" ref="tableForm" :rules="rules" label-width="80px">
        <el-form-item :label="$t('table.number')" prop="number">
          <el-input-number v-model="tableForm.number" :min="1"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('table.capacity')" prop="capacity">
          <el-input-number v-model="tableForm.capacity" :min="1"></el-input-number>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveTable" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </span>
    </el-dialog>
    <!-- 点餐码弹窗 -->
    <el-dialog :title="$t('table.qrCode')" :visible.sync="qrCodeVisible" width="300px">
      <div class="qr-code-content">
        <div v-if="selectedTable">
          <div class="qr-code-table">
            {{ $t('table.numberFormat', { number: selectedTable.number }) }}
          </div>
          <div>
            <img :src="`${baseUrl}${selectedTable.qrCodeUrl}`" :alt="$t('table.qrCode')" class="qr-code" />
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'TableSettings',
  data() {
    return {
      tables: [],
      loading: false,
      dialogVisible: false,
      qrCodeVisible: false,
      saving: false,
      editingTable: null,
      selectedTable: null,
      tableForm: {
        number: 1,
        capacity: 4
      },
      rules: {
        number: [{ required: true, message: '请输入桌号', trigger: 'blur' }],
        capacity: [{ required: true, message: '请输入容纳人数', trigger: 'blur' }]
      },
      baseUrl: process.env.VUE_APP_URL,
    }
  },
  created() {
    this.loadTables()
  },
  methods: {
    async loadTables() {
      this.loading = true
      try {
        const res = await request.get('/api/admin/tables')
        this.tables = res.data
      } catch (error) {
        this.$message.error('加载桌台失败')
      } finally {
        this.loading = false
      }
    },
    getStatusType(status) {
      const typeMap = {
        'empty': 'success',
        'dining': 'danger',
        'ordering': 'warning'
      }
      return typeMap[status] || 'info'
    },
    getStatusText(status) {
      const textMap = {
        'empty': '空闲',
        'dining': '就餐中',
        'ordering': '点餐中'
      }
      return textMap[status] || '未知状态'
    },
    showAddDialog() {
      this.editingTable = null
      this.tableForm = {
        number: '',
        capacity: 4
      }
      this.dialogVisible = true
    },
    editTable(table) {
      this.editingTable = table
      this.tableForm = {
        number: table.number,
        capacity: table.capacity
      }
      this.dialogVisible = true
    },
    async saveTable() {
      if (this.saving) return

      try {
        await this.$refs.tableForm.validate()
      } catch (error) {
        return
      }

      this.saving = true
      try {
        if (this.editingTable) {
          await request.put(`/api/admin/tables/${this.editingTable.id}`, this.tableForm)
          this.$message.success('修改成功')
        } else {
          await request.post('/api/admin/tables', this.tableForm)
          this.$message.success('添加成功')
        }
        this.dialogVisible = false
        this.loadTables()
      } catch (error) {
        this.$message.error(this.editingTable ? '修改失败' : '添加失败')
      } finally {
        this.saving = false
      }
    },
    async deleteTable(table) {
      try {
        await this.$confirm('确认删除该桌台吗？', '提示', {
          type: 'warning'
        })
      } catch (error) {
        return
      }

      try {
        await request.delete(`/api/admin/tables/${table.id}`)
        this.$message.success('删除成功')
        this.loadTables()
      } catch (error) {
        this.$message.error('删除失败')
      }
    },
    showQRCode(table) {
      console.log("测试::::", this.baseUrl);
      this.selectedTable = table;
      this.qrCodeVisible = true;
      console.log("桌面测试::::", this.selectedTable);
    },
  }
}
</script>

<style scoped>
.table-settings {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.danger {
  color: #F56C6C;
}

.qr-code-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 280px;
}

.qr-code-table {
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  color: #303133;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  flex: 0 0 auto;
}

</style>