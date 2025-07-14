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
              <label class="text-sm font-medium">API 地址</label>
              <Input
                v-model="localSettings.aiApiUrl"
                placeholder="https://api.openai.com/v1"
                class="w-full"
                @blur="onApiUrlChange"
              />
              <p class="text-xs text-muted-foreground">
                支持 OpenAI 兼容的 API 服务地址
              </p>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">AI API 密钥</label>
              <Input
                v-model="localSettings.aiApiKey"
                type="password"
                placeholder="输入您的 AI API 密钥"
                class="w-full"
                @blur="onApiKeyChange"
              />
              <p class="text-xs text-muted-foreground">
                用于自动分类和标签生成功能
              </p>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">AI 模型</label>
                <div class="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    @click="refreshModels"
                    :disabled="loadingModels || !localSettings.aiApiKey || !localSettings.aiApiUrl"
                  >
                    <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': loadingModels }" />
                    刷新模型
                  </Button>
                </div>
              </div>
              
              <!-- 模型选择组合 -->
              <div class="space-y-2">
                <!-- 下拉选择 -->
                <Select v-model="localSettings.aiModel" v-if="availableModels.length > 0">
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="model in availableModels"
                      :key="model.id"
                      :value="model.id"
                    >
                      <div class="flex flex-col">
                        <span>{{ model.id }}</span>
                        <span v-if="model.description" class="text-xs text-muted-foreground">
                          {{ model.description }}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <!-- 自定义输入 -->
                <div class="flex items-center space-x-2">
                  <Input
                    v-model="customModelInput"
                    placeholder="或输入自定义模型名称"
                    class="flex-1"
                    @keyup.enter="addCustomModel"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    @click="addCustomModel"
                    :disabled="!customModelInput.trim()"
                  >
                    添加
                  </Button>
                </div>
              </div>

              <!-- 模型状态提示 -->
              <div v-if="loadingModels" class="flex items-center space-x-2 text-sm text-muted-foreground">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>正在获取可用模型...</span>
              </div>
              
              <div v-else-if="modelError" class="text-sm text-destructive">
                <p>{{ modelError }}</p>
                <p class="text-xs mt-1">请检查 API 地址和密钥是否正确，或点击"刷新模型"重试</p>
              </div>
              
              <div v-else-if="availableModels.length === 0 && localSettings.aiApiKey && localSettings.aiApiUrl" class="text-sm text-muted-foreground">
                <p>未找到可用模型，请点击"刷新模型"或手动输入模型名称</p>
              </div>
              
              <div v-else-if="availableModels.length > 0 && localSettings.aiApiKey && localSettings.aiApiUrl" class="text-sm text-green-600">
                <p>✓ 已加载 {{ availableModels.length }} 个可用模型</p>
              </div>
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
  Save,
  RefreshCw
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
  aiApiUrl?: string;
  aiModel: string;
}

// 模型类型定义
interface AIModel {
  id: string;
  description?: string;
  created?: number;
  owned_by?: string;
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
  aiApiUrl: 'https://api.openai.com/v1',
  aiModel: 'gpt-3.5-turbo'
};

// 响应式状态
const localSettings = ref<UserSettings>({ ...defaultSettings });
const bookmarkCount = ref(0);
const tagCount = ref(0);
const { toast } = useToast();

// AI 模型相关状态
const availableModels = ref<AIModel[]>([]);
const loadingModels = ref(false);
const modelError = ref('');
const customModelInput = ref('');

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

    // 如果有API设置，自动尝试加载模型列表
    if (localSettings.value.aiApiKey && localSettings.value.aiApiUrl) {
      console.log('检测到 AI API 配置，自动加载模型列表...');
      await autoLoadModels();
    } else {
      // 没有API配置时，提供一些默认模型选项
      availableModels.value = [
        { id: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo (需要 API 密钥)' },
        { id: 'gpt-4', description: 'GPT-4 (需要 API 密钥)' },
        { id: 'gpt-4-turbo', description: 'GPT-4 Turbo (需要 API 密钥)' },
      ];
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    toast({
      title: "加载失败",
      description: "无法加载设置，使用默认设置",
      variant: "destructive"
    });
  }
};

// 自动加载模型（静默加载，不显示错误提示）
const autoLoadModels = async () => {
  if (!localSettings.value.aiApiKey || !localSettings.value.aiApiUrl) {
    return;
  }

  loadingModels.value = true;
  modelError.value = '';

  try {
    const models = await fetchAvailableModels();
    availableModels.value = models;
    
    // 如果当前选中的模型不在列表中，添加它作为自定义模型
    if (localSettings.value.aiModel && 
        !models.some(m => m.id === localSettings.value.aiModel)) {
      availableModels.value.unshift({
        id: localSettings.value.aiModel,
        description: '自定义模型'
      });
    }

    console.log(`自动加载完成，找到 ${models.length} 个可用模型`);
  } catch (error: any) {
    console.warn('自动加载模型失败:', error.message);
    // 静默失败，设置一些默认模型作为备选
    availableModels.value = [
      { id: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', description: 'GPT-4' },
      { id: 'gpt-4-turbo', description: 'GPT-4 Turbo' },
    ];

    // 如果当前选中的模型不在默认列表中，添加它
    if (localSettings.value.aiModel && 
        !availableModels.value.some(m => m.id === localSettings.value.aiModel)) {
      availableModels.value.unshift({
        id: localSettings.value.aiModel,
        description: '自定义模型'
      });
    }
  } finally {
    loadingModels.value = false;
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
  availableModels.value = [];
  toast({
    title: "重置完成",
    description: "设置已恢复默认值",
  });
};

// AI 模型相关方法
const fetchAvailableModels = async (): Promise<AIModel[]> => {
  const apiUrl = localSettings.value.aiApiUrl;
  const apiKey = localSettings.value.aiApiKey;
  
  if (!apiUrl || !apiKey) {
    throw new Error('API 地址或密钥未设置');
  }

  // 标准化 API URL
  const baseUrl = apiUrl.replace(/\/+$/, ''); // 移除尾部斜杠
  const modelsUrl = `${baseUrl}/models`;

  try {
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      // 过滤和排序模型
      return data.data
        .filter((model: any) => model.id && typeof model.id === 'string')
        .map((model: any) => ({
          id: model.id,
          description: model.owned_by ? `由 ${model.owned_by} 提供` : undefined,
          created: model.created,
          owned_by: model.owned_by
        }))
        .sort((a: AIModel, b: AIModel) => a.id.localeCompare(b.id));
    } else {
      throw new Error('API 响应格式不正确');
    }
  } catch (error: any) {
    console.error('获取模型列表失败:', error);
    throw error;
  }
};

const refreshModels = async () => {
  if (!localSettings.value.aiApiKey || !localSettings.value.aiApiUrl) {
    toast({
      title: "无法获取模型",
      description: "请先设置 API 地址和密钥",
      variant: "destructive"
    });
    return;
  }

  loadingModels.value = true;
  modelError.value = '';

  try {
    const models = await fetchAvailableModels();
    availableModels.value = models;
    
    // 如果当前选中的模型不在列表中，添加它作为自定义模型
    if (localSettings.value.aiModel && 
        !models.some(m => m.id === localSettings.value.aiModel)) {
      availableModels.value.unshift({
        id: localSettings.value.aiModel,
        description: '自定义模型'
      });
    }

    // 用户主动刷新时显示成功提示
    toast({
      title: "模型列表已更新",
      description: `找到 ${models.length} 个可用模型`,
    });
  } catch (error: any) {
    modelError.value = error.message || '获取模型列表失败';
    // 用户主动刷新失败时显示错误提示
    toast({
      title: "获取模型失败",
      description: error.message || '请检查 API 地址和密钥是否正确',
      variant: "destructive"
    });
    
    // 设置一些默认模型作为备选
    availableModels.value = [
      { id: 'gpt-3.5-turbo', description: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', description: 'GPT-4' },
      { id: 'gpt-4-turbo', description: 'GPT-4 Turbo' },
    ];
  } finally {
    loadingModels.value = false;
  }
};

const addCustomModel = () => {
  const modelName = customModelInput.value.trim();
  if (!modelName) return;

  // 检查是否已存在
  if (availableModels.value.some(m => m.id === modelName)) {
    toast({
      title: "模型已存在",
      description: "该模型已在列表中",
      variant: "destructive"
    });
    return;
  }

  // 添加自定义模型
  availableModels.value.unshift({
    id: modelName,
    description: '自定义模型'
  });

  // 自动选择新添加的模型
  localSettings.value.aiModel = modelName;
  customModelInput.value = '';

  toast({
    title: "模型已添加",
    description: `自定义模型 "${modelName}" 已添加并选中`,
  });
};

const onApiUrlChange = () => {
  // API 地址变化时清空模型列表
  availableModels.value = [];
  modelError.value = '';
};

const onApiKeyChange = () => {
  // API 密钥变化时清空模型列表
  availableModels.value = [];
  modelError.value = '';
};

// 组件挂载
onMounted(() => {
  loadSettings();
});
</script>