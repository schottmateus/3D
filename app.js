const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const KOBRA_X_POWER_W = 400;
const RGE_SANTA_MARIA_RATE_PER_KWH = 1.3461;
const PRINTER_VALUE_BRL = 3500;
const MAINTENANCE_RESERVE_BRL = 500;
const USEFUL_LIFE_HOURS = 5000;
const FAILURE_RATE_PERCENT = 7;
const BASE_SALE_PROFIT_PERCENT = 100;
const MINIMUM_DISCOUNT_PERCENT = 15;
const CUSTOM_ADDITIONAL_PERCENT = 5;
const BULK_DISCOUNT_PERCENT = 25;
const ROUNDING_MODE = "integer";

const fields = {
  filamentConsumption: document.getElementById("filamentConsumption"),
  filamentType: document.getElementById("filamentType"),
  filamentCostPerKg: document.getElementById("filamentCostPerKg"),
  printHours: document.getElementById("printHours"),
  manualWorkMinutes: document.getElementById("manualWorkMinutes"),
  hourlyRate: document.getElementById("hourlyRate"),
};

const outputs = {
  filamentCostOut: document.getElementById("filamentCostOut"),
  energyCostOut: document.getElementById("energyCostOut"),
  machineCostOut: document.getElementById("machineCostOut"),
  laborCostOut: document.getElementById("laborCostOut"),
  failureCostOut: document.getElementById("failureCostOut"),
  totalCostOut: document.getElementById("totalCostOut"),
  minimumPriceOut: document.getElementById("minimumPriceOut"),
  salePriceOut: document.getElementById("salePriceOut"),
  customPriceOut: document.getElementById("customPriceOut"),
  bulkPriceOut: document.getElementById("bulkPriceOut"),
  bulkProfitOut: document.getElementById("bulkProfitOut"),
  minimumProfitOut: document.getElementById("minimumProfitOut"),
  saleProfitOut: document.getElementById("saleProfitOut"),
  customProfitOut: document.getElementById("customProfitOut"),
  warning: document.getElementById("warning"),
  donut: document.getElementById("costDonut"),
  fixedPowerOut: document.getElementById("fixedPowerOut"),
  fixedRateOut: document.getElementById("fixedRateOut"),
  fixedPrinterValueOut: document.getElementById("fixedPrinterValueOut"),
  fixedReserveOut: document.getElementById("fixedReserveOut"),
  fixedUsefulLifeOut: document.getElementById("fixedUsefulLifeOut"),
  fixedFailureRateOut: document.getElementById("fixedFailureRateOut"),
  fixedMinimumRuleOut: document.getElementById("fixedMinimumRuleOut"),
  fixedSaleRuleOut: document.getElementById("fixedSaleRuleOut"),
  fixedCustomRuleOut: document.getElementById("fixedCustomRuleOut"),
};

const defaults = {
  filamentConsumption: 120,
  filamentType: "PLA",
  filamentCostPerKg: 79.9,
  printHours: 8,
  manualWorkMinutes: 40,
  hourlyRate: 25,
};

const STORAGE_KEY = "pricing-3d-calculator-state";

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function readForm() {
  const hours = Math.max(0, Math.floor(toNumber(fields.printHours.value)));

  return {
    filamentConsumption: Math.max(0, toNumber(fields.filamentConsumption.value)),
    filamentType: fields.filamentType.value,
    filamentCostPerKg: Math.max(0, toNumber(fields.filamentCostPerKg.value)),
    printHours: hours,
    manualWorkMinutes: Math.max(0, toNumber(fields.manualWorkMinutes.value)),
    hourlyRate: Math.max(0, toNumber(fields.hourlyRate.value)),
  };
}

function applyRounding(value, mode) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (mode === "90") {
    const integerPart = Math.floor(value);
    let candidate = integerPart + 0.9;
    if (candidate < value) {
      candidate += 1;
    }
    return candidate;
  }
  if (mode === "integer") {
    return Math.round(value);
  }
  return value;
}

function updateDonut(parts, total) {
  outputs.donut.querySelectorAll(".pie-label").forEach((label) => label.remove());

  if (total <= 0) {
    outputs.donut.style.background = "conic-gradient(#274678 0deg 360deg)";
    return;
  }

  let cumulative = 0;
  const activeParts = parts
    .filter((item) => item.value > 0)
    .map((item) => {
      const share = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const start = cumulative;
      cumulative += angle;
      return {
        label: item.label,
        color: item.color,
        share,
        start,
        end: cumulative,
      };
    });

  const slices = activeParts
    .map((item) => `${item.color} ${item.start.toFixed(3)}deg ${item.end.toFixed(3)}deg`);

  outputs.donut.style.background = `conic-gradient(${slices.join(", ")})`;

  activeParts.forEach((item) => {
    const midAngleDeg = (item.start + item.end) / 2 - 90;
    const midAngle = (midAngleDeg * Math.PI) / 180;
    const radiusPercent = 36;
    const left = 50 + Math.cos(midAngle) * radiusPercent;
    const top = 50 + Math.sin(midAngle) * radiusPercent;

    const label = document.createElement("span");
    label.className = "pie-label";
    label.textContent = `${percentFormatter.format(item.share)}%`;
    label.style.left = `${left}%`;
    label.style.top = `${top}%`;
    outputs.donut.appendChild(label);
  });
}

function calculate() {
  const values = readForm();
  const printTimeHours = values.printHours;
  const failureRate = FAILURE_RATE_PERCENT / 100;
  const saleProfitRate = BASE_SALE_PROFIT_PERCENT / 100;
  const minimumDiscountRate = MINIMUM_DISCOUNT_PERCENT / 100;
  const customAdditionalRate = CUSTOM_ADDITIONAL_PERCENT / 100;

  outputs.warning.hidden = true;
  outputs.warning.textContent = "";

  const filamentCost = (values.filamentConsumption / 1000) * values.filamentCostPerKg;
  const energyCost =
    (KOBRA_X_POWER_W / 1000) * printTimeHours * RGE_SANTA_MARIA_RATE_PER_KWH;
  const machineCostPerHour = (PRINTER_VALUE_BRL + MAINTENANCE_RESERVE_BRL) / USEFUL_LIFE_HOURS;
  const machineCost = machineCostPerHour * printTimeHours;
  const laborCost = (values.manualWorkMinutes / 60) * values.hourlyRate;

  const sustainableBaseCost = filamentCost + energyCost + machineCost + laborCost;
  const failureCost = sustainableBaseCost * failureRate;
  const sustainableCostWithFailures = sustainableBaseCost + failureCost;

  const salePriceRaw = sustainableCostWithFailures * (1 + saleProfitRate);
  const minimumPriceRaw = salePriceRaw * (1 - minimumDiscountRate);
  const customPriceRaw = salePriceRaw * (1 + customAdditionalRate);
  const bulkPriceRaw = salePriceRaw * (1 - BULK_DISCOUNT_PERCENT / 100);

  let minimumPrice = applyRounding(minimumPriceRaw, ROUNDING_MODE);
  const salePrice = applyRounding(salePriceRaw, ROUNDING_MODE);
  let customPrice = applyRounding(customPriceRaw, ROUNDING_MODE);
  const bulkPrice = applyRounding(bulkPriceRaw, ROUNDING_MODE);

  if (minimumPrice >= salePrice && salePrice > 0) {
    minimumPrice = Math.max(0, salePrice - 1);
  }

  if (customPrice <= salePrice) {
    if (ROUNDING_MODE === "integer") {
      customPrice = salePrice + 1;
    } else if (ROUNDING_MODE === "90") {
      customPrice = applyRounding(salePrice + 1, ROUNDING_MODE);
    } else {
      customPrice = salePrice + 0.01;
    }
  }

  const sustainableTotalCost = sustainableCostWithFailures;
  const minimumProfitValue = minimumPrice - sustainableCostWithFailures;
  const saleProfitValue = salePrice - sustainableCostWithFailures;
  const customProfitValue = customPrice - sustainableCostWithFailures;
  const bulkProfitValue = bulkPrice - sustainableCostWithFailures;

  outputs.filamentCostOut.textContent = money(filamentCost);
  outputs.energyCostOut.textContent = money(energyCost);
  outputs.machineCostOut.textContent = money(machineCost);
  outputs.laborCostOut.textContent = money(laborCost);
  outputs.failureCostOut.textContent = money(failureCost);
  outputs.totalCostOut.textContent = money(sustainableTotalCost);

  outputs.minimumPriceOut.textContent = money(minimumPrice);
  outputs.salePriceOut.textContent = money(salePrice);
  outputs.customPriceOut.textContent = money(customPrice);
  outputs.bulkPriceOut.textContent = money(bulkPrice);
  outputs.bulkProfitOut.textContent = money(bulkProfitValue);
  outputs.minimumProfitOut.textContent = money(minimumProfitValue);
  outputs.saleProfitOut.textContent = money(saleProfitValue);
  outputs.customProfitOut.textContent = money(customProfitValue);

  updateDonut(
    [
      { label: "Filamento", value: filamentCost, color: "#75d657" },
      { label: "Energia", value: energyCost, color: "#ffc447" },
      { label: "Máquina", value: machineCost, color: "#6ba8ff" },
      { label: "Mão de obra", value: laborCost, color: "#be89ff" },
      { label: "Falhas", value: failureCost, color: "#ff7a7a" },
    ],
    sustainableTotalCost,
  );

  saveState(values);
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Não foi possível salvar os dados no navegador.", error);
  }
}

function loadState() {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    const loaded = fromStorage ? JSON.parse(fromStorage) : defaults;
    const values = { ...defaults, ...loaded };

    Object.keys(fields).forEach((key) => {
      if (values[key] !== undefined) {
        fields[key].value = values[key];
      }
    });
  } catch (error) {
    console.error("Não foi possível carregar os dados salvos. Os padrões serão usados.", error);
    Object.keys(fields).forEach((key) => {
      fields[key].value = defaults[key];
    });
  }
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", calculate);
  field.addEventListener("change", calculate);
});

loadState();
outputs.fixedPowerOut.textContent = `${KOBRA_X_POWER_W} W`;
outputs.fixedRateOut.textContent = `${money(RGE_SANTA_MARIA_RATE_PER_KWH)}/kWh`;
outputs.fixedPrinterValueOut.textContent = money(PRINTER_VALUE_BRL);
outputs.fixedReserveOut.textContent = money(MAINTENANCE_RESERVE_BRL);
outputs.fixedUsefulLifeOut.textContent = `${USEFUL_LIFE_HOURS} h`;
outputs.fixedFailureRateOut.textContent = `${FAILURE_RATE_PERCENT}%`;
outputs.fixedMinimumRuleOut.textContent = "(Preço de venda - 15%)";
outputs.fixedSaleRuleOut.textContent = "(Custo + 100%)";
outputs.fixedCustomRuleOut.textContent = "(Preço de venda + 5%)";
calculate();
