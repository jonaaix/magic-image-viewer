import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

document.documentElement.lang = browser.i18n.getUILanguage();
createApp(App).mount('#app');
