<template>
  <div class="app-container">
    <EmissionCalculator />
  </div>
</template>

<script>
import EmissionCalculator from './components/EmissionCalculator.vue';

export default {
  components: {
    EmissionCalculator
  }
}
</script>

<style>
.app-container {
  background-color: #d6d2d2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
