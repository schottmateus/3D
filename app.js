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

const fields = {
  filamentConsumption: document.getElementById("filamentConsumption"),
  filamentType: document.getElementById("filamentType"),
  filamentCostPerKg: document.getElementById("filamentCostPerKg"),
  printHours: document.getElementById("printHours"),
  salesFeePercent: document.getElementById("salesFeePercent"),
  packagingCost: document.getElementById("packagingCost"),
  extraCost: document.getElementById("extraCost"),
  desiredProfitPercent: document.getElementById("desiredProfitPercent"),
  roundingMode: document.getElementById("roundingMode"),
};

const outputs = {
  filamentCostOut: document.getElementById("filamentCostOut"),
  energyCostOut: document.getElementById("energyCostOut"),
  salesFeeOut: document.getElementById("salesFeeOut"),
  packagingOut: document.getElementById("packagingOut"),
  extraOut: document.getElementById("extraOut"),
  totalCostOut: document.getElementById("totalCostOut"),
  profitValueOut: document.getElementById("profitValueOut"),
  profitMarginOut: document.getElementById("profitMarginOut"),
  suggestedPriceOut: document.getElementById("suggestedPriceOut"),
  finalPriceOut: document.getElementById("finalPriceOut"),
  warning: document.getElementById("warning"),
  donut: document.getElementById("costDonut"),
  legend: document.getElementById("legend"),
  fixedPowerOut: document.getElementById("fixedPowerOut"),
  fixedRateOut: document.getElementById("fixedRateOut"),
};

const defaults = {
  filamentConsumption: 120,
  filamentType: "PLA",
  filamentCostPerKg: 79.9,
  printHours: 8,
  salesFeePercent: 16.4,
  packagingCost: 1.2,
  extraCost: 0.0,
  desiredProfitPercent: 50,
  roundingMode: "none",
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
  const desiredProfitPercent = Math.max(0, toNumber(fields.desiredProfitPercent.value));

  return {
    filamentConsumption: Math.max(0, toNumber(fields.filamentConsumption.value)),
    filamentType: fields.filamentType.value,
    filamentCostPerKg: Math.max(0, toNumber(fields.filamentCostPerKg.value)),
    printHours: hours,
    salesFeePercent,
    packagingCost: Math.max(0, toNumber(fields.packagingCost.value)),
    extraCost: Math.max(0, toNumber(fields.extraCost.value)),
    desiredProfitPercent,
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
  const feeRate = values.salesFeePercent / 100;
  const profitRate = values.desiredProfitPercent / 100;

  if (feeRate >= 1) {
    outputs.warning.hidden = false;
    outputs.warning.textContent = "A taxa de venda deve ser menor que 100%.";
    return;
  }

  outputs.warning.hidden = true;
  outputs.warning.textContent = "";

  const filamentCost = (values.filamentConsumption / 1000) * values.filamentCostPerKg;
  const energyCost =
    (KOBRA_X_POWER_W / 1000) * printTimeHours * RGE_SANTA_MARIA_RATE_PER_KWH;
  const directCost = filamentCost + energyCost + values.packagingCost + values.extraCost;

  const suggestedPrice = (directCost * (1 + profitRate)) / (1 - feeRate);
  const salesFeeCost = suggestedPrice * feeRate;
  const totalCost = directCost + salesFeeCost;

  const finalPrice = applyRounding(suggestedPrice, values.roundingMode);
  const finalProfitValue = finalPrice * (1 - feeRate) - directCost;
  const finalProfitMargin = finalPrice > 0 ? (finalProfitValue / finalPrice) * 100 : 0;

  outputs.filamentCostOut.textContent = money(filamentCost);
  outputs.energyCostOut.textContent = money(energyCost);
  outputs.salesFeeOut.textContent = money(salesFeeCost);
  outputs.packagingOut.textContent = money(values.packagingCost);
  outputs.extraOut.textContent = money(values.extraCost);
  outputs.totalCostOut.textContent = money(totalCost);

  outputs.profitValueOut.textContent = money(finalProfitValue);
  outputs.profitMarginOut.textContent = percentage(finalProfitMargin);
  outputs.suggestedPriceOut.textContent = money(suggestedPrice);
  outputs.finalPriceOut.textContent = money(finalPrice);

  updateDonut(
    [
      { label: "Filamento", value: filamentCost, color: "#75d657" },
      { label: "Energia", value: energyCost, color: "#ffc447" },
      { label: "Taxas", value: salesFeeCost, color: "#6ba8ff" },
      { label: "Embalagem", value: values.packagingCost, color: "#be89ff" },
      { label: "Outros", value: values.extraCost, color: "#ff7a7a" },
    ],
    totalCost,
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
calculate();
