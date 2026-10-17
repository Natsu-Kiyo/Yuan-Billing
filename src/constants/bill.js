// 账单分类图标映射：分类名称以数据库 categories.name 为准
import {
  Food,
  Van,
  ShoppingCart,
  VideoPlay,
  Reading,
  House,
  FirstAidKit,
  More,
  Money,
  Coin,
  Wallet,
  Present,
  MoreFilled,
} from '@element-plus/icons-vue'
import { THEME_COLORS } from './theme'

export const DEFAULT_CATEGORY_COLOR = THEME_COLORS.brand

export const CATEGORY_ICON_MAP = {
  餐饮: Food,
  交通: Van,
  购物: ShoppingCart,
  娱乐: VideoPlay,
  学习: Reading,
  住房: House,
  医疗: FirstAidKit,
  其他支出: More,
  工资: Money,
  兼职: Coin,
  生活费: Wallet,
  红包: Present,
  其他收入: MoreFilled,
}

/** 根据分类名称获取图标组件，未知分类回退到钱包 */
export function getCategoryIcon(categoryName) {
  return CATEGORY_ICON_MAP[categoryName] || Wallet
}
