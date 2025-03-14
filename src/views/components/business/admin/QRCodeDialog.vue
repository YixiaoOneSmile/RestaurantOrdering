<template>
  <el-dialog
    :title="$t('table.qrCode')"
    :visible.sync="localVisible"
    width="300px"
  >
    <div class="qr-code-content">
      <div v-if="table">
        <div class="qr-code-table">
          {{ $t('table.numberFormat', { number: table.number }) }}
        </div>
        <div class="qr-code-image">
          <qrcode
            :value="qrCodeUrl"
            :options="{ width: 200 }"
          ></qrcode>
        </div>
        <div class="qr-code-tip">
          {{ $t('table.scanToOrder') }}
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import QRCode from 'qrcode.vue'

export default {
  name: 'QRCodeDialog',
  components: {
    qrcode: QRCode
  },
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    table: {
      type: Object,
      default: null
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
    },
    qrCodeUrl() {
      if (!this.table) return ''
      const baseUrl = process.env.VUE_APP_ORDER_URL || window.location.origin
      return `${baseUrl}/table/${this.table.id}`
    }
  }
}
</script>

<style scoped>
.qr-code-content {
  text-align: center;
}

.qr-code-table {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.qr-code-image {
  width: 200px;
  height: 200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
}

.qr-code-tip {
  margin-top: 20px;
  color: #666;
}
</style>