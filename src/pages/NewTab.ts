import { createApp } from 'vue';
import NewTab from './NewTab.vue';
import '../styles/index.css';

// 创建Vue应用
const app = createApp(NewTab);

// 挂载应用
app.mount('#app');