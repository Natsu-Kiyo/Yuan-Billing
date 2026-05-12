<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useBills } from '@/composables/useBills'
import BillFilter from '@/components/bill/BillFilter.vue'
import BillList from '@/components/bill/BillList.vue'
import BillForm from '@/components/bill/BillForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const { userId } = useAuth()
const {
  bills,
  loading,
  filters,
  pagination,
  fetchBills,
  removeBill,
  setFilters,
  setPage,
  setCurrentBill,
  fetchCategories,
} = useBills()

const formVisible = ref(false)
const editData = ref(null)
const deleteTarget = ref(null)
const deleteVisible = ref(false)

onMounted(async () => {
  if (!userId.value) return
  bills.value = []
  await fetchCategories(userId.value)
  await fetchBills(userId.value)
})

watch(
  () => [filters.value.type, filters.value.categoryId, filters.value.startDate, filters.value.endDate],
  () => {
    if (userId.value) {
      fetchBills(userId.value)
    }
  }
)

watch(
  () => pagination.value.page,
  () => {
    if (userId.value) {
      fetchBills(userId.value)
    }
  }
)

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
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">账单管理</h1>
        <p class="page-subtitle">管理你的所有收支记录</p>
      </div>
      <el-button type="primary" size="large" @click="handleAdd">
        <el-icon :size="16"><el-icon-plus></el-icon-plus></el-icon>
        添加账单
      </el-button>
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