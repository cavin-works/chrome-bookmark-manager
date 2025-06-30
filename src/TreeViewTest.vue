<template>
  <div class="min-h-screen bg-background p-8">
    <div class="max-w-6xl mx-auto space-y-8">
      <!-- 标题 -->
      <div class="text-center space-y-4">
        <h1 class="text-4xl font-bold text-foreground">TreeView 组件测试</h1>
        <p class="text-lg text-muted-foreground">完整功能演示：选择、搜索、拖拽、复选框等</p>
      </div>

      <!-- 控制面板 -->
      <div class="bg-card p-6 rounded-lg border space-y-4">
        <h2 class="text-xl font-semibold mb-4">控制面板</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">显示选项</label>
            <div class="space-y-2">
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="showCheckboxes"
                  class="rounded border-input"
                >
                <span class="text-sm">显示复选框</span>
              </label>
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  v-model="showExpandAll"
                  class="rounded border-input"
                >
                <span class="text-sm">显示展开/折叠按钮</span>
              </label>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">选择信息</label>
            <div class="text-sm text-muted-foreground">
              <p>已选择: {{ selectedItems.length }} 项</p>
              <p>选择的ID: {{ selectedItems.map(item => item.id).join(', ') || '无' }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">操作</label>
            <div class="space-y-2">
              <button
                @click="resetData"
                class="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                重置数据
              </button>
              <button
                @click="addRandomItem"
                class="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                添加随机项
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- TreeView 组件展示 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 基础功能演示 -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">基础功能演示</h2>
          <TreeView
            :data="treeData"
            title="文件系统结构"
            :show-expand-all="showExpandAll"
            :show-checkboxes="showCheckboxes"
            search-placeholder="搜索文件和文件夹..."
            selection-text="个文件/文件夹已选择"
            :checkbox-labels="{ check: '全选', uncheck: '取消全选' }"
            :icon-map="iconMap"
            :menu-items="menuItems"
            @selection-change="handleSelectionChange"
            @check-change="handleCheckChange"
            @action="handleAction"
          />
        </div>

        <!-- 高级功能演示 -->
        <div class="space-y-4">
          <h2 class="text-xl font-semibold">高级功能演示</h2>
          <TreeView
            :data="complexTreeData"
            title="复杂数据结构"
            :show-expand-all="true"
            :show-checkboxes="true"
            search-placeholder="搜索复杂结构..."
            selection-text="个节点已选择"
            :get-icon="getCustomIcon"
            :menu-items="advancedMenuItems"
            @selection-change="handleComplexSelectionChange"
            @check-change="handleComplexCheckChange"
            @action="handleComplexAction"
          />
        </div>
      </div>

      <!-- 事件日志 -->
      <div class="bg-card p-6 rounded-lg border">
        <h2 class="text-xl font-semibold mb-4">事件日志</h2>
        <div class="bg-muted p-4 rounded max-h-64 overflow-y-auto">
          <div v-if="eventLog.length === 0" class="text-muted-foreground text-sm">
            暂无事件记录
          </div>
          <div v-else class="space-y-1">
            <div
              v-for="(event, index) in eventLog"
              :key="index"
              class="text-sm font-mono"
            >
              <span class="text-muted-foreground">{{ event.time }}</span>
              <span class="mx-2">|</span>
              <span class="font-medium">{{ event.type }}</span>
              <span class="mx-2">|</span>
              <span>{{ event.message }}</span>
            </div>
          </div>
        </div>
        <button
          @click="clearEventLog"
          class="mt-2 px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
        >
          清空日志
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Folder, File, Image, Code, Archive, Settings } from 'lucide-vue-next'
import TreeView from './components/ui/tree-view/TreeView.vue'
import type { TreeViewItem, TreeViewMenuItem } from './components/ui/tree-view/types'

// 响应式状态
const showCheckboxes = ref(true)
const showExpandAll = ref(true)
const selectedItems = ref<TreeViewItem[]>([])
const eventLog = ref<Array<{ time: string; type: string; message: string }>>([])

// 示例数据
const treeData = ref<TreeViewItem[]>([
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    children: [
      {
        id: '1-1',
        name: 'Projects',
        type: 'folder',
        children: [
          { id: '1-1-1', name: 'project1.vue', type: 'file' },
          { id: '1-1-2', name: 'project2.js', type: 'file' },
          { id: '1-1-3', name: 'README.md', type: 'file' }
        ]
      },
      {
        id: '1-2',
        name: 'Images',
        type: 'folder',
        children: [
          { id: '1-2-1', name: 'photo1.jpg', type: 'image' },
          { id: '1-2-2', name: 'photo2.png', type: 'image' }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Downloads',
    type: 'folder',
    children: [
      { id: '2-1', name: 'archive.zip', type: 'archive' },
      { id: '2-2', name: 'installer.exe', type: 'file' }
    ]
  },
  {
    id: '3',
    name: 'config.json',
    type: 'file'
  }
])

const complexTreeData = ref<TreeViewItem[]>([
  {
    id: 'root',
    name: '系统根目录',
    type: 'folder',
    children: [
      {
        id: 'sys',
        name: 'System',
        type: 'folder',
        children: [
          { id: 'sys-1', name: 'config.sys', type: 'config' },
          { id: 'sys-2', name: 'drivers', type: 'folder', children: [
            { id: 'sys-2-1', name: 'audio.driver', type: 'file' },
            { id: 'sys-2-2', name: 'video.driver', type: 'file' }
          ]}
        ]
      },
      {
        id: 'usr',
        name: 'User Data',
        type: 'folder',
        children: [
          { id: 'usr-1', name: 'preferences.plist', type: 'config' },
          { id: 'usr-2', name: 'cache', type: 'folder', children: [
            { id: 'usr-2-1', name: 'temp1.tmp', type: 'file' },
            { id: 'usr-2-2', name: 'temp2.tmp', type: 'file' }
          ]}
        ]
      }
    ]
  }
])

// 图标映射
const iconMap = {
  folder: Folder,
  file: File,
  image: Image,
  archive: Archive,
  config: Settings
}

// 菜单项
const menuItems: TreeViewMenuItem[] = [
  {
    id: 'open',
    label: '打开',
    icon: File,
    action: (items) => logEvent('菜单', `打开 ${items.length} 个项目`)
  },
  {
    id: 'delete',
    label: '删除',
    icon: Archive,
    action: (items) => logEvent('菜单', `删除 ${items.length} 个项目`)
  }
]

const advancedMenuItems: TreeViewMenuItem[] = [
  {
    id: 'configure',
    label: '配置',
    icon: Settings,
    action: (items) => logEvent('高级菜单', `配置 ${items.length} 个项目`)
  },
  {
    id: 'analyze',
    label: '分析',
    icon: Code,
    action: (items) => logEvent('高级菜单', `分析 ${items.length} 个项目`)
  }
]

// 自定义图标函数
function getCustomIcon(item: TreeViewItem, depth: number) {
  if (depth > 2) return Code
  return iconMap[item.type as keyof typeof iconMap] || File
}

// 事件处理函数
function handleSelectionChange(items: TreeViewItem[]) {
  selectedItems.value = items
  logEvent('选择', `选择了 ${items.length} 个项目: ${items.map(i => i.name).join(', ')}`)
}

function handleComplexSelectionChange(items: TreeViewItem[]) {
  logEvent('复杂选择', `复杂树选择了 ${items.length} 个项目`)
}

function handleCheckChange(item: TreeViewItem, checked: boolean) {
  // 更新数据状态
  item.checked = checked
  logEvent('复选框', `${checked ? '选中' : '取消选中'} ${item.name}`)
}

function handleComplexCheckChange(item: TreeViewItem, checked: boolean) {
  item.checked = checked
  logEvent('复杂复选框', `${checked ? '选中' : '取消选中'} ${item.name}`)
}

function handleAction(action: string, items: TreeViewItem[]) {
  logEvent('动作', `执行动作 "${action}" 于 ${items.length} 个项目`)
}

function handleComplexAction(action: string, items: TreeViewItem[]) {
  logEvent('复杂动作', `执行复杂动作 "${action}" 于 ${items.length} 个项目`)
}

// 工具函数
function logEvent(type: string, message: string) {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ time, type, message })
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

function clearEventLog() {
  eventLog.value = []
  logEvent('系统', '事件日志已清空')
}

function resetData() {
  treeData.value = [
    {
      id: '1',
      name: 'Documents',
      type: 'folder',
      children: [
        { id: '1-1', name: 'file1.txt', type: 'file' },
        { id: '1-2', name: 'file2.txt', type: 'file' }
      ]
    }
  ]
  logEvent('系统', '数据已重置')
}

function addRandomItem() {
  const randomId = Math.random().toString(36).substr(2, 9)
  const newItem: TreeViewItem = {
    id: randomId,
    name: `随机文件_${randomId}`,
    type: 'file'
  }

  treeData.value.push(newItem)
  logEvent('系统', `添加了随机项目: ${newItem.name}`)
}
</script>

<style scoped>
/* 自定义样式 */
.font-mono {
  font-family: 'Courier New', monospace;
}
</style>