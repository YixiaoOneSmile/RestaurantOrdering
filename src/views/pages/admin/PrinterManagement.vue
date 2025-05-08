<template>
  <div class="printer-management">
    <div class="page-header">
      <h2>{{ $t('menu.printers') }}</h2>
      <div>
        <el-button type="primary" @click="configPrinter">
          {{ $t('printer.configPrinter') }}
        </el-button>
      </div>
    </div>

    <div class="search-container">
      <el-form :inline="true" class="form-inline">
        <el-form-item :label="$t('printer.name')">
          <el-input v-model="searchName" :placeholder="$t('printer.namePlaceholder')"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">{{ $t('common.search') }}</el-button>
          <el-button @click="reset">{{ $t('common.reset') }}</el-button>
          <el-button type="primary" @click="showAddDialog">{{ $t('printer.add') }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="printers" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" :label="$t('printer.name')"></el-table-column>
      <el-table-column prop="terminal" :label="$t('printer.terminal')"></el-table-column>
      <el-table-column prop="key" :label="$t('printer.key')"></el-table-column>
      <el-table-column prop="createdAt" :label="$t('common.createTime')" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.action')" width="150" align="center">
        <template #default="{ row }">
          <el-button type="text" @click="editPrinter(row)">{{ $t('common.edit') }}</el-button>
          <el-button type="text" class="danger" @click="deletePrinter(row)">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      class="pagination"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50]"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    ></el-pagination>

    <!-- 添加/编辑打印机弹窗 -->
    <el-dialog :title="editingPrinter ? $t('printer.edit') : $t('printer.add')" :visible.sync="dialogVisible" width="500px">
      <el-form :model="printerForm" ref="printerForm" :rules="rules" label-width="120px">
        <el-form-item :label="$t('printer.name')" prop="name">
          <el-input v-model="printerForm.name"></el-input>
        </el-form-item>
        <el-form-item :label="$t('printer.terminal')" prop="terminal">
          <el-input v-model="printerForm.terminal"></el-input>
        </el-form-item>
        <el-form-item :label="$t('printer.key')" prop="key">
          <el-input v-model="printerForm.key"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="savePrinter" :loading="saving">{{ $t('common.confirm') }}</el-button>
      </span>
    </el-dialog>

    <!-- 打印机配置弹窗 -->
    <el-dialog :title="$t('printer.config')" :visible.sync="configVisible" width="600px">
      <div class="config-content">
        <el-form :model="configForm" ref="configForm" label-width="120px">
          <el-form-item :label="$t('printer.printOrder')" prop="printOrder">
            <el-switch v-model="configForm.printOrder"></el-switch>
          </el-form-item>
          <el-form-item :label="$t('printer.printReceipt')" prop="printReceipt">
            <el-switch v-model="configForm.printReceipt"></el-switch>
          </el-form-item>
          <el-form-item :label="$t('printer.defaultPrinter')" prop="defaultPrinter">
            <el-select v-model="configForm.defaultPrinter">
              <el-option 
                v-for="printer in printers" 
                :key="printer.id" 
                :label="printer.name" 
                :value="printer.id">
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer">
        <el-button @click="configVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveConfig" :loading="configSaving">{{ $t('common.confirm') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import { formatTime } from "@/utils/helpers/time";

export default {
  name: "PrinterManagement",
  data() {
    return {
      printers: [],
      loading: false,
      saving: false,
      configSaving: false,
      dialogVisible: false,
      configVisible: false,
      searchName: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      editingPrinter: null,
      printerForm: {
        name: '',
        terminal: '',
        key: ''
      },
      configForm: {
        printOrder: true,
        printReceipt: true,
        defaultPrinter: null
      },
      rules: {
        name: [{ required: true, message: this.$t('printer.nameRequired'), trigger: 'blur' }],
        terminal: [{ required: true, message: this.$t('printer.terminalRequired'), trigger: 'blur' }],
        key: [{ required: true, message: this.$t('printer.keyRequired'), trigger: 'blur' }]
      }
    };
  },
  created() {
    this.loadPrinters();
    this.loadConfig();
  },
  methods: {
    formatTime,
    
    async loadPrinters() {
      this.loading = true;
      try {
        const params = {
          page: this.currentPage,
          size: this.pageSize,
          name: this.searchName || undefined
        };
        const res = await request.get('/api/admin/printers', { params });
        this.printers = res.data || [];
        this.total = res.total || 0;
      } catch (error) {
        this.$message.error(this.$t('printer.loadFailed'));
      } finally {
        this.loading = false;
      }
    },
    
    async loadConfig() {
      try {
        const res = await request.get('/api/admin/printer-config');
        if (res.data) {
          this.configForm = res.data;
        }
      } catch (error) {
        console.error('Failed to load printer config:', error);
      }
    },
    
    search() {
      this.currentPage = 1;
      this.loadPrinters();
    },
    
    reset() {
      this.searchName = '';
      this.currentPage = 1;
      this.loadPrinters();
    },
    
    handleSizeChange(size) {
      this.pageSize = size;
      this.loadPrinters();
    },
    
    handleCurrentChange(page) {
      this.currentPage = page;
      this.loadPrinters();
    },
    
    showAddDialog() {
      this.editingPrinter = null;
      this.printerForm = {
        name: '',
        terminal: '',
        key: ''
      };
      this.dialogVisible = true;
    },
    
    editPrinter(printer) {
      this.editingPrinter = printer;
      this.printerForm = { ...printer };
      this.dialogVisible = true;
    },
    
    async savePrinter() {
      try {
        await this.$refs.printerForm.validate();
      } catch (error) {
        return;
      }
      
      this.saving = true;
      try {
        if (this.editingPrinter) {
          await request.put(`/api/admin/printers/${this.editingPrinter.id}`, this.printerForm);
          this.$message.success(this.$t('printer.updateSuccess'));
        } else {
          await request.post('/api/admin/printers', this.printerForm);
          this.$message.success(this.$t('printer.addSuccess'));
        }
        this.dialogVisible = false;
        this.loadPrinters();
      } catch (error) {
        this.$message.error(this.editingPrinter ? this.$t('printer.updateFailed') : this.$t('printer.addFailed'));
      } finally {
        this.saving = false;
      }
    },
    
    async deletePrinter(printer) {
      try {
        await this.$confirm(this.$t('printer.deleteConfirm'), this.$t('common.tip'), {
          type: 'warning'
        });
      } catch (error) {
        return;
      }
      
      try {
        await request.delete(`/api/admin/printers/${printer.id}`);
        this.$message.success(this.$t('printer.deleteSuccess'));
        this.loadPrinters();
      } catch (error) {
        this.$message.error(this.$t('printer.deleteFailed'));
      }
    },
    
    configPrinter() {
      this.configVisible = true;
    },
    
    async saveConfig() {
      this.configSaving = true;
      try {
        await request.post('/api/admin/printer-config', this.configForm);
        this.$message.success(this.$t('printer.configSuccess'));
        this.configVisible = false;
      } catch (error) {
        this.$message.error(this.$t('printer.configFailed'));
      } finally {
        this.configSaving = false;
      }
    }
  }
};
</script>

<style scoped>
.printer-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.form-inline {
  display: flex;
  align-items: center;
}

.danger {
  color: #F56C6C;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.config-content {
  padding: 10px 20px;
}
</style>