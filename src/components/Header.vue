<template>
  <header class="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 theme-transition">
    <div class="flex h-14 items-center justify-between px-4">
      <h1 class="text-lg font-semibold gradient-text transition-smooth">{{ title }}</h1>
      <div class="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('add-bookmark')"
          title="添加书签"
          class="hover-glow transition-smooth"
        >
          <Plus class="h-4 w-4 icon-theme-transition" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="handleThemeToggle"
          :title="currentTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          :class="cn('theme-toggle-feedback transition-smooth', {
            'dark': currentTheme === 'dark'
          })"
        >
          <Sun
            v-if="currentTheme === 'dark'"
            :class="cn('h-4 w-4 icon-sun icon-theme-transition')"
          />
          <Moon
            v-else
            :class="cn('h-4 w-4 icon-moon icon-theme-transition')"
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="$emit('show-settings')"
          title="设置"
          class="hover-glow transition-smooth"
        >
          <Settings class="h-4 w-4 icon-theme-transition" />
        </Button>
        <Select>
    <SelectTrigger class="w-[180px]">
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem value="apple">
          Apple
        </SelectItem>
        <SelectItem value="banana">
          Banana
        </SelectItem>
        <SelectItem value="blueberry">
          Blueberry
        </SelectItem>
        <SelectItem value="grapes">
          Grapes
        </SelectItem>
        <SelectItem value="pineapple">
          Pineapple
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Settings, Sun, Moon, Plus } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  title?: string;
  currentTheme?: 'light' | 'dark' | 'auto';
}

withDefaults(defineProps<Props>(), {
  title: 'Humi Bookmark Manager',
  currentTheme: 'auto'
});

const emit = defineEmits<{
  'toggle-theme': [];
  'show-settings': [];
  'add-bookmark': [];
}>();

const handleThemeToggle = () => {
  emit('toggle-theme');
};
</script>