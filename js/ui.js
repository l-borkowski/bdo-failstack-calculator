// Zmienna przechowująca aktualny wykres
let chart;
let currentLanguage = "en";

/**
 * Funkcja do zmiany motywu
 */
function toggleTheme() {
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");

  if (body.classList.contains("light-theme")) {
    body.classList.remove("light-theme");
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.add("light-theme");
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }

  // Aktualizacja wykresu po zmianie motywu
  if (chart) {
    calculate();
  }
}

/**
 * Funkcja do zmiany języka
 */
function toggleLanguage() {
  currentLanguage = currentLanguage === "pl" ? "en" : "pl";
  localStorage.setItem("language", currentLanguage);
  updateLanguage();
  calculate();
}

/**
 * Aktualizacja języka na stronie
 */
function updateLanguage() {
  document.querySelector("html").setAttribute("lang", currentLanguage);
  document.getElementById("title").textContent =
    translations[currentLanguage].title;
  document.getElementById("targetStackLabel").textContent =
    translations[currentLanguage].targetStackLabel;
  document.getElementById("startStackLabel").textContent =
    translations[currentLanguage].startStackLabel;
  document.getElementById("startStackDescription").textContent =
    translations[currentLanguage].startStackDescription;
  document.getElementById("useEventLabel").innerHTML =
    translations[currentLanguage].useEventLabel;
  document.getElementById("useSmartEventLabel").textContent =
    translations[currentLanguage].useSmartEventLabel;
  document.getElementById("showAdvancedLabel").textContent =
    translations[currentLanguage].showAdvancedLabel;
  document.getElementById("advancedOptionsTitle").textContent =
    translations[currentLanguage].advancedOptionsTitle;
  document.getElementById("eventLimitLabel").textContent =
    translations[currentLanguage].eventLimitLabel;
  document.getElementById("eventThresholdLabel").textContent =
    translations[currentLanguage].eventThresholdLabel;
  document.getElementById("originPriceLabel").textContent =
    translations[currentLanguage].originPriceLabel;
  document.getElementById("faintPriceLabel").textContent =
    translations[currentLanguage].faintPriceLabel;
  document.getElementById("useCompactNumbersLabel").textContent =
    translations[currentLanguage].useCompactNumbersLabel;
  document.getElementById("originPreferenceLabel").textContent =
    translations[currentLanguage].originPreferenceLabel;
  document.getElementById("originPreferenceDescription").textContent =
    translations[currentLanguage].originPreferenceDescription;

  // Aktualizacja opcji w selekcie preferencji Originów
  const originPreferenceSelect = document.getElementById("originPreference");
  const currentValue = originPreferenceSelect.value; // Zachowujemy aktualnie wybraną wartość
  originPreferenceSelect.innerHTML = ""; // Czyścimy opcje

  // Dodajemy nowe opcje z tłumaczeniami
  const options = translations[currentLanguage].originPreferenceOptions;
  for (const value in options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = options[value];
    originPreferenceSelect.appendChild(option);
  }

  // Przywracamy wybraną wartość
  originPreferenceSelect.value = currentValue;

  document.getElementById("stepsListTitle").textContent =
    translations[currentLanguage].stepsListTitle;
  document.getElementById("valksCryLabel").textContent =
    translations[currentLanguage].valksCryLabel;
  document.getElementById("valksCryDescription").textContent =
    translations[currentLanguage].valksCryDescription;
  document.getElementById("permanentEnchLabel").textContent =
    translations[currentLanguage].permanentEnchLabel;
  document.getElementById("permanentEnchDescription").textContent =
    translations[currentLanguage].permanentEnchDescription;
  document.getElementById("footerCreatedBy").textContent =
    translations[currentLanguage].footer.createdBy;

  // Aktualizuj legendę
  updateLegend();
}

/**
 * Aktualizuje legendę nad listą kroków
 */
function updateLegend() {
  const stepsLegend = document.getElementById("stepsLegend");
  stepsLegend.innerHTML = `
    <p><strong>${translations[currentLanguage].steps.legend}</strong></p>
    <p>${translations[currentLanguage].steps.originShort} = ${translations[currentLanguage].steps.originLong}</p>
    <p>${translations[currentLanguage].steps.faintOriginShort} = ${translations[currentLanguage].steps.faintOriginLong}</p>
    <p>${translations[currentLanguage].steps.eventOriginShort} = ${translations[currentLanguage].steps.eventOriginLong}</p>
  `;
}

/**
 * Funkcja do przełączania zaawansowanych opcji
 */
function toggleAdvancedOptions() {
  const advancedOptions = document.getElementById("advancedOptions");
  const showAdvanced = document.getElementById("showAdvanced").checked;

  advancedOptions.style.display = showAdvanced ? "block" : "none";
}

/**
 * Funkcja do przełączania widoczności opcji eventowych
 */
function toggleEventOptionsVisibility() {
  const useEvent = document.getElementById("useEvent").checked;
  const eventOptionsContainer = document.getElementById(
    "eventOptionsContainer"
  );

  eventOptionsContainer.style.display = useEvent ? "block" : "none";

  // Jeśli Event Origins są wyłączone, wyłącz też Smart Event
  if (!useEvent) {
    document.getElementById("useSmartEvent").checked = false;
  }
}

/**
 * Renderuje listę kroków na stronie
 * @param {Array} steps - Lista kroków
 * @param {boolean} useCompactNumbers - Czy używać kompaktowego formatu liczb
 */
function renderStepList(steps, useCompactNumbers) {
  const stepList = document.getElementById("stepList");
  stepList.innerHTML = "";

  // Pobierz aktualne ceny Origin do porównania
  const originPrice = parseFloat(document.getElementById("originPrice").value);
  const faintPrice = parseFloat(document.getElementById("faintPrice").value);
  // Granica cenowa między Origin a Faint (mniej więcej w połowie między ich cenami)
  const priceBoundary = (originPrice + faintPrice) / 2;

  if (steps.length === 0) {
    stepList.innerHTML = `<p>${translations[currentLanguage].steps.noSteps}</p>`;
    return;
  }

  // Upewnij się, że wszystkie kroki mają właściwą nazwę typu
  steps.forEach((step, index) => {
    // Jeśli typ jest undefined, spróbuj go naprawić
    if (!step.type || step.type.includes("undefined")) {
      // Sprawdź, czy to krok z event originem
      if (step.cost === 0 && step.increase > 0 && step.increase <= 6) {
        step.type = translations[currentLanguage].steps.eventOrigin;
      }
      // Sprawdź, czy to krok z oryginalnym originem (bazując na koszcie w porównaniu do cen)
      else if (step.cost >= priceBoundary) {
        step.type = translations[currentLanguage].steps.origin;
      }
      // W przeciwnym razie to faint origin
      else if (step.cost > 0) {
        step.type = translations[currentLanguage].steps.faintOrigin;
      }
      // Dla pozostałych przypadków (np. początkowy stack)
      else {
        // Zachowaj istniejący typ lub ustaw domyślny
        step.type =
          step.type || translations[currentLanguage].steps.initialStack;
      }
    }

    // Zastąp pełne nazwy skrótami
    if (step.type === translations[currentLanguage].steps.eventOrigin) {
      step.type = translations[currentLanguage].steps.eventOriginShort;
    } else if (step.type === translations[currentLanguage].steps.faintOrigin) {
      step.type = translations[currentLanguage].steps.faintOriginShort;
    } else if (step.type === translations[currentLanguage].steps.origin) {
      step.type = translations[currentLanguage].steps.originShort;
    }
  });

  steps.forEach((step, index) => {
    const stepItem = document.createElement("div");
    stepItem.className = "step-item";

    // Usuń słowo "Silver" i wyświetl tylko koszt w nawiasach
    const costText =
      step.cost > 0
        ? `(${formatNumber(step.cost, useCompactNumbers, currentLanguage)})`
        : "";

    stepItem.innerHTML = `
            <div>${index + 1}. ${step.type}</div>
            <div>${step.startStack} → ${step.endStack} (+${
      step.increase
    }) ${costText}</div>
        `;

    stepList.appendChild(stepItem);
  });
}

/**
 * Renderuje wykres postępu stackowania
 * @param {Array} data - Dane do wykresu
 */
function renderChart(data) {
  const ctx = document.getElementById("failstackChart").getContext("2d");
  const isDark = !document.body.classList.contains("light-theme");
  const textColor = isDark ? "#ffffff" : "#333333";

  // Obliczamy, które punkty danych reprezentują bonusy Valk's Cry i Permanent Enhancement
  const valksCry = parseInt(document.getElementById("valksCry").value) || 0;
  const permEnch = parseInt(document.getElementById("permEnch").value) || 0;

  // Określamy indeksy w tablicy data dla każdego segmentu
  let normalStackingEndIdx = data.length - 1; // Domyślnie koniec danych
  let valksCryStartIdx = -1;
  let permEnchStartIdx = -1;

  // Jeśli mamy bonusy valks i/lub perm, to określamy granice segmentów
  if (valksCry > 0 && permEnch > 0) {
    // Mamy oba bonusy
    normalStackingEndIdx = data.length - 3; // Ostatni indeks normalnego stackowania
    valksCryStartIdx = data.length - 2; // Punkt startowy dla Valks Cry
    permEnchStartIdx = data.length - 1; // Punkt startowy dla Permanent Enhancement
  } else if (valksCry > 0) {
    // Mamy tylko Valks Cry
    normalStackingEndIdx = data.length - 2;
    valksCryStartIdx = data.length - 1;
  } else if (permEnch > 0) {
    // Mamy tylko Permanent Enhancement
    normalStackingEndIdx = data.length - 2;
    permEnchStartIdx = data.length - 1;
  }

  // Kolory dla różnych segmentów
  const mainColor = "#4caf50"; // zielony - główny stacking
  const valksColor = "#2196f3"; // niebieski - Valk's Cry
  const permEnchColor = "#ff9800"; // pomarańczowy - Permanent Enhancement

  if (chart) chart.destroy();

  // Tworzymy wykres z różnymi kolorami dla różnych segmentów
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => i),
      datasets: [
        {
          label: translations[currentLanguage].chart.progress,
          data: data,
          borderColor: (context) => {
            const index = context.dataIndex;

            // Określamy kolor na podstawie indeksu
            if (index === permEnchStartIdx) {
              return permEnchColor;
            } else if (index === valksCryStartIdx) {
              return valksColor;
            } else {
              return mainColor;
            }
          },
          backgroundColor: (context) => {
            const index = context.dataIndex;

            // Określamy kolor na podstawie indeksu
            if (index === permEnchStartIdx) {
              return "rgba(255, 152, 0, 0.2)"; // pomarańczowy
            } else if (index === valksCryStartIdx) {
              return "rgba(33, 150, 243, 0.2)"; // niebieski
            } else {
              return "rgba(76, 175, 80, 0.2)"; // zielony
            }
          },
          pointBackgroundColor: (context) => {
            const index = context.dataIndex;

            // Określamy kolor na podstawie indeksu
            if (index === permEnchStartIdx) {
              return permEnchColor;
            } else if (index === valksCryStartIdx) {
              return valksColor;
            } else {
              return mainColor;
            }
          },
          segment: {
            borderColor: (ctx) => {
              // Określamy kolor dla segmentów linii
              if (!ctx.p0.skip && !ctx.p1.skip) {
                if (ctx.p0DataIndex === valksCryStartIdx - 1 && valksCry > 0) {
                  // Segment od normalnego stackingu do Valks
                  return valksColor;
                } else if (
                  (ctx.p0DataIndex === permEnchStartIdx - 1 && permEnch > 0) ||
                  (ctx.p0DataIndex === valksCryStartIdx &&
                    ctx.p1DataIndex === permEnchStartIdx)
                ) {
                  // Segment od normalnego stackingu (lub Valks) do Perm Enhancement
                  return permEnchColor;
                }
              }
              return mainColor;
            },
          },
          fill: true,
          tension: 0.3,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: translations[currentLanguage].chart.step,
            color: textColor,
          },
          ticks: {
            color: textColor,
          },
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          },
        },
        y: {
          title: {
            display: true,
            text: translations[currentLanguage].chart.failstack,
            color: textColor,
          },
          ticks: {
            color: textColor,
          },
          grid: {
            color: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          },
          min: 90,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const index = context.dataIndex;
              const value = context.raw;
              let label = `${translations[currentLanguage].chart.failstack}: ${value}`;

              // Dodaj dodatkową informację o typie bonusu
              if (index === permEnchStartIdx) {
                label += ` (${translations[currentLanguage].steps.permEnchAdded})`;
              } else if (index === valksCryStartIdx) {
                label += ` (${translations[currentLanguage].steps.valksAdded})`;
              }

              return label;
            },
          },
        },
      },
      animation: {
        duration: 0, // Wyłącza animacje dla szybszego renderowania
      },
    },
  });
}

/**
 * Zapisuje ustawienia użytkownika w localStorage
 */
function saveUserSettings() {
  // Zapisanie wartości dla valksów i permanent enhancement
  localStorage.setItem("valksCry", document.getElementById("valksCry").value);
  localStorage.setItem("permEnch", document.getElementById("permEnch").value);
  localStorage.setItem(
    "targetStack",
    document.getElementById("targetStack").value
  );
  localStorage.setItem(
    "startStack",
    document.getElementById("startStack").value
  );
  localStorage.setItem("useEvent", document.getElementById("useEvent").checked);
  localStorage.setItem(
    "useSmartEvent",
    document.getElementById("useSmartEvent").checked
  );
  localStorage.setItem(
    "originPreference",
    document.getElementById("originPreference").value
  );
}

/**
 * Inicjalizacja strony przy załadowaniu
 */
function initApp() {
  // Wczytanie zapisanych ustawień
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    document.getElementById("themeToggle").textContent = "🌙";
  }

  // Wykrywanie języka systemu
  const savedLanguage = localStorage.getItem("language");
  if (savedLanguage) {
    currentLanguage = savedLanguage;
  } else {
    // Próba wykrycia języka przeglądarki
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang && browserLang.startsWith("pl")) {
      currentLanguage = "pl";
    } else {
      currentLanguage = "en";
    }
    localStorage.setItem("language", currentLanguage);
  }

  // Aktualizacja języka
  updateLanguage();

  // Wczytanie zapisanych wartości Valk's Cry i Permanent Enhancement
  const savedValksCry = localStorage.getItem("valksCry");
  if (savedValksCry !== null) {
    document.getElementById("valksCry").value = savedValksCry;
  }

  const savedPermEnch = localStorage.getItem("permEnch");
  if (savedPermEnch !== null) {
    document.getElementById("permEnch").value = savedPermEnch;
  }

  // Wczytanie zapisanego docelowego stacka
  const savedTargetStack = localStorage.getItem("targetStack");
  if (savedTargetStack !== null) {
    document.getElementById("targetStack").value = savedTargetStack;
  }

  // Wczytanie zapisanego startowego stacka
  const savedStartStack = localStorage.getItem("startStack");
  if (savedStartStack !== null) {
    document.getElementById("startStack").value = savedStartStack;
  }

  // Wczytanie zapisanej preferencji dla Originów
  const savedOriginPreference = localStorage.getItem("originPreference");
  if (savedOriginPreference !== null) {
    document.getElementById("originPreference").value = savedOriginPreference;
  }

  // Ustawienie domyślnych wartości
  document.getElementById("eventLimit").value = 20;
  document.getElementById("eventThreshold").value = 150;

  // Domyślnie włącz Smart Event jeśli Event Origins są włączone
  if (document.getElementById("useEvent").checked) {
    // Wczytaj zapisaną wartość Smart Event, jeśli istnieje
    const savedUseSmartEvent = localStorage.getItem("useSmartEvent");
    if (savedUseSmartEvent !== null) {
      document.getElementById("useSmartEvent").checked =
        savedUseSmartEvent === "true";
    } else {
      // Jeśli nie ma zapisanej wartości, domyślnie włącz
      document.getElementById("useSmartEvent").checked = true;
    }
  }

  // Inicjalizuj widoczność opcji eventowych
  toggleEventOptionsVisibility();

  // Nasłuchiwanie zmian dla przełącznika zaawansowanych opcji
  document
    .getElementById("showAdvanced")
    .addEventListener("change", toggleAdvancedOptions);

  // Nasłuchiwanie zmian dla przełącznika event origins
  document.getElementById("useEvent").addEventListener("change", () => {
    toggleEventOptionsVisibility();
    // Jeśli włączamy Event Origins, domyślnie włącz też Smart Event
    if (document.getElementById("useEvent").checked) {
      document.getElementById("useSmartEvent").checked = true;
    }
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian dla Smart Event
  document.getElementById("useSmartEvent").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian limitu eventowych
  document.getElementById("eventLimit").addEventListener("input", () => {
    calculate();
  });

  // Nasłuchiwanie zmian dla Valk's Cry
  document.getElementById("valksCry").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian dla selecta z Permanent Enhancement
  document.getElementById("permEnch").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian dla Target Stack
  document.getElementById("targetStack").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian dla Start Stack
  document.getElementById("startStack").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Nasłuchiwanie zmian dla preferencji Originów
  document.getElementById("originPreference").addEventListener("change", () => {
    saveUserSettings();
    calculate();
  });

  // Dodaj nasłuchiwanie zmian we wszystkich pozostałych inputach
  const inputs = document.querySelectorAll(
    'input[type="number"]:not(#valksCry):not(#targetStack), input[type="checkbox"]:not(#useEvent):not(#useSmartEvent)'
  );
  inputs.forEach((input) => {
    input.addEventListener("input", calculate);
  });

  // Nasłuchiwanie przycisku zmiany języka
  document
    .getElementById("langToggle")
    .addEventListener("click", toggleLanguage);

  // Nasłuchiwanie przycisku zmiany motywu
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  // Oblicz od razu po załadowaniu strony
  calculate();
}

// Inicjalizuj aplikację po załadowaniu DOM
document.addEventListener("DOMContentLoaded", initApp);
