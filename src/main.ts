import { createApp } from 'vue'
import { createPinia } from 'pinia';
import router from './router';
import './style.css'
import App from './App.vue'
import Clarity from '@microsoft/clarity';

if (import.meta.env.VITE_MODE === 'production') {
    Clarity.init(import.meta.env.VITE_CLARITY_PROJECT_ID);
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

if (typeof window.TON_CONNECT_UI === 'undefined' && !window.TON_CONNECT_UI?.TonConnectUI) {
    console.warn('TonConnect UI not found. Make sure the CDN is loaded correctly.');
}

app.mount('#app');