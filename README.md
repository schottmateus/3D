# Calculadora de Precificação 3D

Aplicação web para calcular o preço ideal de peças impressas em 3D com base em:

- custo do filamento
- energia elétrica
- depreciação da impressora
- mão de obra
- falhas e reimpressões
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
- três preços no relatório: mínimo, venda e personalizado
- lucro exibido ao lado de cada preço
- destaque para preço acima de 10 unidades
- persistência dos dados preenchidos no navegador (localStorage)
- cálculo de energia fixo para Anycubic Kobra X (400W) e tarifa RGE Santa Maria/RS (R$ 1,3461/kWh)
- depreciação com valor fixo da impressora em R$ 3.500,00
- reserva de manutenção (R$ 500,00) e vida útil (5.000h) fixas no cálculo
- falhas/reimpressões fixas em 7% no cálculo
- preço de venda calculado como custo + 100%
- preço mínimo calculado como preço de venda - 15%
- preço personalizado calculado como preço de venda + 5%
- preço acima de 10 unidades calculado como preço de venda - 25%
- arredondamento fixo para inteiro mais próximo
- cálculo baseado apenas em consumo de filamento e tempo de impressão em horas cheias
