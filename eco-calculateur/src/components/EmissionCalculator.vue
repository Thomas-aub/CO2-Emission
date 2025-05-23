<template>
  <div class="main-container">
    <div class="title-container">
      <h1 class="title">Eco-Calculator</h1>
    </div>
    
    <!-- Formulaire de départ et d'arrivée -->
    <div class="search-box">
      <input type="text" class="form-control mb-2" placeholder="Départ: Lyon">
      <input type="text" class="form-control" placeholder="Arrivée: Paris">
      <button class="btn btn-primary mt-3" @click="calculateEmissions">Calculer</button>
    </div>

    <!-- Affichage des émissions CO2 -->
    <div class="card p-4 shadow">
      <div class="row text-center">
        <div class="col emission-box" v-for="(emission, index) in emissions" :key="index">
          <i :class="emission.icon"></i>
          <br> 
          <span>{{ emission.value }}</span>
        </div>
      </div>
      <p class="mt-3">en kg de CO² <i class="bi bi-leaf"></i></p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EmissionCalculator',
  data() {
    return {
      emissions: [
        { icon: "bi bi-person-walking", value: "0.1" },
        { icon: "bi bi-bicycle", value: "0.5" },
        { icon: "bi bi-lightning", value: "4.0" },
        { icon: "bi bi-train-front", value: "1.5" },
        { icon: "bi bi-car-front", value: "65.8" },
        { icon: "bi bi-airplane", value: "48.5" }
      ]
    };
  },
  methods: {
    calculateEmissions() {
      alert('Calcul en cours...');
    }
  }
}
</script>

<style scoped>
/* ✅ Plein écran + Centrage total */
.main-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to bottom, #e0f7fa, #80deea);
  padding: 20px;
}

/* ✅ Titre */
.title-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 2rem;
  color: #004d40;
}

/* ✅ Ajustement du formulaire */
.search-box {
  width: 50vw;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  margin-bottom: 20px;
  text-align: center;
}

/* ✅ Ajustement de la carte des émissions */
.card {
  width: 60vw;
  max-width: 900px;
  border-radius: 15px;
  background-color: #ffffff;
  text-align: center;
  padding: 20px;
}

/* ✅ Effet de survol */
.emission-box {
  padding: 15px;
  transition: transform 0.3s ease, background-color 0.3s ease;
  border-radius: 10px;
}

.emission-box:hover {
  transform: scale(1.2);
  background-color: rgba(128, 222, 234, 0.3);
  cursor: pointer;
}

/* ✅ Icônes et texte */
i {
  font-size: 30px;
  color: #00796b;
}

p {
  font-weight: bold;
  color: #004d40;
}
</style>
