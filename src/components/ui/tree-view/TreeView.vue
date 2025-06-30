<template>
  <div class="flex gap-4">
    <div
      ref="treeRef"
      class="bg-background p-6 rounded-xl border max-w-2xl space-y-4 w-[600px] relative shadow-lg"
    >
      <!-- 头部：选择状态或搜索框 -->
      <Transition name="slide-fade" mode="out-in">
        <div v-if="selectedIds.size > 0" key="selection" class="h-10 flex items-center justify-between bg-background rounded-lg border px-4">
          <div class="font-medium cursor-pointer flex items-center" title="Clear selection" @click="clearSelection">
            <X class="h-4 w-4 mr-2" />
            {{ selectedIds.size }} {{ selectionText }}
          </div>

          <div v-if="showCheckboxes" class="flex items-center gap-2">
            <Button variant="ghost" size="sm" @click="handleBulkCheck(true)" class="text-green-600 hover:text-green-700 hover:bg-green-50">
              {{ checkboxLabels.check }}
            </Button>
            <Button variant="ghost" size="sm" @click="handleBulkCheck(false)" class="text-red-600 hover:text-red-700 hover:bg-red-50">
              {{ checkboxLabels.uncheck }}
            </Button>
          </div>
        </div>

        <div v-else key="search" class="h-10 flex items-center gap-2">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              :placeholder="searchPlaceholder"
              class="h-10 pl-9"
            />
          </div>
          <div v-if="showExpandAll" class="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" class="h-10 px-2" @click="handleExpandAll">
              <ChevronDown class="h-4 w-4 mr-1" />
              Expand All
            </Button>
            <Button variant="ghost" size="sm" class="h-10 px-2" @click="handleCollapseAll">
              <ChevronRight class="h-4 w-4 mr-1" />
              Collapse All
            </Button>
          </div>
        </div>
      </Transition>

      <!-- 树形结构区域 -->
      <div
        ref="dragRef"
        :class="cn('rounded-lg bg-card relative select-none', className)"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
      >
        <!-- 拖拽选择可视化 -->
        <div
          v-if="isDragging"
          class="absolute inset-0 bg-blue-500/10 pointer-events-none border border-blue-500/30"
          :style="{
            top: `${Math.min(dragStart || 0, currentMousePos)}px`,
            height: `${Math.abs((dragStart || 0) - currentMousePos)}px`,
          }"
        />

        <!-- 树形节点渲染 -->
        <TreeViewItem
          v-for="item in filteredData"
          :key="item.id"
          :item="item"
          :depth="0"
          :selected-ids="selectedIds"
          :last-selected-id="lastSelectedId"
          :on-select="setSelectedIds"
          :expanded-ids="expandedIds"
          :on-toggle-expand="handleToggleExpand"
          :get-icon="getIcon"
          :on-action="onAction"
          :on-access-change="onCheckChange"
          :all-items="data"
          :show-access-rights="showCheckboxes"
          :item-map="itemMap"
          :icon-map="iconMap"
          :menu-items="menuItems"
          :get-selected-items="getSelectedItems"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { X, Search, ChevronDown, ChevronRight, Folder, Box } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import TreeViewItem from './TreeViewItem.vue'
import type { TreeViewItem as TreeViewItemType, TreeViewProps, CheckState } from './types'

// Props 定义
const props = withDefaults(defineProps<TreeViewProps>(), {
  className: '',
  title: '',
  showExpandAll: true,
  showCheckboxes: false,
  checkboxPosition: 'left',
  searchPlaceholder: 'Search...',
  selectionText: 'selected',
  checkboxLabels: () => ({
    check: 'Check',
    uncheck: 'Uncheck',
  }),
})

// 状态定义
const selectedIds = ref<Set<string>>(new Set())
const expandedIds = ref<Set<string>>(new Set())
const searchQuery = ref('')
const isDragging = ref(false)
const dragStart = ref<number | null>(null)
const dragStartPosition = ref<{ x: number; y: number } | null>(null)
const currentMousePos = ref(0)
const lastSelectedId = reactive<{ value: string | null }>({ value: null })

// Refs
const treeRef = ref<HTMLDivElement>()
const dragRef = ref<HTMLDivElement>()

// 常量
const DRAG_THRESHOLD = 10

// 计算属性
const itemMap = computed(() => buildItemMap(props.data))

const searchResult = computed(() => {
  if (!searchQuery.value.trim()) {
    return { filteredData: props.data, searchExpandedIds: new Set<string>() }
  }

  const searchLower = searchQuery.value.toLowerCase()
  const newExpandedIds = new Set<string>()

  const itemMatches = (item: TreeViewItemType): boolean => {
    const nameMatches = item.name.toLowerCase().includes(searchLower)
    if (nameMatches) return true

    if (item.children) {
      return item.children.some(child => itemMatches(child))
    }

    return false
  }

  const filterTree = (items: TreeViewItemType[]): TreeViewItemType[] => {
    return items.reduce((acc: TreeViewItemType[], item) => {
      if (itemMatches(item)) {
        // 如果项目匹配，展开父级
        if (item.children) {
          newExpandedIds.add(item.id)
        }

        // 递归过滤子项
        const filteredChildren = item.children ? filterTree(item.children) : undefined
        acc.push({
          ...item,
          children: filteredChildren
        })
      }
      return acc
    }, [])
  }

  return {
    filteredData: filterTree(props.data),
    searchExpandedIds: newExpandedIds
  }
})

const filteredData = computed(() => searchResult.value.filteredData)
const searchExpandedIds = computed(() => searchResult.value.searchExpandedIds)

// 工具函数
function buildItemMap(items: TreeViewItemType[]): Map<string, TreeViewItemType> {
  const map = new Map<string, TreeViewItemType>()
  const processItem = (item: TreeViewItemType) => {
    map.set(item.id, item)
    item.children?.forEach(processItem)
  }
  items.forEach(processItem)
  return map
}

function getAllFolderIds(items: TreeViewItemType[]): string[] {
  let ids: string[] = []
  items.forEach(item => {
    if (item.children) {
      ids.push(item.id)
      ids = [...ids, ...getAllFolderIds(item.children)]
    }
  })
  return ids
}

function getSelectedItems(): TreeViewItemType[] {
  const items: TreeViewItemType[] = []
  const processItem = (item: TreeViewItemType) => {
    if (selectedIds.value.has(item.id)) {
      items.push(item)
    }
    item.children?.forEach(processItem)
  }
  props.data.forEach(processItem)
  return items
}

// 事件处理
function clearSelection() {
  selectedIds.value = new Set()
  lastSelectedId.value = null
}

function setSelectedIds(ids: Set<string>) {
  selectedIds.value = ids
}

function handleExpandAll() {
  expandedIds.value = new Set(getAllFolderIds(props.data))
}

function handleCollapseAll() {
  expandedIds.value = new Set()
}

function handleToggleExpand(id: string, isOpen: boolean) {
  const newExpandedIds = new Set(expandedIds.value)
  if (isOpen) {
    newExpandedIds.add(id)
  } else {
    newExpandedIds.delete(id)
  }
  expandedIds.value = newExpandedIds
}

function handleBulkCheck(checked: boolean) {
  const effectiveItems = getEffectiveSelectedItems()
  const processItem = (item: TreeViewItemType) => {
    props.onCheckChange?.(item, checked)
    item.children?.forEach(processItem)
  }
  effectiveItems.forEach(processItem)
}

function getEffectiveSelectedItems(): TreeViewItemType[] {
  const selectedItems = getSelectedItems()
  const selectedIdsSet = new Set(selectedItems.map(item => item.id))

  return selectedItems.filter(item => {
    if (!item.children) return true
    const hasSelectedChildren = item.children.some(child => selectedIdsSet.has(child.id))
    return !hasSelectedChildren
  })
}

// 拖拽功能
function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return

  dragStartPosition.value = { x: e.clientX, y: e.clientY }
}

function handleMouseMove(e: MouseEvent) {
  if (!(e.buttons & 1)) {
    isDragging.value = false
    dragStart.value = null
    dragStartPosition.value = null
    return
  }

  if (!dragStartPosition.value) return

  const deltaX = e.clientX - dragStartPosition.value.x
  const deltaY = e.clientY - dragStartPosition.value.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

  if (!isDragging.value) {
    if (distance > DRAG_THRESHOLD) {
      isDragging.value = true
      dragStart.value = dragStartPosition.value.y

      if (!e.shiftKey && !e.ctrlKey) {
        selectedIds.value = new Set()
        lastSelectedId.value = null
      }
    }
    return
  }

  if (!dragRef.value) return

  const items = Array.from(dragRef.value.querySelectorAll('[data-tree-item]')) as HTMLElement[]
  const startY = dragStart.value
  const currentY = e.clientY
  const [selectionStart, selectionEnd] = [
    Math.min(startY || 0, currentY),
    Math.max(startY || 0, currentY)
  ]

  const newSelection = new Set(e.shiftKey || e.ctrlKey ? Array.from(selectedIds.value) : [])

  items.forEach(item => {
    const rect = item.getBoundingClientRect()
    const itemTop = rect.top
    const itemBottom = rect.top + rect.height

    if (itemBottom >= selectionStart && itemTop <= selectionEnd) {
      const id = item.getAttribute('data-id')
      const isClosedFolder = item.getAttribute('data-folder-closed') === 'true'
      const parentFolderClosed = item.closest('[data-folder-closed="true"]')

      if (id && (isClosedFolder || !parentFolderClosed)) {
        newSelection.add(id)
      }
    }
  })

  selectedIds.value = newSelection
  currentMousePos.value = e.clientY
}

function handleMouseUp() {
  isDragging.value = false
  dragStart.value = null
  dragStartPosition.value = null
}

// 监听器
watch(searchExpandedIds, (newIds) => {
  if (searchQuery.value.trim()) {
    expandedIds.value = new Set([...expandedIds.value, ...newIds])
  }
})

watch(() => selectedIds.value, () => {
  if (props.onSelectionChange) {
    props.onSelectionChange(getSelectedItems())
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('mouseleave', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mouseleave', handleMouseUp)
})
</script>

<style scoped>
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>