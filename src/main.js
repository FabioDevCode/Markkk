import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import 'vue3-toastify/dist/index.css';
import "./assets/css/style.css"
import "./assets/css/markdown.css"

library.add(fas, far, fab)

const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(pinia)
app.mount('#app')