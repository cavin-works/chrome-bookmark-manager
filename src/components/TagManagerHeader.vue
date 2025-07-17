<template>
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">标签管理</h1>
      <p class="text-muted-foreground mt-1">管理和组织您的书签标签</p>
    </div>
    <div class="flex items-center space-x-2">
      <Button 
        @click="handleDeduplicate" 
        variant="outline" 
        size="sm" 
        :disabled="!canDeduplicate || isDeduplicating"
        :title="isDeduplicating ? '正在处理中...' : '自动检测并合并重复标签'"
      >
        <RefreshCw :class="['w-4 h-4 mr-2', isDeduplicating ? 'animate-spin' : '']" />
        {{ isDeduplicating ? '去重中...' : '一键去重' }}
      </Button>
      
      <Button 
        @click="handleAIOrganize" 
        variant="outline" 
        :disabled="!canOrganize || untaggedCount === 0"
      >
        <Bot class="w-4 h-4 mr-2" />
        AI一键整理
      </Button>
      
      <Button 
        @click="handleAIGenerate" 
        variant="outline"
      >
        <Sparkles class="w-4 h-4 mr-2" />
        AI 生成标签
      </Button>
      
      <Button @click="handleCreateTag">
        <Plus class="w-4 h-4 mr-2" />
        新建标签
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import {
  Plus,
  RefreshCw,
  Sparkles,
  Bot
} from 'lucide-vue-next';

interface Props {
  canDeduplicate?: boolean;
  isDeduplicating?: boolean;
  canOrganize?: boolean;
  untaggedCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  canDeduplicate: true,
  isDeduplicating: false,
  canOrganize: true,
  untaggedCount: 0
});

const emit = defineEmits<{
  'deduplicate': [];
  'ai-organize': [];
  'ai-generate': [];
  'create-tag': [];
}>();

const handleDeduplicate = () => {
  emit('deduplicate');
};

const handleAIOrganize = () => {
  emit('ai-organize');
};

const handleAIGenerate = () => {
  emit('ai-generate');
};

const handleCreateTag = () => {
  emit('create-tag');
};
</script>