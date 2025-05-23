document.addEventListener("DOMContentLoaded", function () {
  // Système de notification
  const notifications = {
    container: document.getElementById("notification-container"),

    show: function (options) {
      const notification = document.createElement("div");
      notification.className = `notification notification-${
        options.type || "info"
      }`;

      // Déterminer l'icône en fonction du type
      let iconClass = "fa-info-circle";
      let title = "Information";

      switch (options.type) {
        case "success":
          iconClass = "fa-check-circle";
          title = "Succès";
          break;
        case "error":
          iconClass = "fa-exclamation-circle";
          title = "Erreur";
          break;
        case "warning":
          iconClass = "fa-exclamation-triangle";
          title = "Attention";
          break;
      }

      // Créer le contenu HTML de la notification
      notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${options.title || title}</div>
                <div class="notification-message">${options.message}</div>
            </div>
            <button class="notification-close">×</button>
        `;

      // Ajouter au conteneur
      this.container.appendChild(notification);

      // Gérer la fermeture
      const closeBtn = notification.querySelector(".notification-close");
      closeBtn.addEventListener("click", () => this.close(notification));

      // Auto-fermeture après délai
      if (options.duration !== Infinity) {
        setTimeout(() => {
          if (notification.parentNode) {
            this.close(notification);
          }
        }, options.duration || 5000);
      }

      return notification;
    },

    close: function (notification) {
      notification.classList.add("closing");
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300); // Durée de l'animation
    },

    success: function (message, options = {}) {
      return this.show({
        type: "success",
        message,
        ...options,
      });
    },

    error: function (message, options = {}) {
      return this.show({
        type: "error",
        message,
        ...options,
      });
    },

    info: function (message, options = {}) {
      return this.show({
        type: "info",
        message,
        ...options,
      });
    },

    warning: function (message, options = {}) {
      return this.show({
        type: "warning",
        message,
        ...options,
      });
    },
  };

  window.notifications = notifications;

  const resultsContainer = document.getElementById("results-container");
  const calculateButton = document.getElementById("calculate-btn");
  const refreshPage = document.getElementById("refresh-page");
  const saveResultsBtn = document.getElementById("save-results-btn"); // Ajoutez cette ligne

  const token = localStorage.getItem("token");

  // 🔄 Rafraîchissement de la page au clic sur "Eco-Calculateur"
  refreshPage.addEventListener("click", function (event) {
    event.preventDefault();
    location.reload();
  });

  // Initialisation de la carte Leaflet
  var map = L.map("map").setView([46.603354, 1.888334], 6); // Centré sur la France

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let departMarker, arriveeMarker;
  let routeLine;
  const departInput = document.querySelector(
    "input[placeholder='Départ: Lyon']"
  );
  const arriveeInput = document.querySelector(
    "input[placeholder='Arrivée: Paris']"
  );
  const departSuggestions = document.getElementById("depart-suggestions");
  const arriveeSuggestions = document.getElementById("arrivee-suggestions");

  // Fonction pour créer ou mettre à jour la ligne entre les points
  function updateRouteLine() {
    // Supprimer la ligne existante si elle existe
    if (routeLine) {
      map.removeLayer(routeLine);
    }

    // Créer une nouvelle ligne si les deux marqueurs existent
    if (departMarker && arriveeMarker) {
      const departLatLng = departMarker.getLatLng();
      const arriveeLatLng = arriveeMarker.getLatLng();

      routeLine = L.polyline([departLatLng, arriveeLatLng], {
        color: "blue",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(map);

      // Ajuster la vue pour montrer tout l'itinéraire
      map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
    }
  }

  // Fonction d'autocomplétion pour les champs de départ et d'arrivée
  function setupAutocomplete(input, suggestionsContainer, isDepart = true) {
    input.addEventListener("input", async function () {
      const query = input.value;
      if (query.length < 3) {
        suggestionsContainer.innerHTML = "";
        return;
      }

      input.classList.add("loading");

      // Dans la fonction setupAutocomplete, remplacer le bloc try par:
      try {
        const url = `https://nominatim.openstreetmap.org/search`;

        const response = await axios.get(url, {
          params: {
            format: "json",
            q: query,
            addressdetails: 1,
            limit: 5,
          },
          // Configuration du proxy pour contourner les restrictions réseau
          proxy: {
            host: "proxy.univ-lyon1.fr",
            port: 3128,
            protocol: "https",
          },
          headers: {
            // Ajouter un user-agent est recommandé par Nominatim
            "User-Agent": "CO2EmissionCalculator/1.0",
          },
        });

        // Avec axios, pas besoin de response.json()
        const data = response.data;

        suggestionsContainer.innerHTML = "";

        // Si aucun résultat, afficher un message
        if (data.length === 0) {
          const noResult = document.createElement("div");
          noResult.textContent = "Aucun résultat trouvé";
          noResult.className = "no-result";
          suggestionsContainer.appendChild(noResult);
          return;
        }

        data.forEach((location) => {
          const suggestion = document.createElement("div");
          suggestion.textContent = location.display_name;
          suggestion.addEventListener("click", function () {
            input.value = location.display_name;
            suggestionsContainer.innerHTML = "";
            const latLng = [parseFloat(location.lat), parseFloat(location.lon)];

            if (isDepart) {
              if (departMarker) map.removeLayer(departMarker);
              departMarker = L.marker(latLng)
                .addTo(map)
                .bindPopup("Départ sélectionné")
                .openPopup();
            } else {
              if (arriveeMarker) map.removeLayer(arriveeMarker);
              arriveeMarker = L.marker(latLng)
                .addTo(map)
                .bindPopup("Arrivée sélectionnée")
                .openPopup();
            }

            map.setView(latLng, 13);

            // Mettre à jour la ligne si les deux marqueurs existent
            updateRouteLine();
          });
          suggestionsContainer.appendChild(suggestion);
        });
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        suggestionsContainer.innerHTML =
          "<div class='no-result'>Erreur lors de la recherche</div>";
      } finally {
        // Enlever la classe de chargement
        input.classList.remove("loading");
      }
    });

    // Gérer la touche Échap pour fermer les suggestions
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        suggestionsContainer.innerHTML = "";
      }
    });

    // Fermer les suggestions si on clique en dehors
    document.addEventListener("click", function (e) {
      if (!suggestionsContainer.contains(e.target) && e.target !== input) {
        suggestionsContainer.innerHTML = "";
      }
    });
  }

  setupAutocomplete(departInput, departSuggestions, true);
  setupAutocomplete(arriveeInput, arriveeSuggestions, false);

  // Écouteur de clic sur la carte
  map.on("click", function (e) {
    if (!departMarker) {
      departMarker = L.marker(e.latlng)
        .addTo(map)
        .bindPopup("Départ sélectionné")
        .openPopup();
      departInput.value = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
        5
      )}`;
    } else if (!arriveeMarker) {
      arriveeMarker = L.marker(e.latlng)
        .addTo(map)
        .bindPopup("Arrivée sélectionnée")
        .openPopup();
      arriveeInput.value = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
        5
      )}`;
      // Tracer la ligne entre les deux points
      updateRouteLine();
    } else {
      // Réinitialisation si on clique une troisième fois
      if (routeLine) {
        map.removeLayer(routeLine);
        routeLine = null;
      }
      map.removeLayer(departMarker);
      map.removeLayer(arriveeMarker);
      departMarker = L.marker(e.latlng)
        .addTo(map)
        .bindPopup("Départ sélectionné")
        .openPopup();
      arriveeMarker = null;
      departInput.value = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
        5
      )}`;
      arriveeInput.value = "";
    }
  });

  // Fonction pour appeler l'API et afficher les résultats
  async function calculateEmissions(origin, destination) {
    try {
      // Afficher un indicateur de chargement
      resultsContainer.innerHTML = `
      <div class="text-center my-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Chargement...</span>
        </div>
        <p class="mt-2">Calcul des émissions en cours...</p>
      </div>
    `;

      resultsContainer.scrollIntoView({ behavior: "smooth" });

      const response = await axios.get(
        `http://192.168.75.65:3376/api/travel-impact`,
        {
          params: {
            origins: origin,
            destinations: destination,
          },
          proxy: {
            host: "proxy.univ-lyon1.fr",
            port: 3128,
            protocol: "https",
          },
        }
      );

      // Avec axios, data est directement accessible dans response.data (pas besoin de response.json())
      const data = response.data;

      // Vérifier les données
      if (
        !data ||
        !Array.isArray(data.transport_modes) ||
        data.transport_modes.length === 0
      ) {
        throw new Error(
          "Aucun mode de transport disponible pour cet itinéraire"
        );
      }

      // Stocker les données pour sauvegarde ultérieure
      window.travelData = {
        origin: data.origin,
        destination: data.destination,
        origin_address: data.origin_address,
        destination_address: data.destination_address,
        transport_modes: data.transport_modes,
      };

      // Afficher le bouton de sauvegarde si l'utilisateur est connecté
      const saveContainer = document.getElementById("save-container");
      if (saveContainer) {
        saveContainer.style.display = "block";
      }

      // Filtrer les modes disponibles
      const availableModes = data.transport_modes.filter(
        (mode) => mode.available
      );

      if (availableModes.length === 0) {
        throw new Error(
          "Aucun mode de transport disponible pour cet itinéraire"
        );
      }

      // Calculer la distance moyenne (pour l'affichage)
      let totalDistance = 0;
      let distanceCount = 0;

      availableModes.forEach((mode) => {
        if (mode.distance && mode.distance.value) {
          totalDistance += mode.distance.value / 1000; // Convertir en km
          distanceCount++;
        }
      });

      const avgDistance =
        distanceCount > 0 ? Math.round(totalDistance / distanceCount) : 0;

      // Création d'un titre pour la section résultats
      const resultsTitle = document.createElement("div");
      resultsTitle.className = "col-12 mb-4";
      resultsTitle.innerHTML = `
                <h3 class="text-center">Émissions de CO₂ pour le trajet</h3>
                <p class="text-center text-muted">De ${data.origin_address} à ${data.destination_address} (environ ${avgDistance} km)</p>
            `;

      // Vider le conteneur et ajouter le titre
      resultsContainer.innerHTML = "";
      resultsContainer.appendChild(resultsTitle);

      // Création du conteneur pour la mosaïque
      const mosaicContainer = document.createElement("div");
      mosaicContainer.className = "results-mosaic";
      resultsContainer.appendChild(mosaicContainer);

      // Convertir les modes de transport au format attendu
      const transportModes = availableModes.map((mode) => {
        // Extraire la valeur d'émission
        let emissionValue = 0;
        let emissionName = mode.name;

        if (mode.emissions) {
          if (Array.isArray(mode.emissions)) {
            if (mode.emissions.length > 0) {
              emissionValue = mode.emissions[0].value;
            }
          } else {
            emissionValue = mode.emissions.value;
          }
        }

        // Sélectionner l'icône en fonction du mode
        switch (mode.mode) {
          case "driving":
            icon = "fa-car";
            break;
          case "electric_car":
            icon = "fa-charging-station";
            break;
          case "walking":
            icon = "fa-person-walking";
            break;
          case "bicycling":
            icon = "fa-bicycle";
            break;
          case "electric_bike":
            icon = "fa-bicycle";
            break;
          case "electric_scooter":
            icon = "fa-scooter";
            break;
          case "transit_train":
            icon = "fa-train";
            break;
          case "transit_tram":
            icon = "fa-train-tram";
            break;
          case "transit_bus":
            icon = "fa-bus";
            break;
          case "electric_bus":
            icon = "fa-bus";
            break;
          case "gnv_bus":
            icon = "fa-bus";
            break;
          case "motorcycle":
            icon = "fa-motorcycle";
            break;
          case "transit_metro":
            icon = "fa-train-subway";
            break;
          case "airplane":
            icon = "fa-plane";
            break;
        }
        return {
          id: mode.emissionId || 0,
          name: mode.name,
          value: emissionValue,
          icon: icon,
          distance: mode.distance?.text || "N/A",
          duration: mode.duration?.text || "N/A",
        };
      });

      // Tri des modes par émission (du plus faible au plus élevé)
      transportModes.sort((a, b) => a.value - b.value);

      // Afficher les modes de transport
      transportModes.forEach((mode) => {
        const card = document.createElement("div");
        card.className = "result-card";

        // Déterminer la classe de couleur en fonction de l'empreinte carbone
        let colorClass = "text-success"; // Vert pour faible émission
        if (mode.value > 10) {
          colorClass = "text-danger"; // Rouge pour forte émission
        } else if (mode.value > 1) {
          colorClass = "text-warning"; // Orange pour émission moyenne
        }

        // Définir la classe additionnelle ici
        let additionalClass = "";
        if (mode.mode && mode.mode.includes("electric")) {
          additionalClass = "electric-icon";
        }

        card.innerHTML = `
            <i class="fa-solid ${
              mode.icon
            } result-icon ${colorClass} ${additionalClass}"></i>
            <h5 class="mb-3">${mode.name}</h5>
            <p class="mb-0 fs-4 fw-bold ${colorClass}">${mode.value.toFixed(
          2
        )} kg CO₂</p>
            <p class="text-muted small">Distance: ${mode.distance}</p>
            <p class="text-muted small">Durée: ${mode.duration}</p>
        `;

        mosaicContainer.appendChild(card);
      });

      // Scroll vers les résultats
      resultsContainer.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      // Utiliser le système de notifications pour l'erreur
      notifications.error(
        error.message || "Une erreur est survenue lors du calcul des émissions",
        {
          title: "Erreur de calcul",
          message: "Vérifiez vos points de départ et d'arrivée et réessayez.",
          duration: 7000, // Durée plus longue pour laisser le temps de lire
        }
      );

      // Afficher un message plus simple dans le conteneur de résultats
      resultsContainer.innerHTML = `
    <div class="text-center my-5">
      <i class="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i>
      <h4>Le calcul n'a pas pu être effectué</h4>
      <p class="text-muted">Veuillez modifier vos points de départ ou d'arrivée et réessayer.</p>
    </div>
  `;

      // Cacher le bouton de sauvegarde s'il y a une erreur
      const saveContainer = document.getElementById("save-container");
      if (saveContainer) {
        saveContainer.style.display = "none";
      }

      // Réinitialiser les données de trajet
      window.travelData = null;
    }
  }

  // Affichage des résultats au clic
  calculateButton.addEventListener("click", function () {
    if (!departMarker || !arriveeMarker) {
      notifications.error(
        "Veuillez sélectionner un point de départ et d'arrivée sur la carte ou dans les suggestions.",
        {
          title: "Erreur",
          message: "Sélectionnez un point de départ et d'arrivée.",
          duration: 3000,
        }
      );
      return;
    }

    // Récupérer les coordonnées ou les adresses
    const origin = departInput.value;
    const destination = arriveeInput.value;

    // Calculer les émissions
    calculateEmissions(origin, destination);
  });

  // Sauvegarder les résultats
  saveResultsBtn.addEventListener("click", async function () {
    // Vérifier si l'utilisateur est connecté
    if (!token) {
      // Rediriger vers la page de connexion en sauvegardant l'URL actuelle
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      window.location.href = "login.html";
      return;
    }

    // Vérifier si des données sont disponibles
    if (!window.travelData) {
      notifications.error("Aucun résultat à sauvegarder", {
        title: "Erreur",
        message: "Veuillez d'abord calculer les émissions.",
        duration: 3000,
      });
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.75.65:3376/api/users/search-results",
        window.travelData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          proxy: {
            host: "proxy.univ-lyon1.fr",
            port: 3128,
            protocol: "https",
          },
        }
      );

      // Axios place directement les données dans response.data
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        // Désactiver le bouton pour éviter les sauvegardes multiples
        saveResultsBtn.disabled = true;
        saveResultsBtn.innerHTML =
          '<i class="fas fa-check me-1"></i> Résultats sauvegardés';
        saveResultsBtn.classList.remove("btn-success");
        saveResultsBtn.classList.add("btn-secondary");

        notifications.success("Résultats sauvegardés avec succès!", {
          title: "Succès",
          message: "Vos résultats ont été sauvegardés.",
          duration: 3000,
        });

        // Réactiver le bouton après 3 secondes
        setTimeout(() => {
          saveResultsBtn.disabled = false;
          saveResultsBtn.innerHTML =
            '<i class="fas fa-save me-1"></i> Sauvegarder ces résultats';
          saveResultsBtn.classList.remove("btn-secondary");
          saveResultsBtn.classList.add("btn-success");
        }, 3000);
      } else {
        notifications.error(
          `Erreur: ${data.message || "Échec de la sauvegarde"}`,
          {
            title: "Erreur",
            message:
              "Une erreur est survenue lors de la sauvegarde des résultats.",
            duration: 3000,
          }
        );
      }
    } catch (error) {
      let errorMessage =
        "Une erreur est survenue lors de la sauvegarde des résultats.";

      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      notifications.error(`Erreur de connexion: ${errorMessage}`, {
        title: "Erreur",
        message: "Une erreur est survenue lors de la sauvegarde des résultats.",
        duration: 3000,
      });
    }
  });
});
