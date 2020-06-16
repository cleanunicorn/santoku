import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    count: 242,
  },
  mutations: {
    increment(state) {
      state.count += 1;
    },
  },
});

export default store;
