<template>
  <div class="search-bar">
    <div class="search-section">
      <n-input
        :value="searchQuery"
        @update:value="$emit('update:search-query', $event)"
        placeholder="搜索标题、网址、描述、标签..."
        clearable
        size="large"
        class="search-input"
        @input="$emit('search-input')"
      >
        <template #prefix>
          <n-icon size="20" class="search-icon">
            <SearchOutline />
          </n-icon>
        </template>
      </n-input>
    </div>

    <div class="controls-section">
      <n-button-group size="large">
        <n-button
          :type="layout === 'grid' ? 'primary' : 'default'"
          @click="$emit('update:layout', 'grid')"
          title="网格视图"
        >
          <template #icon>
            <n-icon size="18">
              <GridOutline />
            </n-icon>
          </template>
        </n-button>
        <n-button
          :type="layout === 'list' ? 'primary' : 'default'"
          @click="$emit('update:layout', 'list')"
          title="列表视图"
        >
          <template #icon>
            <n-icon size="18">
              <ListOutline />
            </n-icon>
          </template>
        </n-button>
      </n-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NInput, NButtonGroup, NButton, NIcon } from 'naive-ui';
import { SearchOutline, GridOutline, ListOutline } from '@vicons/ionicons5';

interface Props {
  searchQuery: string;
  layout: 'grid' | 'list';
}

defineProps<Props>();

defineEmits<{
  'update:search-query': [value: string];
  'update:layout': [layout: 'grid' | 'list'];
  'search-input': [];
}>();
</script>