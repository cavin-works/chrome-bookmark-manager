<template>
  <n-layout-header class="header" bordered>
    <n-space justify="space-between" align="center" class="header-content">
      <h1 class="title">{{ title }}</h1>
      <n-space>
        <n-button
          circle
          quaternary
          @click="$emit('toggle-theme')"
          :title="currentTheme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
        >
          <template #icon>
            <n-icon>
              <SunnyOutline v-if="currentTheme === 'dark'" />
              <MoonOutline v-else />
            </n-icon>
          </template>
        </n-button>
        <n-button circle quaternary @click="$emit('show-settings')" title="设置">
          <template #icon>
            <n-icon>
              <SettingsOutline />
            </n-icon>
          </template>
        </n-button>
      </n-space>
    </n-space>
  </n-layout-header>
</template>

<script setup lang="ts">
import { NLayoutHeader, NSpace, NButton, NIcon } from 'naive-ui';
import { SettingsOutline, SunnyOutline, MoonOutline } from '@vicons/ionicons5';

interface Props {
  title?: string;
  currentTheme?: 'light' | 'dark' | 'auto';
}

withDefaults(defineProps<Props>(), {
  title: 'Humi Bookmark Manager',
  currentTheme: 'auto'
});

defineEmits<{
  'toggle-theme': [];
  'show-settings': [];
}>();
</script>