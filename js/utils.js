/**
 * Formatuje liczby w sposób czytelny
 * @param {number} num - Liczba do sformatowania
 * @param {boolean} useCompact - Czy używać kompaktowego formatu
 * @param {string} language - Język (pl/en)
 * @returns {string} Sformatowana liczba
 */
function formatNumber(num, useCompact, language) {
  if (!useCompact) {
    return num.toLocaleString();
  }

  const currentLocale = language === "pl" ? "pl-PL" : "en-US";

  if (num >= 1000000000) {
    // Zamiana z toFixed(2) na prostsze formatowanie
    const billions = Math.floor(num / 10000000) / 100;
    const suffix = language === "pl" ? " mld" : " bil";
    // Usuń zera po przecinku jeśli to liczba całkowita
    return billions % 1 === 0 ? billions + suffix : billions + suffix;
  } else if (num >= 1000000) {
    // Zamiana z toFixed(2) na prostsze formatowanie
    const millions = Math.floor(num / 10000) / 100;
    const suffix = language === "pl" ? " mln" : " mil";
    // Usuń zera po przecinku jeśli to liczba całkowita
    return millions % 1 === 0 ? millions + suffix : millions + suffix;
  } else if (num >= 1000) {
    // Zamiana z toFixed(2) na prostsze formatowanie
    const thousands = Math.floor(num / 10) / 100;
    // Usuń zera po przecinku jeśli to liczba całkowita
    return thousands % 1 === 0 ? thousands + " k" : thousands + " k";
  }

  return num.toLocaleString(currentLocale);
}

/**
 * Zwraca przyrost dla eventowego Origin of Dark Hunger
 * @param {number} stack - Aktualny poziom stacka
 * @returns {number} Przyrost punktów
 */
function getEventIncrease(stack) {
  if (stack <= 104) return 6;
  else if (stack <= 116) return 5;
  else if (stack <= 136) return 4;
  else if (stack <= 167) return 3;
  else if (stack <= 209) return 2;
  else return 1;
}

/**
 * Zwraca przyrost dla Faint Origin of Dark Hunger
 * @param {number} stack - Aktualny poziom stacka
 * @returns {number} Przyrost punktów
 */
function getFaintIncrease(stack) {
  if (stack <= 104) return 13;
  else if (stack <= 117) return 11;
  else if (stack <= 134) return 9;
  else if (stack <= 146) return 8;
  else if (stack <= 163) return 7;
  else if (stack <= 205) return 5;
  else if (stack <= 228) return 4;
  else if (stack <= 267) return 3;
  else return 2;
}

/**
 * Zwraca przyrost dla normalnego Origin of Dark Hunger
 * @param {number} stack - Aktualny poziom stacka
 * @returns {number} Przyrost punktów
 */
function getOriginIncrease(stack) {
  if (stack <= 101) return 26;
  else if (stack <= 105) return 25;
  else if (stack <= 108) return 24;
  else if (stack <= 111) return 23;
  else if (stack <= 115) return 22;
  else if (stack <= 124) return 20;
  else if (stack <= 129) return 19;
  else if (stack <= 134) return 18;
  else if (stack <= 141) return 17;
  else if (stack <= 148) return 16;
  else if (stack <= 156) return 15;
  else if (stack <= 165) return 14;
  else if (stack <= 175) return 13;
  else if (stack <= 186) return 12;
  else if (stack <= 206) return 10;
  else if (stack <= 217) return 9;
  else if (stack <= 235) return 8;
  else if (stack <= 256) return 7;
  else if (stack <= 290) return 6;
  else if (stack <= 297) return 4;
  else if (stack <= 298) return 3;
  else return 2;
}

/**
 * Oblicza wartość stacka per silver
 * @param {number} stack - Aktualny poziom stacka
 * @param {number} increase - Przyrost punktów
 * @param {number} cost - Koszt
 * @returns {number} Wartość per silver
 */
function getValuePerSilver(stack, increase, cost) {
  if (cost === 0) return Infinity;
  return increase / cost;
}

// Export dla modułów JS
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    formatNumber,
    getEventIncrease,
    getFaintIncrease,
    getOriginIncrease,
    getValuePerSilver,
  };
}
