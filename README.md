# MyRoutine

Aplicação web full-stack para gerenciamento de rotina pessoal e organização semanal de tarefas. O calendário sempre inicia na segunda-feira, termina no domingo e suporta atividades fixas recorrentes e atividades únicas por data.

## Stack

- Frontend: Vite, React, TypeScript, TailwindCSS, Framer Motion, TanStack Query, React Hook Form, Zustand e shadcn/ui.
- Backend: Go, Fiber, REST API, GORM e SQLite.
- Package manager: Bun.

## Funcionalidades

- Calendário semanal responsivo com navegação entre semanas.
- Destaque visual do dia atual.
- CRUD de atividades fixas e não fixas.
- Ordenação automática por horário crescente no backend e na interface.
- Drag and drop entre dias da semana.
- Modal de criação/edição com validação.
- Confirmação antes de excluir.
- Marcação de tarefa concluída.
- Filtro por categoria e busca textual.
- Estatísticas semanais e progresso diário.
- Dark mode persistente.
- Skeleton loading, toasts e microinterações.
- Cache local simples para leitura offline da última semana consultada.

## Requisitos

- Bun 1.1+
- Go 1.23+

## Instalação

```bash
bun install
```

```bash
bun run go -- -C backend mod download
```

## Execução

Para iniciar frontend e backend juntos:

```bash
bun run dev
```

Para iniciar separadamente:

```bash
bun run dev:api
```

```bash
bun run dev:web
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8080`

## Banco de Dados

O SQLite é criado automaticamente em:

```text
backend/data/myroutine.db
```

É possível alterar o caminho com:

```bash
DATABASE_PATH=backend/data/dev.db bun run dev:api
```

## API REST

Base URL: `/api`

- `GET /health`
- `GET /activities?weekStart=YYYY-MM-DD&query=&category=`
- `POST /activities`
- `PUT /activities/:id`
- `PATCH /activities/:id/complete`
- `PATCH /activities/:id/move`
- `DELETE /activities`
- `DELETE /activities/:id`
- `GET /study/topics`
- `POST /study/topics`
- `POST /study/topics/:id/subtopics`
- `PATCH /study/subtopics/:id/complete`
- `DELETE /study/topics/:id`
- `DELETE /study/subtopics/:id`

Exemplo de payload:

```json
{
  "title": "Treino funcional",
  "description": "Rotina de força e mobilidade",
  "startTime": "08:00",
  "durationMinutes": 60,
  "type": "fixed",
  "weekdays": [1, 3, 5],
  "color": "#38bdf8",
  "category": "Saúde",
  "priority": "high"
}
```

## Estrutura

```text
frontend/src
  components
    activity
    calendar
    ui
  hooks
  lib
  store
  styles
  types

backend
  cmd/api
  internal
    config
    database
    dto
    handlers
    middleware
    models
    repositories
    services
```

## Verificações

```bash
bun run typecheck
```

```bash
bun run go -- -C backend test ./...
```
