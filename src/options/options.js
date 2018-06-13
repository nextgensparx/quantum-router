import Vue from 'vue';
import Options from './Options.vue';
import Buefy from 'buefy';
import i18n from '@/browser/i18n.js';
import store from '@/store';

Vue.config.productionTip = false;

Vue.use(Buefy, {
  defaultIconPack: 'fa',
});

Vue.mixin({
  methods: {
    $i18n: i18n.getMessage,
  },
  filters: {
    $i18n: i18n.getMessage,
  },
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  render: h => h(Options),
});

