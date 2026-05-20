<script setup>
// 账单列表页：筛选、分页、增删改、CSV 导入导出
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useBills } from '@/composables/useBills'
import { useCategoriesStore } from '@/stores/categories'
import { fetchAllBills, createBill } from '@/api/bills'
import BillFilter from '@/components/bill/BillFilter.vue'
import BillList from '@/components/bill/BillList.vue'
import BillForm from '@/components/bill/BillForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const { userId } = useAuth()
const categoriesStore = useCategoriesStore()
const {
  bills,
  loading,
  filters,
  pagination,
  fetchBills,
  removeBill,
  setPage,
  fetchCategories,
} = useBills()

const formVisible = ref(false)
const editData = ref(null)       // 编辑时传入已有数据，null 表示新增
const deleteTarget = ref(null)
const deleteVisible = ref(false)
const exporting = ref(false)
const importing = ref(false)
const fileInput = ref(null)

// 初始化：加载分类和账单列表
onMounted(async () => {
  if (!userId.value) return
  await fetchCategories()
  await fetchBills(userId.value)
})

// 筛选条件变化自动重新查询
watch(
  () => [filters.value.type, filters.value.categoryId, filters.value.startDate, filters.value.endDate, filters.value.minAmount, filters.value.maxAmount],
  () => {
    if (userId.value) {
      fetchBills(userId.value)
    }
  }
)

// --- CRUD 操作 ---

function handleAdd() {
  editData.value = null
  formVisible.value = true
}

function handleEdit(bill) {
  editData.value = bill
  formVisible.value = true
}

function handleDelete(bill) {
  deleteTarget.value = bill
  deleteVisible.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return

  try {
    await removeBill(deleteTarget.value.id)
    ElMessage.success('账单已删除')
    deleteVisible.value = false
    deleteTarget.value = null
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  }
}

function handleFormSubmit() {
  if (userId.value) {
    fetchBills(userId.value)
  }
}

function handlePageChange(page) {
  setPage(page)
  if (userId.value) {
    fetchBills(userId.value)
  }
}

// --- CSV 导入导出 ---

/** 构建分类名称 → ID 的映射表 */
function buildCategoryNameMap() {
  const map = {}
  categoriesStore.categories.forEach((c) => {
    map[c.name] = c.id
  })
  return map
}

/** 导出全部账单为 UTF-8 BOM CSV */
async function handleExport() {
  exporting.value = true
  try {
    const data = await fetchAllBills(userId.value)
    if (!data.length) {
      ElMessage.warning('没有可导出的账单')
      return
    }

    const rows = [['类型', '金额', '分类', '日期', '备注']]
    data.forEach((b) => {
      rows.push([
        b.type === 'expense' ? '支出' : '收入',
        b.amount,
        b.categories?.name || '未分类',
        b.bill_date,
        b.note || '',
      ])
    })

    const bom = '\uFEFF'
    const csv = bom + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `账单导出_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已导出 ${data.length} 条账单`)
  } catch (err) {
    ElMessage.error(err.message || '导出失败')
  } finally {
    exporting.value = false
  }
}

function handleImportClick() {
  fileInput.value?.click()
}

/** 解析 CSV 文件并逐行创建账单 */
async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) {
      ElMessage.warning('CSV 文件为空或格式不正确')
      return
    }

    const nameToId = buildCategoryNameMap()

    // 处理 CSV 转义逗号
    const parseRow = (line) => {
      const result = []
      let current = ''
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += ch
        }
      }
      result.push(current)
      return result
    }

    const header = parseRow(lines[0])
    const typeIdx = header.findIndex((h) => h === '类型')
    const amountIdx = header.findIndex((h) => h === '金额')
    const categoryIdx = header.findIndex((h) => h === '分类')
    const dateIdx = header.findIndex((h) => h === '日期')
    const noteIdx = header.findIndex((h) => h === '备注')

    if (typeIdx === -1 || amountIdx === -1 || categoryIdx === -1 || dateIdx === -1) {
      ElMessage.error('CSV 表头缺少必要列：类型、金额、分类、日期')
      return
    }

    let success = 0
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = parseRow(lines[i])
      const typeLabel = cols[typeIdx]?.trim()
      const amount = parseFloat(cols[amountIdx])
      const categoryName = cols[categoryIdx]?.trim()
      const date = cols[dateIdx]?.trim()
      const note = noteIdx !== -1 ? cols[noteIdx]?.trim() || '' : ''

      if (!typeLabel || isNaN(amount) || !categoryName || !date) {
        skipped++
        continue
      }

      const type = typeLabel === '支出' ? 'expense' : typeLabel === '收入' ? 'income' : null
      if (!type) { skipped++; continue }

      const categoryId = nameToId[categoryName]
      if (!categoryId) { skipped++; continue }

      await createBill({
        user_id: userId.value,
        type,
        amount,
        category_id: categoryId,
        bill_date: date,
        note,
      })
      success++
    }

    await fetchBills(userId.value)
    ElMessage.success(`导入完成：成功 ${success} 条${skipped > 0 ? `，跳过 ${skipped} 条` : ''}`)
  } catch (err) {
    ElMessage.error(err.message || '导入失败')
  } finally {
    importing.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">账单管理</h1>
        <p class="page-subtitle">管理你的所有收支记录</p>
      </div>
      <div class="header-actions">
        <el-button size="large" :loading="importing" @click="handleImportClick">
          <el-icon :size="16"><el-icon-upload></el-icon-upload></el-icon>
          导入
        </el-button>
        <el-button size="large" :loading="exporting" @click="handleExport">
          <el-icon :size="16"><el-icon-download></el-icon-download></el-icon>
          导出
        </el-button>
        <el-button type="primary" size="large" @click="handleAdd">
          <el-icon :size="16"><el-icon-plus></el-icon-plus></el-icon>
          添加账单
        </el-button>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        style="display: none"
        @change="handleFileChange"
      />
    </div>

    <div class="bills-toolbar">
      <BillFilter />
    </div>

    <div class="section-card">
      <BillList
        :bills="bills"
        :loading="loading"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next"
        background
        @current-change="handlePageChange"
      />
    </div>

    <BillForm
      :visible="formVisible"
      :edit-data="editData"
      @submit="handleFormSubmit"
      @close="formVisible = false"
    />

    <ConfirmDialog
      :visible="deleteVisible"
      title="删除账单"
      content="确定要删除这条账单吗？此操作不可撤销。"
      confirm-text="删除"
      @confirm="confirmDelete"
      @cancel="deleteVisible = false"
    />
  </div>
</template>

<style lang="less" scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.bills-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xl);
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .bills-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>