/**
 * Główna funkcja kalkulatora failstacków
 * Oblicza najlepszą strategię stackowania
 */
function calculate() {
  const targetInput = parseInt(document.getElementById("targetStack").value);
  const startStack = parseInt(document.getElementById("startStack").value) || 0;
  const useEvent = document.getElementById("useEvent").checked;
  const useSmartEvent = document.getElementById("useSmartEvent").checked;
  const eventLimit = parseInt(document.getElementById("eventLimit").value);
  const eventThreshold = parseInt(
    document.getElementById("eventThreshold").value
  );
  const originPrice = parseInt(document.getElementById("originPrice").value);
  const faintPrice = parseInt(document.getElementById("faintPrice").value);
  const valksCry = parseInt(document.getElementById("valksCry").value) || 0;
  const permEnch = parseInt(document.getElementById("permEnch").value) || 0;
  const useCompactNumbers =
    document.getElementById("useCompactNumbers").checked;
  const originPreference = document.getElementById("originPreference").value;

  // Jeśli tryb to "cheapest", uruchamiamy wszystkie algorytmy i wybieramy najtańszy
  if (originPreference === "cheapest") {
    // Tworzymy kopie parametrów dla symulacji innych trybów
    const params = {
      targetInput,
      startStack,
      useEvent,
      useSmartEvent,
      eventLimit,
      eventThreshold,
      originPrice,
      faintPrice,
      valksCry,
      permEnch,
      useCompactNumbers,
    };

    // Uruchamiamy symulacje dla wszystkich trybów
    const cheapestResult = simulateCalculation({
      ...params,
      originPreference: "cheapest",
    });
    const balancedResult = simulateCalculation({
      ...params,
      originPreference: "balanced",
    });
    const originResult = simulateCalculation({
      ...params,
      originPreference: "origin",
    });
    const faintResult = simulateCalculation({
      ...params,
      originPreference: "faint",
    });

    // Wybieramy wynik z najniższym kosztem
    const results = [
      { name: "cheapest", result: cheapestResult },
      { name: "balanced", result: balancedResult },
      { name: "origin", result: originResult },
      { name: "faint", result: faintResult },
    ];

    // Sortujemy według kosztu
    results.sort((a, b) => a.result.cost - b.result.cost);

    // Jeśli jakiś inny tryb jest tańszy niż cheapest, używamy jego wyniku
    if (results[0].name !== "cheapest") {
      console.log(
        `Tryb '${results[0].name}' okazał się tańszy (${results[0].result.cost} vs ${cheapestResult.cost}). Używam jego wyniku.`
      );
      return calculateWithResult(results[0].result, params);
    }
  }

  // Standardowa implementacja kalkulatora - poniżej istniejący kod
  // Obliczamy efektywny docelowy stack (bez Valks Cry i Permanent Enhancement)
  const totalBonus = valksCry + permEnch;
  const effectiveTarget = Math.max(100, targetInput - totalBonus);

  // Zaczynamy od wartości startowego stacka lub 100, jeśli startowy stack jest mniejszy
  let current = Math.max(startStack, 100);
  let eventLeft = eventLimit;
  let cost = 0;
  let eventUsed = 0;
  let faintUsed = 0;
  let originUsed = 0;
  let progress = [current];
  let steps = [];

  // Jeśli startStack jest większy niż 0 ale mniejszy niż 100, dodajemy informację o kroku
  if (startStack > 0 && startStack < 100) {
    steps.push({
      startStack: startStack,
      type: translations[currentLanguage].steps.initialStack,
      increase: 100 - startStack,
      endStack: 100,
      cost: 0,
    });
  }

  while (current < effectiveTarget) {
    // Ile punktów brakuje do celu
    const remainingToTarget = effectiveTarget - current;

    // Pobierz zwiększenia dla każdego typu origina
    const eventIncrease = getEventIncrease(current);
    const faintIncrease = getFaintIncrease(current);
    const originIncrease = getOriginIncrease(current);

    // Oblicz koszt per punkt dla każdego typu
    const faintCostPerPoint = faintPrice / faintIncrease;
    const originCostPerPoint = originPrice / originIncrease;

    // Podstawowe flagi służące do wyboru typu origina
    let useEventHere = false;
    let useFaintHere = false;
    let useOriginHere = false;

    // Wybierz typ origina na podstawie bieżącego stacka i pozostałych punktów
    if (useEvent && eventLeft > 0 && current >= eventThreshold) {
      if (useSmartEvent) {
        // NOWA LOGIKA SMART:
        // 1. Używaj eventowych prawie wyłącznie do dobijania końcowego stacka
        // 2. Unikaj zużywania dużych originów gdy potrzebujemy niewiele punktów

        // Sprawdzamy, czy event origin jest idealny do dobicia do celu
        const perfectMatch = eventIncrease === remainingToTarget;

        // Sprawdzamy, czy event origin nie przekraczałby celu zbyt dużo
        const eventOvershoot =
          eventIncrease > remainingToTarget
            ? eventIncrease - remainingToTarget
            : 0;
        const faintOvershoot =
          faintIncrease > remainingToTarget
            ? faintIncrease - remainingToTarget
            : 0;
        const originOvershoot =
          originIncrease > remainingToTarget
            ? originIncrease - remainingToTarget
            : 0;

        // Używamy event origina gdy:
        // 1. Jesteśmy blisko celu (mniej niż 10 punktów) I event origin ma najmniejszy overshoot
        // 2. LUB event origin idealnie dobija do celu
        // 3. LUB zostało mniej niż 5 punktów do celu i event daje najmniej punktów z dostępnych

        if (perfectMatch) {
          // Perfect match - eventowy origin dobija idealnie do celu
          useEventHere = true;
        } else if (remainingToTarget <= 10) {
          // Blisko celu - wybierz typ z najmniejszym overshotem
          if (eventIncrease < faintIncrease && eventIncrease < originIncrease) {
            // Event daje najmniej punktów - idealny do dobicia
            useEventHere = true;
          } else if (
            eventOvershoot <= faintOvershoot &&
            eventOvershoot <= originOvershoot
          ) {
            // Event ma najmniejszy overshoot - najlepszy do dobicia
            useEventHere = true;
          }
        }
        // Dodatkowy warunek: gdy brakuje niewiele punktów, a next najlepszy origin dałby dużo za dużo
        else if (remainingToTarget <= 5) {
          const nextBestIncrease =
            faintCostPerPoint <= originCostPerPoint
              ? faintIncrease
              : originIncrease;
          const nextBestOvershoot = nextBestIncrease - remainingToTarget;

          // Jeśli następny najlepszy origin przekroczyłby cel o więcej niż 5 punktów,
          // a mamy eventowy который nie przekracza tak mocno, użyj eventowego
          if (nextBestOvershoot > 5 && eventOvershoot <= nextBestOvershoot) {
            useEventHere = true;
          }
        }
      } else {
        // Jeśli nie używamy smart event, zawsze używaj eventowych jeśli są dostępne
        useEventHere = true;
      }
    }

    // Jeśli nie używamy eventowego, wybierz pomiędzy faint i origin
    if (!useEventHere) {
      // Dodajemy tolerancję kosztową w oparciu o preferencję użytkownika
      let costTolerance = 0.05; // 5% tolerancji domyślnie
      let preferFaint = false;
      let preferOrigin = false;

      if (originPreference === "origin") {
        preferOrigin = true;
        costTolerance = 0.15; // 15% tolerancji dla preferowanych Origin
      } else if (originPreference === "faint") {
        preferFaint = true;
        costTolerance = 0.15; // 15% tolerancji dla preferowanych Faint Origin
      }

      // Wybierz typ z uwzględnieniem preferencji
      if (originPreference === "cheapest") {
        // W trybie cheapest potrzebujemy głębszej symulacji różnych ścieżek stackowania
        // aby znaleźć naprawdę najtańszą opcję

        // Funkcja symulująca koszt stackowania od current do effectiveTarget
        const simulateStackCost = (startStack, targetStack, pathBias) => {
          let simCurrent = startStack;
          let simCost = 0;
          let simFaintUsed = 0;
          let simOriginUsed = 0;

          while (simCurrent < targetStack) {
            // Pobierz przyrosty dla aktualnego stacka
            const simFaintInc = getFaintIncrease(simCurrent);
            const simOriginInc = getOriginIncrease(simCurrent);

            // Oblicz koszt per punkt
            const simFaintCostPP = faintPrice / simFaintInc;
            const simOriginCostPP = originPrice / simOriginInc;

            // Ile punktów brakuje do celu
            const simRemaining = targetStack - simCurrent;

            // Czy jesteśmy blisko celu? (w granicy 10 pkt)
            const nearTarget = simRemaining < 10;

            // Różne strategie wyboru w zależności od biasu ścieżki
            let useFaintSim = false;

            if (pathBias === "faint") {
              // Preferuj Faint, ale z uwzględnieniem efektywności kosztowej
              useFaintSim = simFaintCostPP * 0.9 <= simOriginCostPP;
            } else if (pathBias === "origin") {
              // Preferuj Origin, ale z uwzględnieniem efektywności kosztowej
              useFaintSim = simFaintCostPP <= simOriginCostPP * 0.9;
            } else if (nearTarget) {
              // Blisko celu - wybierz opcję z najmniejszym overshotem
              const faintOver =
                simFaintInc > simRemaining ? simFaintInc - simRemaining : 0;
              const originOver =
                simOriginInc > simRemaining ? simOriginInc - simRemaining : 0;

              // Ekstra logika dla overshoota - uwzględniamy też koszt per punkt
              if (faintOver === 0 && originOver === 0) {
                // Obie opcje idealnie dobijają - wybieramy tańszą
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              } else if (faintOver === 0) {
                // Tylko Faint idealnie dobija
                useFaintSim = true;
              } else if (originOver === 0) {
                // Tylko Origin idealnie dobija
                useFaintSim = false;
              } else if (Math.abs(faintOver - originOver) <= 1) {
                // Overshoot jest bardzo podobny - wybieramy tańszą opcję
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              } else if (faintOver < originOver) {
                useFaintSim = true;
              } else {
                useFaintSim = false;
              }
            } else {
              // Standardowo - wybierz tańszą opcję per punkt
              // Dodajemy specjalną logikę dla stacka 187
              if (simCurrent >= 180 && simCurrent <= 190) {
                // Dla stacków w okolicy 187, dodajemy dodatkowy bias na Origin jeśli
                // koszt per punkt jest zbliżony
                if (simOriginCostPP <= simFaintCostPP * 1.05) {
                  useFaintSim = false; // Preferujemy Origin
                } else {
                  useFaintSim = true;
                }
              } else {
                // Dla pozostałych stacków, po prostu wybieramy tańszą opcję
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              }
            }

            // Wykonaj krok w symulacji
            if (useFaintSim) {
              // Używamy Faint Origin
              simCurrent += simFaintInc;
              simCost += faintPrice;
              simFaintUsed++;

              // Korekta jeśli przekroczyliśmy cel
              if (simCurrent > targetStack && nearTarget) {
                // Proporcjonalnie zmniejszamy koszt ostatniego kroku jeśli przekroczyliśmy cel
                const exceededBy = simCurrent - targetStack;
                const usedRatio = (simFaintInc - exceededBy) / simFaintInc;
                simCost -= faintPrice * (1 - usedRatio);
                break; // Kończymy symulację
              }
            } else {
              // Używamy Origin
              simCurrent += simOriginInc;
              simCost += originPrice;
              simOriginUsed++;

              // Korekta jeśli przekroczyliśmy cel
              if (simCurrent > targetStack && nearTarget) {
                // Proporcjonalnie zmniejszamy koszt ostatniego kroku jeśli przekroczyliśmy cel
                const exceededBy = simCurrent - targetStack;
                const usedRatio = (simOriginInc - exceededBy) / simOriginInc;
                simCost -= originPrice * (1 - usedRatio);
                break; // Kończymy symulację
              }
            }

            // Limity bezpieczeństwa aby uniknąć nieskończonych pętli
            if (simFaintUsed + simOriginUsed > 50) {
              break;
            }
          }

          return {
            cost: simCost,
            faintUsed: simFaintUsed,
            originUsed: simOriginUsed,
          };
        };

        // Symulujemy różne ścieżki z różnymi strategiami
        const neutralPath = simulateStackCost(
          current,
          effectiveTarget,
          "neutral"
        );
        const faintPath = simulateStackCost(current, effectiveTarget, "faint");
        const originPath = simulateStackCost(
          current,
          effectiveTarget,
          "origin"
        );

        // Porównujemy koszty poszczególnych ścieżek
        const paths = [
          { type: "neutral", cost: neutralPath.cost },
          { type: "faint", cost: faintPath.cost },
          { type: "origin", cost: originPath.cost },
        ];

        // Sortujemy według kosztu i wybieramy najtańszą opcję
        paths.sort((a, b) => a.cost - b.cost);

        // Wykonujemy pierwszy krok najtańszej ścieżki
        const cheapestPath = paths[0].type;

        // Dla pierwszego kroku najtańszej ścieżki
        if (cheapestPath === "origin") {
          // Zdecydowanie preferujemy Origin
          if (faintCostPerPoint <= originCostPerPoint * 0.9) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (cheapestPath === "faint") {
          // Zdecydowanie preferujemy Faint
          if (originCostPerPoint <= faintCostPerPoint * 0.9) {
            useFaintHere = false;
            useOriginHere = true;
          } else {
            useFaintHere = true;
            useOriginHere = false;
          }
        } else {
          // Neutralna ścieżka - wybieramy opcję z niższym kosztem per punkt
          if (faintCostPerPoint <= originCostPerPoint) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        }

        // Jeśli jesteśmy blisko celu, wybieramy opcję z najmniejszym overshotem
        if (remainingToTarget < 10) {
          const faintOver =
            faintIncrease > remainingToTarget
              ? faintIncrease - remainingToTarget
              : 0;
          const originOver =
            originIncrease > remainingToTarget
              ? originIncrease - remainingToTarget
              : 0;

          if (faintOver < originOver) {
            useFaintHere = true;
            useOriginHere = false;
          } else if (originOver < faintOver) {
            useFaintHere = false;
            useOriginHere = true;
          }
          // Jeśli overshoot jest identyczny, pozostawiamy wybór z symulacji
        }
      } else if (originPreference === "balanced") {
        // W trybie balanced staramy się używać obu typów Originów w miarę równomiernie
        // ale z uwzględnieniem rozsądnego kosztu

        // Sprawdzamy bieżące wykorzystanie Originów
        const totalUsed = faintUsed + originUsed;
        const faintRatio = totalUsed > 0 ? faintUsed / totalUsed : 0.5;
        const originRatio = totalUsed > 0 ? originUsed / totalUsed : 0.5;

        // Akceptowalna różnica w koszcie per punkt (im bardziej niezbalansowany stosunek, tym większa tolerancja)
        let balanceCostTolerance = 0.1; // Bazowa tolerancja 10%

        // Jeśli użycie jest niezbalansowane, zwiększamy tolerancję kosztu dla mniej używanego typu
        if (faintRatio < 0.3) {
          // Za mało Faint - zwiększamy tolerancję dla Faint
          const adjustment = Math.min(0.2, (0.3 - faintRatio) * 1.0);
          balanceCostTolerance = 0.1 + adjustment;

          // Preferujemy Faint dla wyrównania, chyba że jest znacząco droższy
          if (
            faintCostPerPoint <=
            originCostPerPoint * (1 + balanceCostTolerance)
          ) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (originRatio < 0.3) {
          // Za mało Origin - zwiększamy tolerancję dla Origin
          const adjustment = Math.min(0.2, (0.3 - originRatio) * 1.0);
          balanceCostTolerance = 0.1 + adjustment;

          // Preferujemy Origin dla wyrównania, chyba że jest znacząco droższy
          if (
            originCostPerPoint <=
            faintCostPerPoint * (1 + balanceCostTolerance)
          ) {
            useFaintHere = false;
            useOriginHere = true;
          } else {
            useFaintHere = true;
            useOriginHere = false;
          }
        } else {
          // Zbalansowane użycie - decyduje koszt, ale z małą tolerancją
          if (faintCostPerPoint <= originCostPerPoint) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        }
      } else if (preferOrigin) {
        // Preferujemy Origin - używamy go, chyba że Faint jest znacząco tańszy
        if (faintCostPerPoint < originCostPerPoint * (1 - costTolerance)) {
          useFaintHere = true;
        } else {
          useOriginHere = true;
        }
      } else if (preferFaint) {
        // Preferujemy Faint - używamy go, chyba że Origin jest znacząco tańszy
        if (originCostPerPoint < faintCostPerPoint * (1 - costTolerance)) {
          useOriginHere = true;
        } else {
          useFaintHere = true;
        }
      } else {
        // Zapasowa opcja dla bezpieczeństwa
        if (faintCostPerPoint <= originCostPerPoint) {
          useFaintHere = true;
        } else {
          useOriginHere = true;
        }
      }

      // Sprawdź, czy nie przekroczymy celu zbyt mocno
      if (remainingToTarget < 10) {
        const faintOvershoot =
          faintIncrease > remainingToTarget
            ? faintIncrease - remainingToTarget
            : 0;
        const originOvershoot =
          originIncrease > remainingToTarget
            ? originIncrease - remainingToTarget
            : 0;

        // Różne podejście w zależności od preferencji
        if (originPreference === "cheapest") {
          // W trybie cheapest zawsze wybieramy opcję dającą łącznie najniższy koszt
          // Koszt to nie tylko cena danego origina, ale też uwzględnienie przekroczenia celu
          const effectiveFaintCost = faintCostPerPoint * remainingToTarget;
          const effectiveOriginCost = originCostPerPoint * remainingToTarget;

          if (effectiveFaintCost <= effectiveOriginCost) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (originPreference === "balanced") {
          // Dla trybu balanced przy dobijaniu sprawdzamy również balans
          const totalUsed = faintUsed + originUsed;
          const faintRatio = totalUsed > 0 ? faintUsed / totalUsed : 0.5;
          const originRatio = totalUsed > 0 ? originUsed / totalUsed : 0.5;

          // Jeśli użycie jest bardzo niezbalansowane, stawiamy balans ponad overshoota
          if (faintRatio < 0.25 && faintOvershoot <= originOvershoot * 1.5) {
            // Wyraźnie za mało Faint używamy go nawet kosztem overshootu
            useFaintHere = true;
            useOriginHere = false;
          } else if (
            originRatio < 0.25 &&
            originOvershoot <= faintOvershoot * 1.5
          ) {
            // Wyraźnie za mało Origin używamy go nawet kosztem overshootu
            useFaintHere = false;
            useOriginHere = true;
          } else {
            // Przy zbalansowanym użyciu wybierz ten, który daje mniej overshootu
            if (faintOvershoot < originOvershoot) {
              useFaintHere = true;
              useOriginHere = false;
            } else {
              useFaintHere = false;
              useOriginHere = true;
            }
          }
        } else {
          // Dla opcji z preferencją, dopuszczamy pewną tolerancję overshootu
          // wynikającą z preferencji użytkownika
          let overshootTolerance = 3; // Tolerancja bazowa

          if (
            (originPreference === "origin" && useOriginHere) ||
            (originPreference === "faint" && useFaintHere)
          ) {
            overshootTolerance = 5; // Większa tolerancja dla preferowanego typu
          }

          // Wybierz ten, który mniej przekracza cel z uwzględnieniem tolerancji
          if (faintOvershoot > originOvershoot + overshootTolerance) {
            useFaintHere = false;
            useOriginHere = true;
          } else if (originOvershoot > faintOvershoot + overshootTolerance) {
            useFaintHere = true;
            useOriginHere = false;
          }
        }
      }
    }

    // Wykonaj wybrany krok
    let stepIncrease = 0;
    let stepCost = 0;
    let stepType = "";

    if (useEventHere) {
      stepIncrease = eventIncrease;
      stepCost = 0;
      stepType = "event";
      eventUsed++;
      eventLeft--;
    } else if (useFaintHere) {
      stepIncrease = faintIncrease;
      stepCost = faintPrice;
      stepType = "faint";
      faintUsed++;
    } else {
      stepIncrease = originIncrease;
      stepCost = originPrice;
      stepType = "origin";
      originUsed++;
    }

    // Sprawdź czy nie przekroczymy celu
    if (current + stepIncrease > effectiveTarget) {
      // Jeśli jesteśmy bardzo blisko celu (w granicy 5 punktów), zaakceptujmy przekroczenie
      if (effectiveTarget - current <= 5) {
        current += stepIncrease;
        cost += stepCost;
        progress.push(current);

        steps.push({
          startStack: current - stepIncrease,
          type: translations[currentLanguage].steps[stepType + "Origin"],
          increase: stepIncrease,
          endStack: current,
          cost: stepCost,
        });

        break; // Kończymy, bo przekroczyliśmy cel
      }
    }

    // Normalnie wykonaj krok
    current += stepIncrease;
    cost += stepCost;
    progress.push(current);

    steps.push({
      startStack: current - stepIncrease,
      type: translations[currentLanguage].steps[stepType + "Origin"],
      increase: stepIncrease,
      endStack: current,
      cost: stepCost,
    });
  }

  let finalStack = current;

  // Dodanie Valk's Cry do końcowego wyniku jeśli były używane
  if (valksCry > 0) {
    finalStack += valksCry;
    progress.push(finalStack);

    // Dodajemy krok z Valk's Cry do listy kroków
    steps.push({
      startStack: current,
      type: translations[currentLanguage].steps.valksAdded,
      increase: valksCry,
      endStack: current + valksCry,
      cost: 0,
    });

    current = finalStack;
  }

  // Dodanie Permanent Enhancement Chance do końcowego wyniku jeśli było używane
  if (permEnch > 0) {
    finalStack = current + permEnch;
    progress.push(finalStack);

    // Dodajemy krok z Permanent Enhancement do listy kroków
    steps.push({
      startStack: current,
      type: translations[currentLanguage].steps.permEnchAdded,
      increase: permEnch,
      endStack: finalStack,
      cost: 0,
    });

    current = finalStack;
  }

  // Wyświetl wyniki
  const t = translations[currentLanguage].results;
  document.getElementById("results").innerHTML = `
        <strong>${t.results}</strong><br>
        ${useEvent ? `${t.eventOriginUsed} ${eventUsed}<br>` : ""}
        ${t.originUsed} ${originUsed}<br>
        ${t.faintUsed} ${faintUsed}<br>
        ${totalBonus > 0 ? `${t.effectiveTarget} ${effectiveTarget}<br>` : ""}
        <br>
        <strong>${t.totalCost} ${formatNumber(
    cost,
    useCompactNumbers,
    currentLanguage
  )} ${t.silver}</strong>
    `;

  // Renderuj listę kroków i wykres
  renderStepList(steps, useCompactNumbers);
  renderChart(progress);

  return {
    eventUsed,
    originUsed,
    faintUsed,
    cost,
    steps,
    progress,
    finalStack,
  };
}

/**
 * Funkcja symulująca wynik kalkulacji dla danego trybu preferencji
 * Nie wyświetla wyników na UI, tylko zwraca obliczenia
 */
function simulateCalculation(params) {
  const {
    targetInput,
    startStack,
    useEvent,
    useSmartEvent,
    eventLimit,
    eventThreshold,
    originPrice,
    faintPrice,
    valksCry,
    permEnch,
    originPreference,
  } = params;

  // Obliczamy efektywny docelowy stack (bez Valks Cry i Permanent Enhancement)
  const totalBonus = valksCry + permEnch;
  const effectiveTarget = Math.max(100, targetInput - totalBonus);

  // Zaczynamy od wartości startowego stacka lub 100, jeśli startowy stack jest mniejszy
  let current = Math.max(startStack, 100);
  let eventLeft = eventLimit;
  let cost = 0;
  let eventUsed = 0;
  let faintUsed = 0;
  let originUsed = 0;
  let progress = [current];
  let steps = [];

  // Jeśli startStack jest większy niż 0 ale mniejszy niż 100, dodajemy informację o kroku
  if (startStack > 0 && startStack < 100) {
    steps.push({
      startStack: startStack,
      type: translations[currentLanguage].steps.initialStack,
      increase: 100 - startStack,
      endStack: 100,
      cost: 0,
    });
  }

  while (current < effectiveTarget) {
    // Ile punktów brakuje do celu
    const remainingToTarget = effectiveTarget - current;

    // Pobierz zwiększenia dla każdego typu origina
    const eventIncrease = getEventIncrease(current);
    const faintIncrease = getFaintIncrease(current);
    const originIncrease = getOriginIncrease(current);

    // Oblicz koszt per punkt dla każdego typu
    const faintCostPerPoint = faintPrice / faintIncrease;
    const originCostPerPoint = originPrice / originIncrease;

    // Podstawowe flagi służące do wyboru typu origina
    let useEventHere = false;
    let useFaintHere = false;
    let useOriginHere = false;

    // Wybierz typ origina na podstawie bieżącego stacka i pozostałych punktów
    if (useEvent && eventLeft > 0 && current >= eventThreshold) {
      if (useSmartEvent) {
        // NOWA LOGIKA SMART:
        // 1. Używaj eventowych prawie wyłącznie do dobijania końcowego stacka
        // 2. Unikaj zużywania dużych originów gdy potrzebujemy niewiele punktów

        // Sprawdzamy, czy event origin jest idealny do dobicia do celu
        const perfectMatch = eventIncrease === remainingToTarget;

        // Sprawdzamy, czy event origin nie przekraczałby celu zbyt dużo
        const eventOvershoot =
          eventIncrease > remainingToTarget
            ? eventIncrease - remainingToTarget
            : 0;
        const faintOvershoot =
          faintIncrease > remainingToTarget
            ? faintIncrease - remainingToTarget
            : 0;
        const originOvershoot =
          originIncrease > remainingToTarget
            ? originIncrease - remainingToTarget
            : 0;

        // Używamy event origina gdy:
        // 1. Jesteśmy blisko celu (mniej niż 10 punktów) I event origin ma najmniejszy overshoot
        // 2. LUB event origin idealnie dobija do celu
        // 3. LUB zostało mniej niż 5 punktów do celu i event daje najmniej punktów z dostępnych

        if (perfectMatch) {
          // Perfect match - eventowy origin dobija idealnie do celu
          useEventHere = true;
        } else if (remainingToTarget <= 10) {
          // Blisko celu - wybierz typ z najmniejszym overshotem
          if (eventIncrease < faintIncrease && eventIncrease < originIncrease) {
            // Event daje najmniej punktów - idealny do dobicia
            useEventHere = true;
          } else if (
            eventOvershoot <= faintOvershoot &&
            eventOvershoot <= originOvershoot
          ) {
            // Event ma najmniejszy overshoot - najlepszy do dobicia
            useEventHere = true;
          }
        }
        // Dodatkowy warunek: gdy brakuje niewiele punktów, a next najlepszy origin dałby dużo za dużo
        else if (remainingToTarget <= 5) {
          const nextBestIncrease =
            faintCostPerPoint <= originCostPerPoint
              ? faintIncrease
              : originIncrease;
          const nextBestOvershoot = nextBestIncrease - remainingToTarget;

          // Jeśli następny najlepszy origin przekroczyłby cel o więcej niż 5 punktów,
          // a mamy eventowy который nie przekracza tak mocno, użyj eventowego
          if (nextBestOvershoot > 5 && eventOvershoot <= nextBestOvershoot) {
            useEventHere = true;
          }
        }
      } else {
        // Jeśli nie używamy smart event, zawsze używaj eventowych jeśli są dostępne
        useEventHere = true;
      }
    }

    // Jeśli nie używamy eventowego, wybierz pomiędzy faint i origin
    if (!useEventHere) {
      // Dodajemy tolerancję kosztową w oparciu o preferencję użytkownika
      let costTolerance = 0.05; // 5% tolerancji domyślnie
      let preferFaint = false;
      let preferOrigin = false;

      if (originPreference === "origin") {
        preferOrigin = true;
        costTolerance = 0.15; // 15% tolerancji dla preferowanych Origin
      } else if (originPreference === "faint") {
        preferFaint = true;
        costTolerance = 0.15; // 15% tolerancji dla preferowanych Faint Origin
      }

      // Wybierz typ z uwzględnieniem preferencji
      if (originPreference === "cheapest") {
        // W trybie cheapest potrzebujemy głębszej symulacji różnych ścieżek stackowania
        // aby znaleźć naprawdę najtańszą opcję

        // Funkcja symulująca koszt stackowania od current do effectiveTarget
        const simulateStackCost = (startStack, targetStack, pathBias) => {
          let simCurrent = startStack;
          let simCost = 0;
          let simFaintUsed = 0;
          let simOriginUsed = 0;

          while (simCurrent < targetStack) {
            // Pobierz przyrosty dla aktualnego stacka
            const simFaintInc = getFaintIncrease(simCurrent);
            const simOriginInc = getOriginIncrease(simCurrent);

            // Oblicz koszt per punkt
            const simFaintCostPP = faintPrice / simFaintInc;
            const simOriginCostPP = originPrice / simOriginInc;

            // Ile punktów brakuje do celu
            const simRemaining = targetStack - simCurrent;

            // Czy jesteśmy blisko celu? (w granicy 10 pkt)
            const nearTarget = simRemaining < 10;

            // Różne strategie wyboru w zależności od biasu ścieżki
            let useFaintSim = false;

            if (pathBias === "faint") {
              // Preferuj Faint, ale z uwzględnieniem efektywności kosztowej
              useFaintSim = simFaintCostPP * 0.9 <= simOriginCostPP;
            } else if (pathBias === "origin") {
              // Preferuj Origin, ale z uwzględnieniem efektywności kosztowej
              useFaintSim = simFaintCostPP <= simOriginCostPP * 0.9;
            } else if (nearTarget) {
              // Blisko celu - wybierz opcję z najmniejszym overshotem
              const faintOver =
                simFaintInc > simRemaining ? simFaintInc - simRemaining : 0;
              const originOver =
                simOriginInc > simRemaining ? simOriginInc - simRemaining : 0;

              // Ekstra logika dla overshoota - uwzględniamy też koszt per punkt
              if (faintOver === 0 && originOver === 0) {
                // Obie opcje idealnie dobijają - wybieramy tańszą
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              } else if (faintOver === 0) {
                // Tylko Faint idealnie dobija
                useFaintSim = true;
              } else if (originOver === 0) {
                // Tylko Origin idealnie dobija
                useFaintSim = false;
              } else if (Math.abs(faintOver - originOver) <= 1) {
                // Overshoot jest bardzo podobny - wybieramy tańszą opcję
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              } else if (faintOver < originOver) {
                useFaintSim = true;
              } else {
                useFaintSim = false;
              }
            } else {
              // Standardowo - wybierz tańszą opcję per punkt
              // Dodajemy specjalną logikę dla stacka 187
              if (simCurrent >= 180 && simCurrent <= 190) {
                // Dla stacków w okolicy 187, dodajemy dodatkowy bias na Origin jeśli
                // koszt per punkt jest zbliżony
                if (simOriginCostPP <= simFaintCostPP * 1.05) {
                  useFaintSim = false; // Preferujemy Origin
                } else {
                  useFaintSim = true;
                }
              } else {
                // Dla pozostałych stacków, po prostu wybieramy tańszą opcję
                useFaintSim = simFaintCostPP <= simOriginCostPP;
              }
            }

            // Wykonaj krok w symulacji
            if (useFaintSim) {
              // Używamy Faint Origin
              simCurrent += simFaintInc;
              simCost += faintPrice;
              simFaintUsed++;

              // Korekta jeśli przekroczyliśmy cel
              if (simCurrent > targetStack && nearTarget) {
                // Proporcjonalnie zmniejszamy koszt ostatniego kroku jeśli przekroczyliśmy cel
                const exceededBy = simCurrent - targetStack;
                const usedRatio = (simFaintInc - exceededBy) / simFaintInc;
                simCost -= faintPrice * (1 - usedRatio);
                break; // Kończymy symulację
              }
            } else {
              // Używamy Origin
              simCurrent += simOriginInc;
              simCost += originPrice;
              simOriginUsed++;

              // Korekta jeśli przekroczyliśmy cel
              if (simCurrent > targetStack && nearTarget) {
                // Proporcjonalnie zmniejszamy koszt ostatniego kroku jeśli przekroczyliśmy cel
                const exceededBy = simCurrent - targetStack;
                const usedRatio = (simOriginInc - exceededBy) / simOriginInc;
                simCost -= originPrice * (1 - usedRatio);
                break; // Kończymy symulację
              }
            }

            // Limity bezpieczeństwa aby uniknąć nieskończonych pętli
            if (simFaintUsed + simOriginUsed > 50) {
              break;
            }
          }

          return {
            cost: simCost,
            faintUsed: simFaintUsed,
            originUsed: simOriginUsed,
          };
        };

        // Symulujemy różne ścieżki z różnymi strategiami
        const neutralPath = simulateStackCost(
          current,
          effectiveTarget,
          "neutral"
        );
        const faintPath = simulateStackCost(current, effectiveTarget, "faint");
        const originPath = simulateStackCost(
          current,
          effectiveTarget,
          "origin"
        );

        // Porównujemy koszty poszczególnych ścieżek
        const paths = [
          { type: "neutral", cost: neutralPath.cost },
          { type: "faint", cost: faintPath.cost },
          { type: "origin", cost: originPath.cost },
        ];

        // Sortujemy według kosztu i wybieramy najtańszą opcję
        paths.sort((a, b) => a.cost - b.cost);

        // Wykonujemy pierwszy krok najtańszej ścieżki
        const cheapestPath = paths[0].type;

        // Dla pierwszego kroku najtańszej ścieżki
        if (cheapestPath === "origin") {
          // Zdecydowanie preferujemy Origin
          if (faintCostPerPoint <= originCostPerPoint * 0.9) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (cheapestPath === "faint") {
          // Zdecydowanie preferujemy Faint
          if (originCostPerPoint <= faintCostPerPoint * 0.9) {
            useFaintHere = false;
            useOriginHere = true;
          } else {
            useFaintHere = true;
            useOriginHere = false;
          }
        } else {
          // Neutralna ścieżka - wybieramy opcję z niższym kosztem per punkt
          if (faintCostPerPoint <= originCostPerPoint) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        }

        // Jeśli jesteśmy blisko celu, wybieramy opcję z najmniejszym overshotem
        if (remainingToTarget < 10) {
          const faintOver =
            faintIncrease > remainingToTarget
              ? faintIncrease - remainingToTarget
              : 0;
          const originOver =
            originIncrease > remainingToTarget
              ? originIncrease - remainingToTarget
              : 0;

          if (faintOver < originOver) {
            useFaintHere = true;
            useOriginHere = false;
          } else if (originOver < faintOver) {
            useFaintHere = false;
            useOriginHere = true;
          }
          // Jeśli overshoot jest identyczny, pozostawiamy wybór z symulacji
        }
      } else if (originPreference === "balanced") {
        // W trybie balanced staramy się używać obu typów Originów w miarę równomiernie
        // ale z uwzględnieniem rozsądnego kosztu

        // Sprawdzamy bieżące wykorzystanie Originów
        const totalUsed = faintUsed + originUsed;
        const faintRatio = totalUsed > 0 ? faintUsed / totalUsed : 0.5;
        const originRatio = totalUsed > 0 ? originUsed / totalUsed : 0.5;

        // Akceptowalna różnica w koszcie per punkt (im bardziej niezbalansowany stosunek, tym większa tolerancja)
        let balanceCostTolerance = 0.1; // Bazowa tolerancja 10%

        // Jeśli użycie jest niezbalansowane, zwiększamy tolerancję kosztu dla mniej używanego typu
        if (faintRatio < 0.3) {
          // Za mało Faint - zwiększamy tolerancję dla Faint
          const adjustment = Math.min(0.2, (0.3 - faintRatio) * 1.0);
          balanceCostTolerance = 0.1 + adjustment;

          // Preferujemy Faint dla wyrównania, chyba że jest znacząco droższy
          if (
            faintCostPerPoint <=
            originCostPerPoint * (1 + balanceCostTolerance)
          ) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (originRatio < 0.3) {
          // Za mało Origin - zwiększamy tolerancję dla Origin
          const adjustment = Math.min(0.2, (0.3 - originRatio) * 1.0);
          balanceCostTolerance = 0.1 + adjustment;

          // Preferujemy Origin dla wyrównania, chyba że jest znacząco droższy
          if (
            originCostPerPoint <=
            faintCostPerPoint * (1 + balanceCostTolerance)
          ) {
            useFaintHere = false;
            useOriginHere = true;
          } else {
            useFaintHere = true;
            useOriginHere = false;
          }
        } else {
          // Zbalansowane użycie - decyduje koszt, ale z małą tolerancją
          if (faintCostPerPoint <= originCostPerPoint) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        }
      } else if (preferOrigin) {
        // Preferujemy Origin - używamy go, chyba że Faint jest znacząco tańszy
        if (faintCostPerPoint < originCostPerPoint * (1 - costTolerance)) {
          useFaintHere = true;
        } else {
          useOriginHere = true;
        }
      } else if (preferFaint) {
        // Preferujemy Faint - używamy go, chyba że Origin jest znacząco tańszy
        if (originCostPerPoint < faintCostPerPoint * (1 - costTolerance)) {
          useOriginHere = true;
        } else {
          useFaintHere = true;
        }
      } else {
        // Zapasowa opcja dla bezpieczeństwa
        if (faintCostPerPoint <= originCostPerPoint) {
          useFaintHere = true;
        } else {
          useOriginHere = true;
        }
      }

      // Sprawdź, czy nie przekroczymy celu zbyt mocno
      if (remainingToTarget < 10) {
        const faintOvershoot =
          faintIncrease > remainingToTarget
            ? faintIncrease - remainingToTarget
            : 0;
        const originOvershoot =
          originIncrease > remainingToTarget
            ? originIncrease - remainingToTarget
            : 0;

        // Różne podejście w zależności od preferencji
        if (originPreference === "cheapest") {
          // W trybie cheapest zawsze wybieramy opcję dającą łącznie najniższy koszt
          // Koszt to nie tylko cena danego origina, ale też uwzględnienie przekroczenia celu
          const effectiveFaintCost = faintCostPerPoint * remainingToTarget;
          const effectiveOriginCost = originCostPerPoint * remainingToTarget;

          if (effectiveFaintCost <= effectiveOriginCost) {
            useFaintHere = true;
            useOriginHere = false;
          } else {
            useFaintHere = false;
            useOriginHere = true;
          }
        } else if (originPreference === "balanced") {
          // Dla trybu balanced przy dobijaniu sprawdzamy również balans
          const totalUsed = faintUsed + originUsed;
          const faintRatio = totalUsed > 0 ? faintUsed / totalUsed : 0.5;
          const originRatio = totalUsed > 0 ? originUsed / totalUsed : 0.5;

          // Jeśli użycie jest bardzo niezbalansowane, stawiamy balans ponad overshoota
          if (faintRatio < 0.25 && faintOvershoot <= originOvershoot * 1.5) {
            // Wyraźnie za mało Faint używamy go nawet kosztem overshootu
            useFaintHere = true;
            useOriginHere = false;
          } else if (
            originRatio < 0.25 &&
            originOvershoot <= faintOvershoot * 1.5
          ) {
            // Wyraźnie za mało Origin używamy go nawet kosztem overshootu
            useFaintHere = false;
            useOriginHere = true;
          } else {
            // Przy zbalansowanym użyciu wybierz ten, który daje mniej overshootu
            if (faintOvershoot < originOvershoot) {
              useFaintHere = true;
              useOriginHere = false;
            } else {
              useFaintHere = false;
              useOriginHere = true;
            }
          }
        } else {
          // Dla opcji z preferencją, dopuszczamy pewną tolerancję overshootu
          // wynikającą z preferencji użytkownika
          let overshootTolerance = 3; // Tolerancja bazowa

          if (
            (originPreference === "origin" && useOriginHere) ||
            (originPreference === "faint" && useFaintHere)
          ) {
            overshootTolerance = 5; // Większa tolerancja dla preferowanego typu
          }

          // Wybierz ten, który mniej przekracza cel z uwzględnieniem tolerancji
          if (faintOvershoot > originOvershoot + overshootTolerance) {
            useFaintHere = false;
            useOriginHere = true;
          } else if (originOvershoot > faintOvershoot + overshootTolerance) {
            useFaintHere = true;
            useOriginHere = false;
          }
        }
      }
    }

    // Wykonaj wybrany krok
    let stepIncrease = 0;
    let stepCost = 0;
    let stepType = "";

    if (useEventHere) {
      stepIncrease = eventIncrease;
      stepCost = 0;
      stepType = "event";
      eventUsed++;
      eventLeft--;
    } else if (useFaintHere) {
      stepIncrease = faintIncrease;
      stepCost = faintPrice;
      stepType = "faint";
      faintUsed++;
    } else {
      stepIncrease = originIncrease;
      stepCost = originPrice;
      stepType = "origin";
      originUsed++;
    }

    // Sprawdź czy nie przekroczymy celu
    if (current + stepIncrease > effectiveTarget) {
      // Jeśli jesteśmy bardzo blisko celu (w granicy 5 punktów), zaakceptujmy przekroczenie
      if (effectiveTarget - current <= 5) {
        current += stepIncrease;
        cost += stepCost;
        progress.push(current);

        steps.push({
          startStack: current - stepIncrease,
          type: translations[currentLanguage].steps[stepType + "Origin"],
          increase: stepIncrease,
          endStack: current,
          cost: stepCost,
        });

        break; // Kończymy, bo przekroczyliśmy cel
      }
    }

    // Normalnie wykonaj krok
    current += stepIncrease;
    cost += stepCost;
    progress.push(current);

    steps.push({
      startStack: current - stepIncrease,
      type: translations[currentLanguage].steps[stepType + "Origin"],
      increase: stepIncrease,
      endStack: current,
      cost: stepCost,
    });
  }

  let finalStack = current;

  // Dodanie Valk's Cry do końcowego wyniku jeśli były używane
  if (valksCry > 0) {
    finalStack += valksCry;
    progress.push(finalStack);

    // Dodajemy krok z Valk's Cry do listy kroków
    steps.push({
      startStack: current,
      type: translations[currentLanguage].steps.valksAdded,
      increase: valksCry,
      endStack: current + valksCry,
      cost: 0,
    });

    current = finalStack;
  }

  // Dodanie Permanent Enhancement Chance do końcowego wyniku jeśli było używane
  if (permEnch > 0) {
    finalStack = current + permEnch;
    progress.push(finalStack);

    // Dodajemy krok z Permanent Enhancement do listy kroków
    steps.push({
      startStack: current,
      type: translations[currentLanguage].steps.permEnchAdded,
      increase: permEnch,
      endStack: finalStack,
      cost: 0,
    });

    current = finalStack;
  }

  return {
    eventUsed,
    originUsed,
    faintUsed,
    cost,
    steps,
    progress,
    finalStack,
  };
}

/**
 * Funkcja służąca do wyświetlenia wyników dla najlepszej ścieżki
 */
function calculateWithResult(bestResult, params) {
  const { useEvent, useCompactNumbers } = params;

  const {
    eventUsed,
    originUsed,
    faintUsed,
    cost,
    steps,
    progress,
    finalStack,
  } = bestResult;

  // Wyświetl wyniki
  const t = translations[currentLanguage].results;
  document.getElementById("results").innerHTML = `
        <strong>${t.results}</strong><br>
        ${useEvent ? `${t.eventOriginUsed} ${eventUsed}<br>` : ""}
        ${t.originUsed} ${originUsed}<br>
        ${t.faintUsed} ${faintUsed}<br>
        ${
          params.totalBonus > 0
            ? `${t.effectiveTarget} ${params.effectiveTarget}<br>`
            : ""
        }
        <br>
        <strong>${t.totalCost} ${formatNumber(
    cost,
    useCompactNumbers,
    currentLanguage
  )} ${t.silver}</strong>
    `;

  // Renderuj listę kroków i wykres
  renderStepList(steps, useCompactNumbers);
  renderChart(progress);

  return bestResult;
}
