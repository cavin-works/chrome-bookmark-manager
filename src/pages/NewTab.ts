import { createApp } from 'vue';
import NewTab from './NewTab.vue';
import '../styles/newtab.css';
import '../styles/sidebar-override.css';

// 创建Vue应用
const app = createApp(NewTab);

// 挂载应用
app.mount('#app');