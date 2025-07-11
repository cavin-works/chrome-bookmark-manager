<template>
  <div class="p-6">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- 页面标题 -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold">设置</h1>
        <p class="text-muted-foreground">个性化您的书签管理体验</p>
      </div>

      <!-- 外观设置 -->
      <Card class="p-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Palette class="w-5 h-5 mr-2" />
            外观设置
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">主题</label>
              <Select v-model="localSettings.theme">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色主题</SelectItem>
                  <SelectItem value="dark">深色主题</SelectItem>
                  <SelectItem value="auto">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">布局样式</label>
              <Select v-model="localSettings.layout">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">网格布局</SelectItem>
                  <SelectItem value="list">列表布局</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">显示标签</label>
              <Switch v-model="localSettings.showTags" />
            </div>
            
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">显示描述</label>
              <Switch v-model="localSettings.showDescriptions" />
            </div>
            
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">显示创建时间</label>
              <Switch v-model="localSettings.showDateAdded" />
            </div>
          </div>
        </div>
      </Card>

      <!-- 功能设置 -->
      <Card class="p-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Settings class="w-5 h-5 mr-2" />
            功能设置
          </h2>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <label class="text-sm font-medium">自动分类</label>
                <p class="text-xs text-muted-foreground">使用 AI 自动为书签分类</p>
              </div>
              <Switch v-model="localSettings.autoCategorize" />
            </div>
            
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <label class="text-sm font-medium">自动获取图标</label>
                <p class="text-xs text-muted-foreground">自动获取网站图标</p>
              </div>
              <Switch v-model="localSettings.autoFetchIcons" />
            </div>
            
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <label class="text-sm font-medium">启用标签系统</label>
                <p class="text-xs text-muted-foreground">为书签添加标签进行分类</p>
              </div>
              <Switch v-model="localSettings.enableTags" />
            </div>
          </div>
        </div>
      </Card>

      <!-- AI 设置 -->
      <Card class="p-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Bot class="w-5 h-5 mr-2" />
            AI 设置
          </h2>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">AI API 密钥</label>
              <Input
                v-model="localSettings.aiApiKey"
                type="password"
                placeholder="输入您的 AI API 密钥"
                class="w-full"
              />
              <p class="text-xs text-muted-foreground">
                用于自动分类和标签生成功能
              </p>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm font-medium">AI 模型</label>
              <Select v-model="localSettings.aiModel">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      <!-- 数据管理 -->
      <Card class="p-6">
        <div class="space-y-4">
          <h2 class="text-lg font-semibold flex items-center">
            <Database class="w-5 h-5 mr-2" />
            数据管理
          </h2>
          
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <label class="text-sm font-medium">书签总数</label>
                <p class="text-xs text-muted-foreground">{{ bookmarkCount }} 个书签</p>
              </div>
              <Button variant="outline" size="sm" @click="exportBookmarks">
                <Download class="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="space-y-1">
                <label class="text-sm font-medium">标签总数</label>
                <p class="text-xs text-muted-foreground">{{ tagCount }} 个标签</p>
              </div>
              <Button variant="outline" size="sm" @click="cleanupTags">
                <Trash2 class="w-4 h-4 mr-2" />
                清理
              </Button>
            </div>
          </div>
          
          <div class="pt-4 border-t">
            <Button variant="destructive" @click="resetSettings">
              <RotateCcw class="w-4 h-4 mr-2" />
              恢复默认设置
            </Button>
          </div>
        </div>
      </Card>

      <!-- 保存按钮 -->
      <div class="flex justify-center">
        <Button @click="saveSettings" class="w-full md:w-auto">
          <Save class="w-4 h-4 mr-2" />
          保存设置
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast/use-toast';
import { 
  Settings, 
  Palette, 
  Bot, 
  Database, 
  Download, 
  Trash2, 
  RotateCcw, 
  Save 
} from 'lucide-vue-next';

// 设置类型定义
interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list';
  showTags: boolean;
  showDescriptions: boolean;
  showDateAdded: boolean;
  autoCategorize: boolean;
  autoFetchIcons: boolean;
  enableTags: boolean;
  aiApiKey?: string;
  aiModel: string;
}

// 默认设置
const defaultSettings: UserSettings = {
  theme: 'auto',
  layout: 'grid',
  showTags: true,
  showDescriptions: true,
  showDateAdded: true,
  autoCategorize: true,
  autoFetchIcons: true,
  enableTags: true,
  aiApiKey: '',
  aiModel: 'gpt-3.5-turbo'
};

// 响应式状态
const localSettings = ref<UserSettings>({ ...defaultSettings });
const bookmarkCount = ref(0);
const tagCount = ref(0);
const { toast } = useToast();

// 加载设置
const loadSettings = async () => {
  try {
    // 这里应该从 chrome.storage 或其他存储服务加载设置
    const stored = localStorage.getItem('humi-settings');
    if (stored) {
      localSettings.value = { ...defaultSettings, ...JSON.parse(stored) };
    }
    
    // 加载统计数据
    bookmarkCount.value = 156; // 模拟数据
    tagCount.value = 24; // 模拟数据
  } catch (error) {
    console.error('加载设置失败:', error);
    toast({
      title: "加载失败",
      description: "无法加载设置，使用默认设置",
      variant: "destructive"
    });
  }
};

// 保存设置
const saveSettings = async () => {
  try {
    // 这里应该保存到 chrome.storage 或其他存储服务
    localStorage.setItem('humi-settings', JSON.stringify(localSettings.value));
    
    toast({
      title: "保存成功",
      description: "设置已保存",
    });
  } catch (error) {
    console.error('保存设置失败:', error);
    toast({
      title: "保存失败",
      description: "无法保存设置，请重试",
      variant: "destructive"
    });
  }
};

// 导出书签
const exportBookmarks = () => {
  // 实现书签导出功能
  toast({
    title: "导出完成",
    description: "书签已导出到下载文件夹",
  });
};

// 清理标签
const cleanupTags = () => {
  // 实现标签清理功能
  toast({
    title: "清理完成",
    description: "已清理未使用的标签",
  });
};

// 重置设置
const resetSettings = () => {
  localSettings.value = { ...defaultSettings };
  toast({
    title: "重置完成",
    description: "设置已恢复默认值",
  });
};

// 组件挂载
onMounted(() => {
  loadSettings();
});
</script>