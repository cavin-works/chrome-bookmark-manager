<template>
  <div>
    <!-- 主节点容器 -->
    <div
      ref="itemRef"
      data-tree-item
      :data-id="item.id"
      :data-depth="depth"
      :data-folder-closed="item.children && !isOpen"
      :class="cn(
        'select-none cursor-pointer px-1',
        isSelected ? `bg-orange-100 ${selectionStyle}` : 'text-foreground'
      )"
      :style="{ paddingLeft: `${(depth || 0) * 20}px` }"
      @click="handleClick"
    >
      <div class="flex items-center h-8">
        <!-- 文件夹节点 -->
        <div v-if="item.children" class="flex items-center gap-2 flex-1 group">
          <!-- 展开/折叠按钮 -->
          <Button
            variant="ghost"
            size="icon"
            class="h-6 w-6"
            @click.stop="() => onToggleExpand(item.id, !isOpen)"
          >
            <div
              class="transition-transform duration-100"
              :class="{ 'rotate-90': isOpen }"
            >
              <ChevronRight class="h-4 w-4" />
            </div>
          </Button>

          <!-- 复选框 (文件夹) -->
          <div
            v-if="showAccessRights"
            class="relative flex items-center justify-center w-4 h-4 cursor-pointer hover:opacity-80"
            @click.stop="handleAccessClick"
          >
            <div v-if="checkState === 'checked'" class="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
              <Check class="h-3 w-3 text-primary-foreground" />
            </div>
            <div v-else-if="checkState === 'unchecked'" class="w-4 h-4 border rounded border-input" />
            <div v-else-if="checkState === 'indeterminate'" class="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
              <div class="h-0.5 w-2 bg-primary-foreground" />
            </div>
          </div>

          <!-- 图标 -->
          <component :is="renderIcon()" class="shrink-0" />

          <!-- 名称 -->
          <span class="flex-1">{{ item.name }}</span>

          <!-- 选中数量徽章 -->
          <Badge
            v-if="selectedCount !== null && selectedCount > 0"
            variant="secondary"
            class="mr-2 bg-blue-100 hover:bg-blue-100"
          >
            {{ selectedCount }} selected
          </Badge>

          <!-- 信息按钮 -->
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0 group-hover:opacity-100 opacity-0 items-center justify-center"
            @click.stop
            :title="`Type: ${item.type}, ID: ${item.id}, Items: ${item.children?.length || 0}`"
          >
            <Info class="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <!-- 文件节点 -->
        <div v-else class="flex items-center gap-2 flex-1 pl-8 group">
          <!-- 复选框 (文件) -->
          <div
            v-if="showAccessRights"
            class="relative flex items-center justify-center w-4 h-4 cursor-pointer hover:opacity-80"
            @click.stop="handleAccessClick"
          >
            <div v-if="item.checked" class="w-4 h-4 border rounded bg-primary border-primary flex items-center justify-center">
              <Check class="h-3 w-3 text-primary-foreground" />
            </div>
            <div v-else class="w-4 h-4 border rounded border-input" />
          </div>

          <!-- 图标 -->
          <component :is="renderIcon()" class="shrink-0" />

          <!-- 名称 -->
          <span class="flex-1">{{ item.name }}</span>

          <!-- 信息按钮 -->
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0 group-hover:opacity-100 opacity-0 items-center justify-center"
            @click.stop
            :title="`Type: ${item.type}, ID: ${item.id}`"
          >
            <Info class="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>

    <!-- 子节点渲染 -->
    <Transition
      name="expand"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div v-if="item.children && isOpen" class="overflow-hidden">
        <TreeViewItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :depth="(depth || 0) + 1"
          :selected-ids="selectedIds"
          :last-selected-id="lastSelectedId"
          :on-select="onSelect"
          :expanded-ids="expandedIds"
          :on-toggle-expand="onToggleExpand"
          :get-icon="getIcon"
          :on-action="onAction"
          :on-access-change="onAccessChange"
          :all-items="allItems"
          :show-access-rights="showAccessRights"
          :item-map="itemMap"
          :icon-map="iconMap"
          :menu-items="menuItems"
          :get-selected-items="getSelectedItems"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { ChevronRight, Check, Info, Folder, Box } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TreeItemProps, CheckState } from './types'

// Props
const props = defineProps<TreeItemProps>()

// 状态
const itemRef = ref<HTMLDivElement>()
const selectionStyle = ref('')
const isOpen = computed(() => props.expandedIds.has(props.item.id))
const isSelected = computed(() => props.selectedIds.has(props.item.id))

// 默认图标映射
const defaultIconMap: Record<string, any> = {
  file: Box,
  folder: Folder,
}

// 获取复选框状态
const checkState = computed((): CheckState => {
  return getCheckState(props.item, props.itemMap)
})

// 获取选中的子项数量
const selectedCount = computed(() => {
  if (!props.item.children || isOpen.value) return null
  return getSelectedChildrenCount(props.item)
})

// 工具函数
function getCheckState(item: any, itemMap: Map<string, any>): CheckState {
  if (!item.children) {
    return item.checked ? 'checked' : 'unchecked'
  }

  const childStates = item.children.map((child: any) => getCheckState(child, itemMap))
  const checkedCount = childStates.filter((state: CheckState) => state === 'checked').length
  const indeterminateCount = childStates.filter((state: CheckState) => state === 'indeterminate').length

  if (checkedCount === childStates.length) {
    return 'checked'
  } else if (checkedCount > 0 || indeterminateCount > 0) {
    return 'indeterminate'
  } else {
    return 'unchecked'
  }
}

function getSelectedChildrenCount(item: any): number {
  if (!item.children) return 0

  let count = 0
  const countSelected = (items: any[]) => {
    items.forEach(child => {
      if (props.selectedIds.has(child.id)) {
        count++
      }
      if (child.children) {
        countSelected(child.children)
      }
    })
  }

  countSelected(item.children)
  return count
}

function getVisibleItems(items: any[]): any[] {
  let visibleItems: any[] = []

  items.forEach(item => {
    visibleItems.push(item)
    if (item.children && props.expandedIds.has(item.id)) {
      visibleItems = [...visibleItems, ...getVisibleItems(item.children)]
    }
  })

  return visibleItems
}

function renderIcon() {
  if (props.getIcon) {
    return props.getIcon(props.item, props.depth || 0)
  }

  const iconMap = { ...defaultIconMap, ...props.iconMap }
  return iconMap[props.item.type] || iconMap.folder || defaultIconMap.folder
}

// 事件处理
function handleClick(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()

  let newSelection = new Set(props.selectedIds)

  if (!itemRef.value) return

  if (e.shiftKey && props.lastSelectedId.value !== null) {
    const items = Array.from(document.querySelectorAll('[data-tree-item]')) as HTMLElement[]
    const lastIndex = items.findIndex(el => el.getAttribute('data-id') === props.lastSelectedId.value)
    const currentIndex = items.findIndex(el => el === itemRef.value)
    const [start, end] = [Math.min(lastIndex, currentIndex), Math.max(lastIndex, currentIndex)]

    items.slice(start, end + 1).forEach(el => {
      const id = el.getAttribute('data-id')
      const parentFolderClosed = el.closest('[data-folder-closed="true"]')
      const isClosedFolder = el.getAttribute('data-folder-closed') === 'true'

      if (id && (isClosedFolder || !parentFolderClosed)) {
        newSelection.add(id)
      }
    })
  } else if (e.ctrlKey || e.metaKey) {
    if (newSelection.has(props.item.id)) {
      newSelection.delete(props.item.id)
    } else {
      newSelection.add(props.item.id)
    }
  } else {
    newSelection = new Set([props.item.id])
    // 单击展开文件夹
    if (props.item.children && isSelected.value) {
      props.onToggleExpand(props.item.id, !isOpen.value)
    }
  }

  props.lastSelectedId.value = props.item.id
  props.onSelect(newSelection)
}

function handleAccessClick() {
  if (props.onAccessChange) {
    const currentState = getCheckState(props.item, props.itemMap)
    const newChecked = currentState === 'checked' ? false : true
    props.onAccessChange(props.item, newChecked)
  }
}

// 动画函数
function onEnter(el: Element) {
  const element = el as HTMLElement
  element.style.height = '0'
  nextTick(() => {
    element.style.height = element.scrollHeight + 'px'
  })
}

function onLeave(el: Element) {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  nextTick(() => {
    element.style.height = '0'
  })
}

// 选择样式计算
watch([isSelected, () => props.selectedIds, () => props.expandedIds], () => {
  if (!isSelected.value) {
    selectionStyle.value = ''
    return
  }

  const visibleItems = getVisibleItems(props.allItems)
  const currentIndex = visibleItems.findIndex(i => i.id === props.item.id)

  const prevItem = visibleItems[currentIndex - 1]
  const nextItem = visibleItems[currentIndex + 1]

  const isPrevSelected = prevItem && props.selectedIds.has(prevItem.id)
  const isNextSelected = nextItem && props.selectedIds.has(nextItem.id)

  const roundTop = !isPrevSelected
  const roundBottom = !isNextSelected

  selectionStyle.value = `${roundTop ? 'rounded-t-md' : ''} ${roundBottom ? 'rounded-b-md' : ''}`
})
</script>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: height 0.2s ease;
  overflow: hidden;
}

.expand-enter-from, .expand-leave-to {
  height: 0;
}
</style>
