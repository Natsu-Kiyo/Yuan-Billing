<script setup>
// 账单列表页：筛选、分页、增删改、CSV 导入导出
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useBills } from '@/composables/useBills'
import { useCategoriesStore } from '@/stores/categories'
import { fetchAllBills, createBills } from '@/api/bills'
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
  setPageSize,
  fetchCategories,
} = useBills()

const formVisible = ref(false)
const editData = ref(null) // 编辑时传入已有数据，null 表示新增
const deleteTarget = ref(null)
const deleteVisible = ref(false)
const exporting = ref(false)
const importing = ref(false)
const fileInput = ref(null)
const listCardRef = ref(null)

// 初始化：加载分类和账单列表
onMounted(async () => {
  if (!userId.value) return
  try {
    await fetchCategories()
    await fetchBills(userId.value)
  } catch (err) {
    ElMessage.error(err.message || '加载账单数据失败')
  }
})

/** 重新加载账单列表，失败时给出提示 */
async function loadBills() {
  if (!userId.value) return
  try {
    await fetchBills(userId.value)
  } catch (err) {
    ElMessage.error(err.message || '加载账单数据失败')
  }
}

// 筛选条件变化自动重新查询
watch(
  () => [
    filters.value.type,
    filters.value.categoryId,
    filters.value.startDate,
    filters.value.endDate,
    filters.value.minAmount,
    filters.value.maxAmount,
  ],
  loadBills,
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
    if (userId.value) {
      await fetchBills(userId.value)
    }
    ElMessage.success('账单已删除')
    deleteVisible.value = false
    deleteTarget.value = null
  } catch (err) {
    ElMessage.error(err.message || '删除失败')
  }
}

function handleFormSubmit() {
  loadBills()
}

async function handlePageChange(page) {
  setPage(page)
  await loadBills()
  scrollListToTop()
}

async function handleSizeChange(size) {
  setPageSize(size)
  await loadBills()
  scrollListToTop()
}

/** 翻页或修改每页条数后回到列表顶部 */
function scrollListToTop() {
  if (listCardRef.value) {
    listCardRef.value.scrollTop = 0
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
    const csv =
      bom + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
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

/** 解析单行 CSV，支持双引号包裹与 "" 转义 */
function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }

  result.push(current)
  return result
}

/** 校验 YYYY-MM-DD 是否为真实存在的日期 */
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

const IMPORT_BATCH_SIZE = 200

/** 分批写入账单；整批失败时逐条重试，定位具体失败行 */
async function insertBillsInBatches(rows) {
  let success = 0
  const failed = []

  for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
    const batch = rows.slice(i, i + IMPORT_BATCH_SIZE)

    try {
      await createBills(batch)
      success += batch.length
    } catch {
      for (const row of batch) {
        try {
          await createBills([row])
          success++
        } catch {
          failed.push(row)
        }
      }
    }
  }

  return { success, failed }
}

/** 解析 CSV 文件：校验后批量创建账单 */
async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  importing.value = true
  try {
    const text = (await file.text()).replace(/^\uFEFF/, '')
    const lines = text.split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) {
      ElMessage.warning('CSV 文件为空或格式不正确')
      return
    }

    const nameToId = buildCategoryNameMap()
    const header = parseCsvLine(lines[0]).map((h) => h.trim())
    const typeIdx = header.indexOf('类型')
    const amountIdx = header.indexOf('金额')
    const categoryIdx = header.indexOf('分类')
    const dateIdx = header.indexOf('日期')
    const noteIdx = header.indexOf('备注')

    if (typeIdx === -1 || amountIdx === -1 || categoryIdx === -1 || dateIdx === -1) {
      ElMessage.error('CSV 表头缺少必要列：类型、金额、分类、日期')
      return
    }

    const rows = []
    const invalidRows = []

    for (let i = 1; i < lines.length; i++) {
      const lineNo = i + 1
      const cols = parseCsvLine(lines[i])
      const typeLabel = cols[typeIdx]?.trim()
      const amount = Number(cols[amountIdx]?.trim())
      const categoryName = cols[categoryIdx]?.trim()
      const date = cols[dateIdx]?.trim()
      const note = noteIdx !== -1 ? cols[noteIdx]?.trim() || '' : ''

      if (!typeLabel || !categoryName || !date || !Number.isFinite(amount) || amount <= 0) {
        invalidRows.push(`第${lineNo}行：缺少必要字段或金额无效`)
        continue
      }

      const type = typeLabel === '支出' ? 'expense' : typeLabel === '收入' ? 'income' : null
      if (!type) {
        invalidRows.push(`第${lineNo}行：类型只能是“支出”或“收入”`)
        continue
      }

      if (!isValidDate(date)) {
        invalidRows.push(`第${lineNo}行：日期格式应为 YYYY-MM-DD`)
        continue
      }

      const categoryId = nameToId[categoryName]
      if (!categoryId) {
        invalidRows.push(`第${lineNo}行：未知分类“${categoryName}”`)
        continue
      }

      rows.push({
        user_id: userId.value,
        type,
        amount: Math.round(amount * 100) / 100,
        category_id: categoryId,
        bill_date: date,
        note,
      })
    }

    if (!rows.length) {
      ElMessage.error(
        `没有可导入的数据${invalidRows.length ? `，${invalidRows.length} 行校验未通过` : ''}`,
      )
      return
    }

    const { success, failed } = await insertBillsInBatches(rows)
    await loadBills()

    const skipped = invalidRows.length + failed.length

    if (success === 0) {
      ElMessage.error('导入失败，请检查 CSV 内容')
    } else if (skipped > 0) {
      ElMessage.warning(`导入完成：成功 ${success} 条，跳过 ${skipped} 条`)
    } else {
      ElMessage.success(`导入完成：成功 ${success} 条`)
    }
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

    <div ref="listCardRef" class="section-card bill-list-card">
      <BillList :bills="bills" :loading="loading" @edit="handleEdit" @delete="handleDelete" />
    </div>

    <div v-if="pagination.total > 0" class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="sizes, prev, pager, next"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
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
// 让页面高度刚好等于「视口 - 顶栏」，列表区域内部滚动
.page-container {
  height: calc(100vh - var(--navbar-height));
  height: calc(100dvh - var(--navbar-height));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.bill-list-card {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
  flex-shrink: 0;
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
