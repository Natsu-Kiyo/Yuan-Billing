<script setup>
// 账单表单弹窗：新增 / 编辑账单，含金额校验、分类联动
import { ref, reactive, watch, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useBills } from '@/composables/useBills'
import { getToday } from '@/utils/format'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  editData: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['submit', 'close'])

const { userId } = useAuth()
const { expenseCategories, incomeCategories, addBill, editBill } = useBills()

const formRef = ref(null)
const submitting = ref(false)
// 避免初始化期间类型切换导致分类被误清空
const isInitializing = ref(false)
const isEdit = computed(() => !!props.editData)

const form = reactive({
  type: 'expense',
  amount: '',
  categoryId: null,
  billDate: getToday(),
  note: '',
})

// 根据当前类型返回对应的分类列表
const currentCategories = computed(() =>
  form.type === 'expense' ? expenseCategories.value : incomeCategories.value
)

// 自定义金额校验规则
const validateAmount = (_rule, value, callback) => {
  const num = parseFloat(value)
  if (isNaN(num) || num <= 0) {
    callback(new Error('金额必须大于0'))
  } else {
    callback()
  }
}

const rules = {
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { validator: validateAmount, trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' },
  ],
  billDate: [
    { required: true, message: '请选择日期', trigger: 'change' },
  ],
}

// 弹窗打开时初始化表单数据（新增或编辑回填）
watch(
  () => props.visible,
  (val) => {
    if (val) {
      isInitializing.value = true
      if (props.editData) {
        form.type = props.editData.type
        form.amount = String(props.editData.amount)
        form.billDate = props.editData.bill_date
        form.note = props.editData.note || ''
      } else {
        form.type = 'expense'
        form.amount = ''
        form.billDate = getToday()
        form.note = ''
      }
      form.categoryId = props.editData?.category_id ?? null
      isInitializing.value = false
    }
  }
)

// 切换类型时清空分类选择（非初始化阶段）
watch(
  () => form.type,
  () => {
    if (!isInitializing.value) {
      form.categoryId = null
    }
  }
)

// 提交表单：校验通过后根据新增/编辑调用对应 API
async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      user_id: userId.value,
      type: form.type,
      amount: parseFloat(form.amount),
      category_id: form.categoryId,
      bill_date: form.billDate,
      note: form.note,
    }

    if (isEdit.value) {
      await editBill(props.editData.id, data)
      ElMessage.success('账单已更新')
    } else {
      await addBill(data)
      ElMessage.success('账单已添加')
    }

    emit('submit')
    emit('close')
  } catch (err) {
    if (err?.message) {
      ElMessage.error(err.message)
    }
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑账单' : '添加账单'"
    width="480px"
    :close-on-click-modal="false"
    @close="handleClose"
    align-center
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio-button value="expense">
            <el-icon :size="14"><el-icon-download></el-icon-download></el-icon>
            支出
          </el-radio-button>
          <el-radio-button value="income">
            <el-icon :size="14"><el-icon-upload></el-icon-upload></el-icon>
            收入
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="金额" prop="amount">
        <el-input
          v-model="form.amount"
          placeholder="请输入金额"
          type="number"
          :min="0"
          size="large"
        >
          <template #prefix>
            <span class="amount-prefix">¥</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          placeholder="请选择分类"
          size="large"
          style="width: 100%"
        >
          <el-option
            v-for="cat in currentCategories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          >
            <div class="category-option">
              <span
                class="category-dot"
                :style="{ background: cat.color }"
              ></span>
              <span>{{ cat.name }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="日期" prop="billDate">
        <el-date-picker
          v-model="form.billDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          size="large"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.note"
          placeholder="添加备注（可选）"
          type="textarea"
          :rows="2"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '添加' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="less" scoped>
.amount-prefix {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.category-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}
</style>