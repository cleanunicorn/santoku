<template>
  <div>
    <ABIDecoder />
  </div>
</template>

<script>
// @ is an alias to /src
import ABIDecoder from '@/components/ABIDecoder.vue';

export default {
  name: 'Home',
  components: {
    ABIDecoder,
  },
};
</script>
