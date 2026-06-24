# 🚌 Fushi.GO — Frontend

> [!WARNING]
> **Versão de demonstração.** Diversas funcionalidades estão abaixo de 1% de implementação ou simplesmente não funcionam. Encontrou algo quebrado ou tem sugestão? [Abra uma issue](../../issues).

> Rastreamento de ônibus em tempo real para Porto Alegre e região.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre_GL-5-396CB2?style=flat-square)

---

## O que faz

- Mapa interativo com paradas de ônibus e veículos em tempo real
- Previsões de chegada por parada — tempo real e horário programado
- Rastreamento de linha com posição do ônibus na rota e ETAs por parada
- Favoritos de linhas e paradas salvos localmente
- Notificações push quando o ônibus se aproxima
- Busca de linhas por nome ou número

---

## Fonte de dados

Os dados vêm da **API do [Cittamobi](https://cittamobi.com.br)**, proxeada pelo backend TypeScript (repositório privado por ora) configurado em `VITE_API_URL`.

| Endpoint | O que retorna |
|----------|---------------|
| `/v1/vehicles/service/{id}` | Posições GPS em tempo real |
| `/v1/predictions/{serviceId}/{stopId}` | Previsões de chegada por parada |
| `/v1/stops/service/{id}` | Paradas e polilinha da rota |
| `/v1/predictions/stop/{stopId}` | Todas as linhas de uma parada |
| `/v1/services/{id}` | Detalhes da linha |

O backend autentica com o Cittamobi e entrega os dados processados. O frontend não acessa a API do Cittamobi diretamente.

---

## Stack

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | UI |
| TypeScript | 6 | Tipagem |
| Vite | 8 | Build |
| TailwindCSS | 4 | Estilos |
| MapLibre GL JS | 5 | Mapa interativo |
| TanStack Query | 5 | Cache e fetching |
| React Router | 7 | Navegação |
| Zustand | 5 | Estado global |
| Zod | 4 | Validação |
| Lucide React | — | Ícones |

---

## Setup

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Rodar localmente
npm run dev
```

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
# URL base do backend (obrigatório)
VITE_API_URL=https://fushigo.alwaysdata.net

# URL do estilo do mapa MapLibre (opcional)
# Padrão: https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json
VITE_MAP_STYLE=
```

| Variável | Obrigatório | Descrição |
|----------|:-----------:|-----------|
| `VITE_API_URL` | ✅ | URL base do backend |
| `VITE_MAP_STYLE` | ❌ | Estilo MapLibre personalizado |

---

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run preview  # preview do build
npm run lint     # ESLint
```

---

## Estrutura

```
src/
├── app/            # Config, providers, store global
├── components/     # Componentes reutilizáveis (Map, StopCard, BottomSheet...)
├── domain/         # Tipos e mappers de domínio (Vehicle, Stop, Prediction)
├── features/       # Módulos por domínio
│   ├── auth/
│   ├── favorites/
│   ├── map/
│   ├── notifications/
│   ├── services/
│   ├── stops/
│   └── vehicles/
├── pages/          # Páginas (Home, Stop, Vehicle, Search, Settings...)
└── shared/         # API client, utils, constantes
```

---

## Licença

Uso privado. Dados fornecidos pela API do Cittamobi.
