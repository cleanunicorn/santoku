<template>
  <div class="container">
    <ABIDecoder/>
  </div>
</template>

<script>
// @ is an alias to /src
import ABIDecoder from '@/components/ABIDecoder.vue';

import Web3 from 'web3';

export default {
  name: 'Home',
  components: {
    ABIDecoder,
  },
};
</script>
