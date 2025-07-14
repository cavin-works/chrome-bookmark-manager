<template>
  <div class="p-6 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">标签管理</h1>
        <p class="text-muted-foreground mt-1">管理和组织您的书签标签</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="deduplicateTags" variant="outline" size="sm" :disabled="allTags.length === 0">
          <RefreshCw class="w-4 h-4 mr-2" />
          去重标签
        </Button>
        <Button @click="showAIOrganize = true" variant="outline" :disabled="untaggedBookmarksCount === 0">
          <Bot class="w-4 h-4 mr-2" />
          AI一键整理
        </Button>
        <Button @click="showAIGenerate = true" variant="outline">
          <Sparkles class="w-4 h-4 mr-2" />
          AI 生成标签
        </Button>
        <Button @click="showCreateTag = true">
          <Plus class="w-4 h-4 mr-2" />
          新建标签
        </Button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <Tags class="w-5 h-5 text-primary" />
            <div>
              <p class="text-sm font-medium">总标签数</p>
              <p class="text-2xl font-bold">{{ allTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <BookmarkIcon class="w-5 h-5 text-blue-500" />
            <div>
              <p class="text-sm font-medium">已标记书签</p>
              <p class="text-2xl font-bold">{{ taggedBookmarksCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <BookmarkIcon class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-sm font-medium">未标签书签</p>
              <p class="text-2xl font-bold">{{ untaggedBookmarksCount }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <TrendingUp class="w-5 h-5 text-green-500" />
            <div>
              <p class="text-sm font-medium">常用标签</p>
              <p class="text-2xl font-bold">{{ popularTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center space-x-2">
            <AlertTriangle class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-sm font-medium">未使用标签</p>
              <p class="text-2xl font-bold">{{ unusedTags.length }}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 搜索和过滤 -->
    <div v-if="allTags.length > 0" class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <Input
          v-model="searchQuery"
          placeholder="搜索标签..."
          class="w-full"
        >
          <template #prefix>
            <Search class="w-4 h-4" />
          </template>
        </Input>
      </div>
      <Select v-model="sortBy">
        <SelectTrigger class="w-48">
          <SelectValue placeholder="排序方式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">按名称</SelectItem>
          <SelectItem value="usage">按使用次数</SelectItem>
          <SelectItem value="created">按创建时间</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- 标签列表 -->
    <div v-if="!showTagBookmarks" class="space-y-4">
      <!-- 空状态 - 没有标签时显示 -->
      <div v-if="allTags.length === 0" class="text-center py-12">
        <div class="max-w-md mx-auto">
          <Tags class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">还没有创建标签</h3>
          <p class="text-gray-500 mb-6">
            标签可以帮助您更好地组织和管理书签。可以试试 AI 自动生成哦~~
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <Button @click="showAIGenerate = true" class="flex items-center">
              <Sparkles class="w-4 h-4 mr-2" />
              AI 智能生成标签
            </Button>
            <Button variant="outline" @click="showCreateTag = true" class="flex items-center">
              <Plus class="w-4 h-4 mr-2" />
              手动创建标签
            </Button>
          </div>
        </div>
      </div>

      <!-- 有标签时显示标签列表 -->
      <template v-else>
        <!-- 常用标签 -->
        <div v-if="popularTags.length > 0">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Star class="w-5 h-5 mr-2 text-yellow-500" />
            常用标签
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TagCard
              v-for="tag in popularTags"
              :key="tag.name"
              :tag="tag"
              @edit="editTag"
              @delete="deleteTag"
              @select="selectTag"
            />
          </div>
        </div>

        <!-- 所有标签 -->
        <div>
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <Tags class="w-5 h-5 mr-2" />
            所有标签 ({{ filteredTags.length }})
          </h3>
          <div v-if="filteredTags.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TagCard
              v-for="tag in filteredTags"
              :key="tag.name"
              :tag="tag"
              @edit="editTag"
              @delete="deleteTag"
              @select="selectTag"
            />
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-500">没有找到匹配的标签</p>
            <p class="text-sm text-gray-400 mt-1">尝试调整搜索条件或创建新标签</p>
          </div>
        </div>

        <!-- 未使用标签 -->
        <div v-if="unusedTags.length > 0">
          <h3 class="text-lg font-semibold mb-3 flex items-center text-orange-600">
            <AlertTriangle class="w-5 h-5 mr-2" />
            未使用标签
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TagCard
              v-for="tag in unusedTags"
              :key="tag.name"
              :tag="tag"
              variant="warning"
              @edit="editTag"
              @delete="deleteTag"
              @select="selectTag"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 创建标签对话框 -->
    <Dialog :open="showCreateTag" @update:open="showCreateTag = $event">
      <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>创建新标签</DialogTitle>
          <DialogDescription>
            为您的书签创建一个新的标签分类
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">标签名称</label>
              <Input
                v-model="newTagName"
                placeholder="输入标签名称"
                @keyup.enter="createTag"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">颜色</label>
              <div class="grid grid-cols-6 gap-2">
                <button
                  v-for="color in tagColors"
                  :key="color"
                  :class="cn(
                    'w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform',
                    newTagColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  )"
                  :style="{ backgroundColor: color }"
                  @click="newTagColor = color"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">描述（可选）</label>
              <Input
                v-model="newTagDescription"
                placeholder="标签描述"
                class="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="flex-shrink-0">
          <Button variant="outline" @click="showCreateTag = false">取消</Button>
          <Button @click="createTag" :disabled="!newTagName.trim()">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 编辑标签对话框 -->
    <Dialog :open="showEditTag" @update:open="showEditTag = $event">
      <DialogContent class="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle>编辑标签</DialogTitle>
          <DialogDescription>
            修改标签的名称、颜色和描述
          </DialogDescription>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4" v-if="editingTag">
            <div class="space-y-2">
              <label class="text-sm font-medium">标签名称</label>
              <Input
                v-model="editingTag.name"
                placeholder="输入标签名称"
                class="w-full"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">颜色</label>
              <div class="grid grid-cols-6 gap-2">
                <button
                  v-for="color in tagColors"
                  :key="color"
                  :class="cn(
                    'w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform',
                    editingTag.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
                  )"
                  :style="{ backgroundColor: color }"
                  @click="editingTag.color = color"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">描述</label>
              <Input
                v-model="editingTag.description"
                placeholder="标签描述"
                class="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter class="flex-shrink-0">
          <Button variant="outline" @click="showEditTag = false">取消</Button>
          <Button @click="saveTag">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- AI 生成标签对话框 -->
    <Dialog :open="showAIGenerate" @update:open="showAIGenerate = $event">
      <DialogContent class="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="flex items-center">
            <Sparkles class="w-5 h-5 mr-2" />
            AI 智能生成标签
          </DialogTitle>
          <DialogDescription>
            基于您现有的书签，AI 将为您推荐合适的标签。您可以选择需要的标签并继续生成更多选项。
            <br>
            <span class="text-sm text-muted-foreground">
              当前可分析书签数量: {{ props.bookmarks.length }} 个
            </span>
          </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4">
            <!-- AI 状态显示 -->
            <div v-if="aiGenerating" class="flex items-center justify-center py-8">
              <div class="flex items-center space-x-2 text-primary">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>AI 正在分析您的书签并生成标签...</span>
              </div>
            </div>

            <!-- 推荐标签列表 -->
            <div v-else-if="recommendedTags.length > 0" class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium">推荐的标签 ({{ recommendedTags.length }})</h3>
                <div class="flex items-center space-x-2">
                  <Button
                    @click="selectAllRecommended"
                    variant="outline"
                    size="sm"
                  >
                    全选
                  </Button>
                  <Button
                    @click="clearAllRecommended"
                    variant="outline"
                    size="sm"
                  >
                    清空
                  </Button>
                  <Button
                    @click="regenerateAITags"
                    variant="outline"
                    size="sm"
                    :disabled="aiGenerating"
                  >
                    <RefreshCw class="w-3 h-3 mr-1" />
                    换一批
                  </Button>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <label
                  v-for="tag in recommendedTags"
                  :key="tag"
                  class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  :class="{
                    'bg-primary/10 border-primary': selectedRecommendedTags.includes(tag),
                    'border-gray-200': !selectedRecommendedTags.includes(tag)
                  }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedRecommendedTags.includes(tag)"
                    @change="toggleRecommendedTag(tag)"
                    class="rounded"
                  />
                  <span class="text-sm font-medium">{{ tag }}</span>
                </label>
              </div>

              <div v-if="selectedRecommendedTags.length > 0" class="p-3 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-700 mb-2">
                  已选择 {{ selectedRecommendedTags.length }} 个标签:
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in selectedRecommendedTags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                  >
                    {{ tag }}
                    <button
                      @click="removeSelectedTag(tag)"
                      class="ml-1 hover:text-blue-600"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <!-- AI 配置错误状态 -->
            <div v-else-if="aiConfigError" class="text-center py-8">
              <div class="max-w-md mx-auto">
                <AlertTriangle class="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">AI 配置不完整</h3>
                <p class="text-gray-500 mb-4">
                  {{ aiConfigError }}
                </p>
                <div class="space-y-2">
                  <Button @click="router.push('/settings')" variant="outline" class="w-full">
                    <Settings class="w-4 h-4 mr-2" />
                    前往设置页面
                  </Button>
                  <Button @click="retryAIGeneration" variant="ghost" size="sm">
                    重新检查配置
                  </Button>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!aiGenerating" class="text-center py-8">
              <Sparkles class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">开始生成标签</h3>
              <p class="text-gray-500 mb-2">
                点击下方按钮，AI 将分析您的书签并推荐合适的标签
              </p>
              <p class="text-sm text-muted-foreground">
                可分析书签数量: {{ props.bookmarks.length }} 个
                {{ props.bookmarks.length === 0 ? '（暂无书签数据）' : '' }}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter class="flex-shrink-0">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-2">
              <Button
                @click="generateAITags"
                variant="outline"
                :disabled="aiGenerating || props.bookmarks.length === 0"
              >
                <Sparkles class="w-4 h-4 mr-2" />
                {{ recommendedTags.length > 0 ? '重新生成' : '开始生成' }}
              </Button>
            </div>
            <div class="flex items-center space-x-2">
              <Button variant="outline" @click="showAIGenerate = false">
                取消
              </Button>
              <Button
                @click="confirmAITags"
                :disabled="selectedRecommendedTags.length === 0"
              >
                创建选中标签 ({{ selectedRecommendedTags.length }})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 标签书签展示区域 -->
    <div v-if="showTagBookmarks" class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold flex items-center">
            <Tags class="w-5 h-5 mr-2" />
            "{{ selectedTag }}" 标签的书签
          </h2>
          <p class="text-sm text-muted-foreground">
            共 {{ filteredBookmarks.length }} 个书签使用了此标签
          </p>
        </div>
        <Button @click="clearTagSelection" variant="outline" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          返回标签管理
        </Button>
      </div>

      <div v-if="filteredBookmarks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="bookmark in filteredBookmarks"
          :key="bookmark.id"
          class="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-sm truncate">{{ bookmark.title }}</h3>
              <p class="text-xs text-muted-foreground truncate mt-1">{{ bookmark.url }}</p>
              <div v-if="bookmark.tags" class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="tag in bookmark.tags"
                  :key="tag"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <div class="max-w-md mx-auto">
          <BookmarkIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">没有找到书签</h3>
          <p class="text-gray-500">
            此标签下暂无书签，或书签已被删除。
          </p>
          <Button @click="clearTagSelection" variant="outline" class="mt-4">
            返回标签管理
          </Button>
        </div>
      </div>
    </div>

    <!-- AI 一键整理对话框 -->
    <Dialog :open="showAIOrganize" @update:open="showAIOrganize = $event">
      <DialogContent class="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader class="flex-shrink-0">
          <DialogTitle class="flex items-center">
            <Bot class="w-5 h-5 mr-2" />
            AI 一键整理书签
          </DialogTitle>
          <DialogDescription>
            AI 将自动为您的书签分配合适的标签，优先使用现有标签，必要时推荐新标签。
            <br>
            <span class="text-sm text-muted-foreground">
              待整理书签数量: {{ untaggedBookmarksCount }} 个 | 现有标签数量: {{ allTags.length }} 个
            </span>
            <br>
            <span v-if="props.bookmarks.length > 30" class="text-xs text-orange-600">
              💡 检测到大量书签，将自动分批处理以确保整理质量
            </span>
          </DialogDescription>
        </DialogHeader>

        <div class="flex-1 overflow-y-auto">
          <div class="space-y-4 py-4">
            <!-- AI 整理状态显示 -->
            <div v-if="aiOrganizing" class="space-y-4">
              <!-- 进度显示 -->
              <div class="text-center py-4">
                <div class="flex items-center justify-center space-x-2 text-primary mb-4">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>{{ organizeProgress.message }}</span>
                </div>

                <!-- 进度条 -->
                <div v-if="organizeProgress.total > 0" class="space-y-2">
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      class="bg-primary h-2 rounded-full transition-all duration-300"
                      :style="{ width: `${(organizeProgress.processed / organizeProgress.total) * 100}%` }"
                    ></div>
                  </div>
                  <div class="text-sm text-muted-foreground">
                    {{ organizeProgress.processed }} / {{ organizeProgress.total }} 个书签
                    <span v-if="organizeProgress.currentBatch > 0">
                      (第 {{ organizeProgress.currentBatch }} 批)
                    </span>
                  </div>
                </div>

                <!-- 批处理信息 -->
                <div v-if="organizeProgress.totalBatches > 1" class="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p class="text-sm text-blue-700">
                    检测到大量书签({{ organizeProgress.total }}个)，正在分批处理以确保质量
                  </p>
                  <p class="text-xs text-blue-600 mt-1">
                    每批处理 {{ organizeProgress.batchSize }} 个书签，共 {{ organizeProgress.totalBatches }} 批
                  </p>
                </div>
              </div>
            </div>

            <!-- AI 配置错误状态 -->
            <div v-else-if="organizeConfigError" class="text-center py-8">
              <div class="max-w-md mx-auto">
                <AlertTriangle class="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 mb-2">AI 配置不完整</h3>
                <p class="text-gray-500 mb-4">
                  {{ organizeConfigError }}
                </p>
                <div class="space-y-2">
                  <Button @click="router.push('/settings')" variant="outline" class="w-full">
                    <Settings class="w-4 h-4 mr-2" />
                    前往设置页面
                  </Button>
                  <Button @click="retryAIOrganize" variant="ghost" size="sm">
                    重新检查配置
                  </Button>
                </div>
              </div>
            </div>

            <!-- 整理结果显示 -->
            <div v-else-if="organizeResult" class="space-y-6">
              <!-- 新标签推荐 -->
              <div v-if="organizeResult.newTags.length > 0" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 class="text-sm font-medium text-blue-900 mb-3 flex items-center">
                  <Plus class="w-4 h-4 mr-2" />
                  推荐新增标签 ({{ organizeResult.newTags.length }} 个)
                </h3>
                <div class="flex flex-wrap gap-2 mb-3">
                  <span
                    v-for="tag in organizeResult.newTags"
                    :key="tag"
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300"
                  >
                    {{ tag }}
                  </span>
                </div>
                <p class="text-xs text-blue-700">
                  这些标签将在确认整理后自动创建
                </p>
              </div>

              <!-- 书签标签分配预览 -->
              <div>
                <h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <Tags class="w-4 h-4 mr-2" />
                  标签分配预览 ({{ Object.keys(organizeResult.assignments).length }} 个书签)
                </h3>
                <div class="max-h-60 overflow-y-auto space-y-2">
                  <div
                    v-for="(tags, bookmarkId) in organizeResult.assignments"
                    :key="bookmarkId"
                    class="p-3 bg-gray-50 rounded-lg border"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 truncate">
                          {{ getBookmarkById(String(bookmarkId))?.title || '未知书签' }}
                        </p>
                        <p class="text-xs text-gray-500 truncate mt-1">
                          {{ getBookmarkById(String(bookmarkId))?.url || '' }}
                        </p>
                      </div>
                      <div class="flex flex-wrap gap-1 ml-3">
                        <span
                          v-for="tag in tags"
                          :key="tag"
                          class="inline-flex items-center px-2 py-1 rounded-full text-xs"
                          :class="allTags.some(t => t.name === tag)
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-orange-100 text-orange-800 border border-orange-300'"
                        >
                          {{ tag }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="grid grid-cols-2 gap-4 text-center">
                <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div class="text-2xl font-bold text-green-600">{{ Object.keys(organizeResult.assignments).length }}</div>
                  <div class="text-sm text-green-700">将被分配标签的书签</div>
                </div>
                <div class="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="text-2xl font-bold text-blue-600">{{ organizeResult.newTags.length }}</div>
                  <div class="text-sm text-blue-700">推荐新增的标签</div>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="!aiOrganizing" class="text-center py-8">
              <Bot class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 class="text-lg font-medium text-gray-900 mb-2">开始智能整理</h3>
              <p class="text-gray-500 mb-2">
                AI 将分析您的书签内容，自动分配合适的标签
              </p>
              <p class="text-sm text-muted-foreground">
                待整理书签: {{ untaggedBookmarksCount }} 个
                {{ untaggedBookmarksCount === 0 ? '（暂无未标签书签）' : '' }}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter class="flex-shrink-0">
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-2">
              <Button
                @click="startAIOrganize"
                variant="outline"
                :disabled="aiOrganizing || untaggedBookmarksCount === 0"
              >
                <Bot class="w-4 h-4 mr-2" />
                {{ organizeResult ? '重新分析' : '开始整理' }}
              </Button>
            </div>
            <div class="flex items-center space-x-2">
              <Button variant="outline" @click="showAIOrganize = false">
                取消
              </Button>
              <Button
                @click="confirmAIOrganize"
                :disabled="!organizeResult || Object.keys(organizeResult.assignments).length === 0"
              >
                确认整理 ({{ organizeResult ? Object.keys(organizeResult.assignments).length : 0 }} 个书签)
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, withDefaults } from 'vue';
import { useRouter } from 'vue-router';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Plus,
  Tags,
  Bookmark as BookmarkIcon,
  TrendingUp,
  AlertTriangle,
  Search,
  Star,
  Sparkles,
  RefreshCw,
  X,
  Settings,
  Bot,
  ArrowLeft
} from 'lucide-vue-next';
import TagCard from '@/components/TagCard.vue';
import { aiService } from '@/services/aiService';
import { tagStorageService, type Tag } from '@/services/tagStorageService';
import type { Bookmark } from '@/utils/types';

// Props 定义
interface Props {
  bookmarks?: Bookmark[];
}

const props = withDefaults(defineProps<Props>(), {
  bookmarks: () => []
});

// 路由
const router = useRouter();

// 响应式状态
const searchQuery = ref('');
const sortBy = ref('usage');
const showCreateTag = ref(false);
const showEditTag = ref(false);
const showAIGenerate = ref(false);
const showAIOrganize = ref(false);
const editingTag = ref<Tag | null>(null);
const selectedTag = ref<string | null>(null);
const showTagBookmarks = ref(false);

// 新标签创建
const newTagName = ref('');
const newTagColor = ref('#3b82f6');
const newTagDescription = ref('');

// AI 生成标签相关状态
const aiGenerating = ref(false);
const recommendedTags = ref<string[]>([]);
const selectedRecommendedTags = ref<string[]>([]);
const aiConfigError = ref('');

// AI 整理书签相关状态
const aiOrganizing = ref(false);
const organizeResult = ref<{
  assignments: { [bookmarkId: string]: string[] };
  newTags: string[];
} | null>(null);
const organizeConfigError = ref('');

// AI 整理进度状态
const organizeProgress = ref({
  processed: 0,
  total: 0,
  currentBatch: 0,
  totalBatches: 0,
  batchSize: 30,
  message: 'AI 正在分析书签并分配标签...'
});

// 标签颜色选项
const tagColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// 标签数据（从 props 获取或初始化为空数组）
const allTags = ref<Tag[]>([]);

// 计算属性
const taggedBookmarksCount = computed(() => {
  return allTags.value.reduce((total, tag) => total + tag.usage, 0);
});

const untaggedBookmarksCount = computed(() => {
  return props.bookmarks.filter(bookmark => !bookmark.tags || bookmark.tags.length === 0).length;
});

const popularTags = computed(() => {
  return allTags.value.filter(tag => tag.usage >= 10).sort((a, b) => b.usage - a.usage);
});

const unusedTags = computed(() => {
  return allTags.value.filter(tag => tag.usage === 0);
});

const filteredTags = computed(() => {
  let result = allTags.value;

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(tag =>
      tag.name.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query)
    );
  }

  // 排序
  switch (sortBy.value) {
    case 'name':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'usage':
      result.sort((a, b) => b.usage - a.usage);
      break;
    case 'created':
      result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  return result;
});

// 标签操作方法
const createTag = async () => {
  if (!newTagName.value.trim()) return;

  try {
    const newTag = await tagStorageService.saveTag({
      name: newTagName.value.trim(),
      color: newTagColor.value,
      description: newTagDescription.value.trim() || undefined,
      usage: 0,
      createdAt: new Date()
    });

    allTags.value.push(newTag);

    // 重置表单
    newTagName.value = '';
    newTagColor.value = '#3b82f6';
    newTagDescription.value = '';
    showCreateTag.value = false;

    console.log('标签创建成功:', newTag);
  } catch (error: any) {
    console.error('创建标签失败:', error);
    // 这里可以添加错误提示
  }
};

const editTag = (tag: Tag) => {
  editingTag.value = { ...tag };
  showEditTag.value = true;
};

const saveTag = async () => {
  if (!editingTag.value) return;

  try {
    const updatedTag = await tagStorageService.updateTag(editingTag.value.id, {
      name: editingTag.value.name,
      color: editingTag.value.color,
      description: editingTag.value.description
    });

    const index = allTags.value.findIndex(tag => tag.id === editingTag.value?.id);
    if (index !== -1) {
      allTags.value[index] = updatedTag;
    }

    showEditTag.value = false;
    editingTag.value = null;

    console.log('标签更新成功:', updatedTag);
  } catch (error: any) {
    console.error('更新标签失败:', error);
    // 这里可以添加错误提示
  }
};

const deleteTag = async (tag: Tag) => {
  try {
    await tagStorageService.deleteTag(tag.id);

    const index = allTags.value.findIndex(t => t.id === tag.id);
    if (index !== -1) {
      allTags.value.splice(index, 1);
    }

    console.log('标签删除成功:', tag.name);
  } catch (error: any) {
    console.error('删除标签失败:', error);
    // 这里可以添加错误提示
  }
};

// AI 生成标签相关方法
const generateAITags = async () => {
  aiGenerating.value = true;
  recommendedTags.value = [];
  selectedRecommendedTags.value = [];
  aiConfigError.value = '';

  try {
    // 使用传入的书签数据
    const bookmarkData = props.bookmarks;

    if (bookmarkData.length === 0) {
      throw new Error('没有可用的书签数据');
    }

    // 获取 AI 设置
    const aiSettings = await loadAISettings();

    // 检查 AI 配置是否完整
    if (!aiSettings.aiApiKey || !aiSettings.aiApiUrl) {
      aiConfigError.value = 'AI 配置不完整，请在设置页面配置 API 地址和密钥';
      return;
    }

    // 配置 AI 服务
    aiService.setApiKey(aiSettings.aiApiKey);
    aiService.setBaseUrl(aiSettings.aiApiUrl);
    aiService.setModel(aiSettings.aiModel);

    // 获取现有标签名称，避免重复
    const existingTagNames = allTags.value.map(tag => tag.name);

    // 调用 AI 服务生成标签
    const generated = await aiService.generateTagsFromBookmarks(bookmarkData, existingTagNames);
    recommendedTags.value = generated;
  } catch (error: any) {
    console.error('AI 生成标签失败:', error);

    // 根据错误类型提供不同的处理
    if (error.message.includes('没有可用的书签数据')) {
      aiConfigError.value = '暂无书签数据可供分析';
    } else if (error.message.includes('API密钥未设置') || error.message.includes('AI 配置不完整')) {
      aiConfigError.value = '请先在设置页面配置 AI API 地址和密钥';
    } else if (error.message.includes('API请求失败')) {
      aiConfigError.value = 'AI 服务连接失败，请检查网络连接和 API 配置';
    } else {
      // 其他错误：提供默认推荐
      const defaultRecommendations = ['工具', '学习', '开发', '设计', '文档', '资源', '社区', '新闻'];
      const existingTagNames = allTags.value.map(tag => tag.name);
      recommendedTags.value = defaultRecommendations.filter(tag => !existingTagNames.includes(tag));
    }
  } finally {
    aiGenerating.value = false;
  }
};

// 加载 AI 设置
const loadAISettings = async () => {
  try {
    // 从本地存储加载设置（实际项目中应该从 chrome.storage 或其他存储服务获取）
    const stored = localStorage.getItem('humi-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        aiApiKey: settings.aiApiKey || '',
        aiApiUrl: settings.aiApiUrl || 'https://api.openai.com/v1',
        aiModel: settings.aiModel || 'gpt-3.5-turbo'
      };
    }

    // 返回默认配置
    return {
      aiApiKey: '',
      aiApiUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-3.5-turbo'
    };
  } catch (error) {
    console.error('加载 AI 设置失败:', error);
    return {
      aiApiKey: '',
      aiApiUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-3.5-turbo'
    };
  }
};

const regenerateAITags = async () => {
  await generateAITags();
};

const retryAIGeneration = async () => {
  aiConfigError.value = '';
  await generateAITags();
};

// 根据ID获取书签
const getBookmarkById = (id: string) => {
  return props.bookmarks.find(bookmark => bookmark.id === id);
};

// AI 整理书签相关方法
const startAIOrganize = async () => {
  aiOrganizing.value = true;
  organizeResult.value = null;
  organizeConfigError.value = '';

  // 初始化进度状态
  organizeProgress.value = {
    processed: 0,
    total: props.bookmarks.length,
    currentBatch: 0,
    totalBatches: Math.ceil(props.bookmarks.length / 30), // 假设每批30个
    batchSize: 30,
    message: '正在初始化AI整理...'
  };

  try {
    // 使用传入的书签数据
    const bookmarkData = props.bookmarks;

    if (bookmarkData.length === 0) {
      throw new Error('没有可用的书签数据');
    }

    // 获取 AI 设置
    const aiSettings = await loadAISettings();

    // 检查 AI 配置是否完整
    if (!aiSettings.aiApiKey || !aiSettings.aiApiUrl) {
      organizeConfigError.value = 'AI 配置不完整，请在设置页面配置 API 地址和密钥';
      return;
    }

    // 配置 AI 服务
    aiService.setApiKey(aiSettings.aiApiKey);
    aiService.setBaseUrl(aiSettings.aiApiUrl);
    aiService.setModel(aiSettings.aiModel);

    // 获取现有标签名称
    const existingTagNames = allTags.value.map(tag => tag.name);

    // 动态计算批次大小，确保不会因为书签过多而出错
    const batchSize = bookmarkData.length > 100 ? 25 : 30;
    const totalBatches = Math.ceil(bookmarkData.length / batchSize);

    // 更新进度信息
    organizeProgress.value.batchSize = batchSize;
    organizeProgress.value.totalBatches = totalBatches;
    organizeProgress.value.message = totalBatches > 1
      ? `准备分批处理 ${bookmarkData.length} 个书签...`
      : '正在分析书签内容...';

    // 调用AI服务整理书签，传入进度回调
    const result = await aiService.organizeBookmarksWithTags(
      bookmarkData,
      existingTagNames,
      {
        batchSize,
        onProgress: (processed: number, total: number, currentBatch: number) => {
          organizeProgress.value.processed = processed;
          organizeProgress.value.total = total;
          organizeProgress.value.currentBatch = currentBatch;

          if (totalBatches > 1) {
            organizeProgress.value.message = `正在处理第 ${currentBatch}/${totalBatches} 批书签...`;
          } else {
            organizeProgress.value.message = '正在分析书签并生成标签建议...';
          }
        }
      }
    );

    // 进度完成
    organizeProgress.value.message = '分析完成，正在生成整理预览...';

    // 预处理结果：确保所有推荐的标签都不与现有标签重复
    const filteredNewTags = result.newTags.filter(tagName =>
      !existingTagNames.includes(tagName)
    );

    organizeResult.value = {
      assignments: result.assignments,
      newTags: filteredNewTags
    };

    organizeProgress.value.message = `整理完成！为 ${Object.keys(result.assignments).length} 个书签分配了标签`;

  } catch (error: any) {
    console.error('AI 整理书签失败:', error);

    // 根据错误类型提供不同的处理
    if (error.message.includes('没有可用的书签数据')) {
      organizeConfigError.value = '暂无书签数据可供整理';
    } else if (error.message.includes('API密钥未设置') || error.message.includes('AI 配置不完整')) {
      organizeConfigError.value = '请先在设置页面配置 AI API 地址和密钥';
    } else if (error.message.includes('API请求失败')) {
      organizeConfigError.value = 'AI 服务连接失败，请检查网络连接和 API 配置';
    } else {
      organizeConfigError.value = `整理失败: ${error.message}`;
    }
  } finally {
    aiOrganizing.value = false;
  }
};

const retryAIOrganize = async () => {
  organizeConfigError.value = '';
  await startAIOrganize();
};

const confirmAIOrganize = async () => {
  if (!organizeResult.value) return;

  try {
    const result = organizeResult.value; // 保存引用避免null检查问题

    // 显示应用进度
    organizeProgress.value.message = '正在应用整理结果...';
    organizeProgress.value.processed = 0;
    organizeProgress.value.total = Object.keys(result.assignments).length + result.newTags.length;

    // 1. 创建新推荐的标签并保存到存储
    organizeProgress.value.message = '正在创建新标签...';
    const tagCreationResult = await tagStorageService.createTagsBatch(result.newTags);

    // 更新本地状态
    allTags.value.push(...tagCreationResult.created);

    // 记录跳过的重复标签
    if (tagCreationResult.skipped.length > 0) {
      console.log(`跳过了 ${tagCreationResult.skipped.length} 个重复标签: ${tagCreationResult.skipped.join(', ')}`);
    }

    // 2. 创建标签名称到ID的映射
    const tagNameToId = new Map<string, string>();
    allTags.value.forEach(tag => {
      tagNameToId.set(tag.name, tag.id);
    });

    // 3. 转换分配结果为标签ID格式
    const assignmentsWithIds: { [bookmarkId: string]: string[] } = {};
    Object.entries(result.assignments).forEach(([bookmarkId, tagNames]) => {
      const tagIds = tagNames
        .map(tagName => tagNameToId.get(tagName))
        .filter((tagId): tagId is string => tagId !== undefined);

      if (tagIds.length > 0) {
        assignmentsWithIds[bookmarkId] = tagIds;
      }
    });

    // 4. 批量分配标签到书签
    organizeProgress.value.message = '正在应用标签分配...';
    await tagStorageService.batchAssignTags(assignmentsWithIds);

    // 5. 重新加载标签数据以更新使用计数
    organizeProgress.value.message = '正在更新标签统计...';
    await loadTags();

    // 6. 记录统计信息
    const totalAssigned = Object.keys(result.assignments).length;
    const newTagsCount = tagCreationResult.created.length;
    const skippedTagsCount = tagCreationResult.skipped.length;

    // 7. 重置状态
    showAIOrganize.value = false;
    organizeResult.value = null;
    organizeConfigError.value = '';

    // 显示成功消息
    let message = `🎉 整理完成！为 ${totalAssigned} 个书签分配了标签`;
    if (newTagsCount > 0) {
      message += `，新增了 ${newTagsCount} 个标签`;
    }
    if (skippedTagsCount > 0) {
      message += `，跳过了 ${skippedTagsCount} 个重复标签`;
    }

    organizeProgress.value.message = message;

    console.log(`AI 整理完成：为 ${totalAssigned} 个书签分配了标签，新增了 ${newTagsCount} 个标签，跳过了 ${skippedTagsCount} 个重复标签`);

    // 可以添加toast通知或其他用户反馈
    // toast.success(`整理完成！为 ${totalAssigned} 个书签分配了标签`);

  } catch (error) {
    console.error('确认整理失败:', error);
    organizeConfigError.value = '应用整理结果失败，请重试';
    organizeProgress.value.message = '应用整理结果时出现错误';
  }
};

const toggleRecommendedTag = (tag: string) => {
  const index = selectedRecommendedTags.value.indexOf(tag);
  if (index > -1) {
    selectedRecommendedTags.value.splice(index, 1);
  } else {
    selectedRecommendedTags.value.push(tag);
  }
};

const selectAllRecommended = () => {
  selectedRecommendedTags.value = [...recommendedTags.value];
};

const clearAllRecommended = () => {
  selectedRecommendedTags.value = [];
};

const removeSelectedTag = (tag: string) => {
  const index = selectedRecommendedTags.value.indexOf(tag);
  if (index > -1) {
    selectedRecommendedTags.value.splice(index, 1);
  }
};

const confirmAITags = async () => {
  try {
    // 使用批量创建方法（带去重）
    const result = await tagStorageService.createTagsBatch(selectedRecommendedTags.value);

    // 添加到本地状态
    allTags.value.push(...result.created);

    // 重置状态
    showAIGenerate.value = false;
    recommendedTags.value = [];
    selectedRecommendedTags.value = [];

    // 显示结果反馈
    if (result.created.length > 0) {
      console.log(`成功创建了 ${result.created.length} 个标签`);
    }

    if (result.skipped.length > 0) {
      console.log(`跳过了 ${result.skipped.length} 个重复标签: ${result.skipped.join(', ')}`);
    }

  } catch (error: any) {
    console.error('创建AI推荐标签失败:', error);
    // 这里可以添加错误提示
  }
};

// 去重标签
const deduplicateTags = async () => {
  try {
    const result = await tagStorageService.deduplicateTags();

    // 重新加载标签数据
    await loadTags();

    // 显示结果
    if (result.removedCount > 0 || result.mergedRelations > 0) {
      console.log(`去重完成！删除了 ${result.removedCount} 个重复标签，合并了 ${result.mergedRelations} 个重复关系`);
    } else {
      console.log('没有发现重复标签');
    }
  } catch (error) {
    console.error('去重标签失败:', error);
  }
};

// 标签操作方法
const selectTag = (tag: Tag) => {
  selectedTag.value = tag.name;
  showTagBookmarks.value = true;
};

const clearTagSelection = () => {
  selectedTag.value = null;
  showTagBookmarks.value = false;
};

// 计算属性 - 筛选后的书签
const filteredBookmarks = computed(() => {
  const tagName = selectedTag.value;
  if (!tagName) return [];
  return props.bookmarks.filter(bookmark =>
    bookmark.tags && bookmark.tags.includes(tagName)
  );
});

// 加载标签数据
const loadTags = async () => {
  try {
    const tags = await tagStorageService.getAllTags();
    allTags.value = tags;
    console.log(`加载了 ${tags.length} 个标签`);
  } catch (error) {
    console.error('加载标签失败:', error);
    allTags.value = [];
  }
};

onMounted(async () => {
  // 组件挂载时加载标签数据
  console.log('标签管理页面已加载');
  await loadTags();
});
</script>