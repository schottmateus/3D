# Calculadora de Precificação 3D

Aplicação web para calcular o preço ideal de peças impressas em 3D com base em:

- custo do filamento
- energia elétrica
- taxas de venda
- embalagem
- lucro desejado

## Como executar

Como é uma aplicação estática, basta abrir o arquivo `index.html` no navegador.

No Windows (PowerShell), você pode executar:

```powershell
Start-Process .\index.html
```

## Funcionalidades

- cálculo automático em tempo real
- resumo de custos por categoria
- lucro estimado em valor e margem
- preço sugerido e preço final ideal com regra de arredondamento
- persistência dos dados preenchidos no navegador (localStorage)
- cálculo de energia fixo para Anycubic Kobra X (400W) e tarifa RGE Santa Maria/RS (R$ 1,3461/kWh)
- cálculo baseado apenas em consumo de filamento e tempo de impressão em horas cheias
