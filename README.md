# Calculadora de Precificação 3D

Aplicação web para calcular o preço ideal de peças impressas em 3D com base em:

- custo do filamento
- energia elétrica
- depreciação da impressora
- mão de obra
- falhas e reimpressões
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
- lucro estimado em valor e margem no preço sustentável
- três preços de venda: mínimo, sustentável e personalizado/urgente
- persistência dos dados preenchidos no navegador (localStorage)
- cálculo de energia fixo para Anycubic Kobra X (400W) e tarifa RGE Santa Maria/RS (R$ 1,3461/kWh)
- depreciação com valor fixo da impressora em R$ 3.500,00
- cálculo baseado apenas em consumo de filamento e tempo de impressão em horas cheias
