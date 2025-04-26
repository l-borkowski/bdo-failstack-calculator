/**
 * Główna funkcja kalkulatora failstacków
 * Oblicza najlepszą strategię stackowania
 */
function calculate() {
  const targetInput = parseInt(document.getElementById("targetStack").value);
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

  // Obliczamy efektywny docelowy stack (bez Valks Cry i Permanent Enhancement)
  const totalBonus = valksCry + permEnch;
  const effectiveTarget = Math.max(100, targetInput - totalBonus);

  let current = 100;
  let eventLeft = eventLimit;
  let cost = 0;
  let eventUsed = 0;
  let faintUsed = 0;
  let originUsed = 0;
  let progress = [current];
  let steps = [];

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
      // Wybierz bardziej efektywny typ
      if (faintCostPerPoint <= originCostPerPoint) {
        useFaintHere = true;
      } else {
        useOriginHere = true;
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

        // Wybierz ten, który mniej przekracza cel
        if (faintOvershoot > originOvershoot) {
          useFaintHere = false;
          useOriginHere = true;
        } else if (originOvershoot > faintOvershoot) {
          useFaintHere = true;
          useOriginHere = false;
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
