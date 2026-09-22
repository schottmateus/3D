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

const fields = {
  filamentConsumption: document.getElementById("filamentConsumption"),
  filamentType: document.getElementById("filamentType"),
  filamentCostPerKg: document.getElementById("filamentCostPerKg"),
  printHours: document.getElementById("printHours"),
  salesFeePercent: document.getElementById("salesFeePercent"),
  packagingCost: document.getElementById("packagingCost"),
  extraCost: document.getElementById("extraCost"),
  maintenanceReserve: document.getElementById("maintenanceReserve"),
  usefulLifeHours: document.getElementById("usefulLifeHours"),
  failureRatePercent: document.getElementById("failureRatePercent"),
  manualWorkMinutes: document.getElementById("manualWorkMinutes"),
  hourlyRate: document.getElementById("hourlyRate"),
  desiredProfitPercent: document.getElementById("desiredProfitPercent"),
  customPremiumPercent: document.getElementById("customPremiumPercent"),
  roundingMode: document.getElementById("roundingMode"),
};

const outputs = {
  filamentCostOut: document.getElementById("filamentCostOut"),
  energyCostOut: document.getElementById("energyCostOut"),
  machineCostOut: document.getElementById("machineCostOut"),
  laborCostOut: document.getElementById("laborCostOut"),
  failureCostOut: document.getElementById("failureCostOut"),
  salesFeeOut: document.getElementById("salesFeeOut"),
  packagingOut: document.getElementById("packagingOut"),
  extraOut: document.getElementById("extraOut"),
  totalCostOut: document.getElementById("totalCostOut"),
  minimumPriceOut: document.getElementById("minimumPriceOut"),
  sustainablePriceOut: document.getElementById("sustainablePriceOut"),
  customPriceOut: document.getElementById("customPriceOut"),
  profitValueOut: document.getElementById("profitValueOut"),
  profitMarginOut: document.getElementById("profitMarginOut"),
  machineCostPerHourOut: document.getElementById("machineCostPerHourOut"),
  warning: document.getElementById("warning"),
  donut: document.getElementById("costDonut"),
  legend: document.getElementById("legend"),
  fixedPowerOut: document.getElementById("fixedPowerOut"),
  fixedRateOut: document.getElementById("fixedRateOut"),
  fixedPrinterValueOut: document.getElementById("fixedPrinterValueOut"),
};

const defaults = {
  filamentConsumption: 120,
  filamentType: "PLA",
  filamentCostPerKg: 79.9,
  printHours: 8,
  salesFeePercent: 16.4,
  packagingCost: 1.2,
  extraCost: 0.0,
  maintenanceReserve: 500,
  usefulLifeHours: 5000,
  failureRatePercent: 7,
  manualWorkMinutes: 40,
  hourlyRate: 25,
  desiredProfitPercent: 30,
  customPremiumPercent: 20,
  roundingMode: "90",
};

const STORAGE_KEY = "pricing-3d-calculator-state";

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function money(value) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function percentage(value) {
  return `${percentFormatter.format(Number.isFinite(value) ? value : 0)}%`;
}

function readForm() {
  const hours = Math.max(0, Math.floor(toNumber(fields.printHours.value)));
  const salesFeePercent = clamp(toNumber(fields.salesFeePercent.value), 0, 99.99);

  return {
    filamentConsumption: Math.max(0, toNumber(fields.filamentConsumption.value)),
    filamentType: fields.filamentType.value,
    filamentCostPerKg: Math.max(0, toNumber(fields.filamentCostPerKg.value)),
    printHours: hours,
    salesFeePercent,
    packagingCost: Math.max(0, toNumber(fields.packagingCost.value)),
    extraCost: Math.max(0, toNumber(fields.extraCost.value)),
    maintenanceReserve: Math.max(0, toNumber(fields.maintenanceReserve.value)),
    usefulLifeHours: Math.max(1, Math.floor(toNumber(fields.usefulLifeHours.value))),
    failureRatePercent: Math.max(0, toNumber(fields.failureRatePercent.value)),
    manualWorkMinutes: Math.max(0, toNumber(fields.manualWorkMinutes.value)),
    hourlyRate: Math.max(0, toNumber(fields.hourlyRate.value)),
    desiredProfitPercent: Math.max(0, toNumber(fields.desiredProfitPercent.value)),
    customPremiumPercent: Math.max(0, toNumber(fields.customPremiumPercent.value)),
    roundingMode: fields.roundingMode.value,
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

function priceFromNet(netValue, salesFeeRate) {
  if (salesFeeRate >= 1) {
    return 0;
  }
  return netValue / (1 - salesFeeRate);
}

function buildLegendItems(parts, total) {
  return parts
    .filter((item) => item.value > 0)
    .map((item) => {
      const share = total > 0 ? (item.value / total) * 100 : 0;
      return `<li><label><span class="dot" style="background:${item.color}"></span>${item.label}</label><strong>${percentage(share)}</strong></li>`;
    })
    .join("");
}

function updateDonut(parts, total) {
  if (total <= 0) {
    outputs.donut.style.background = "conic-gradient(#274678 0deg 360deg)";
    outputs.legend.innerHTML = "<li><span>Sem custos informados</span><strong>0,00%</strong></li>";
    return;
  }

  let cumulative = 0;
  const slices = parts
    .filter((item) => item.value > 0)
    .map((item) => {
      const angle = (item.value / total) * 360;
      const start = cumulative;
      cumulative += angle;
      return `${item.color} ${start.toFixed(3)}deg ${cumulative.toFixed(3)}deg`;
    });

  outputs.donut.style.background = `conic-gradient(${slices.join(", ")})`;
  outputs.legend.innerHTML = buildLegendItems(parts, total);
}

function calculate() {
  const values = readForm();
  const printTimeHours = values.printHours;
  const salesFeeRate = values.salesFeePercent / 100;
  const failureRate = values.failureRatePercent / 100;
  const profitRate = values.desiredProfitPercent / 100;
  const customPremiumRate = values.customPremiumPercent / 100;

  if (salesFeeRate >= 1) {
    outputs.warning.hidden = false;
    outputs.warning.textContent = "A taxa de venda deve ser menor que 100%.";
    return;
  }

  outputs.warning.hidden = true;
  outputs.warning.textContent = "";

  const filamentCost = (values.filamentConsumption / 1000) * values.filamentCostPerKg;
  const energyCost =
    (KOBRA_X_POWER_W / 1000) * printTimeHours * RGE_SANTA_MARIA_RATE_PER_KWH;
  const machineCostPerHour = (PRINTER_VALUE_BRL + values.maintenanceReserve) / values.usefulLifeHours;
  const machineCost = machineCostPerHour * printTimeHours;
  const laborCost = (values.manualWorkMinutes / 60) * values.hourlyRate;

  const variableCost = filamentCost + energyCost + values.packagingCost + values.extraCost;
  const sustainableBaseCost = variableCost + machineCost + laborCost;
  const failureCost = sustainableBaseCost * failureRate;
  const sustainableCostWithFailures = sustainableBaseCost + failureCost;

  const minimumPrice = applyRounding(priceFromNet(variableCost, salesFeeRate), values.roundingMode);
  const sustainableNetTarget = sustainableCostWithFailures * (1 + profitRate);
  const sustainablePrice = applyRounding(
    priceFromNet(sustainableNetTarget, salesFeeRate),
    values.roundingMode,
  );
  const customPrice = applyRounding(sustainablePrice * (1 + customPremiumRate), values.roundingMode);

  const sustainableSalesFee = sustainablePrice * salesFeeRate;
  const sustainableTotalCost = sustainableCostWithFailures + sustainableSalesFee;
  const sustainableProfitValue = sustainablePrice - sustainableTotalCost;
  const sustainableProfitMargin =
    sustainablePrice > 0 ? (sustainableProfitValue / sustainablePrice) * 100 : 0;

  outputs.filamentCostOut.textContent = money(filamentCost);
  outputs.energyCostOut.textContent = money(energyCost);
  outputs.machineCostOut.textContent = money(machineCost);
  outputs.laborCostOut.textContent = money(laborCost);
  outputs.failureCostOut.textContent = money(failureCost);
  outputs.salesFeeOut.textContent = money(sustainableSalesFee);
  outputs.packagingOut.textContent = money(values.packagingCost);
  outputs.extraOut.textContent = money(values.extraCost);
  outputs.totalCostOut.textContent = money(sustainableTotalCost);

  outputs.minimumPriceOut.textContent = money(minimumPrice);
  outputs.sustainablePriceOut.textContent = money(sustainablePrice);
  outputs.customPriceOut.textContent = money(customPrice);
  outputs.profitValueOut.textContent = money(sustainableProfitValue);
  outputs.profitMarginOut.textContent = percentage(sustainableProfitMargin);
  outputs.machineCostPerHourOut.textContent = `${money(machineCostPerHour)}/h`;

  updateDonut(
    [
      { label: "Filamento", value: filamentCost, color: "#75d657" },
      { label: "Energia", value: energyCost, color: "#ffc447" },
      { label: "Máquina", value: machineCost, color: "#6ba8ff" },
      { label: "Mão de obra", value: laborCost, color: "#be89ff" },
      { label: "Falhas", value: failureCost, color: "#ff7a7a" },
      { label: "Taxas", value: sustainableSalesFee, color: "#62d0ff" },
      { label: "Embalagem", value: values.packagingCost, color: "#90a9d6" },
      { label: "Outros", value: values.extraCost, color: "#e6a15a" },
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
calculate();
