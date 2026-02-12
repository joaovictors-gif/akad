# AKAD - Sistema de Gestão para Academia de Artes Marciais

## 📋 Sobre o Projeto

Sistema completo de gestão para academia de artes marciais, incluindo controle de alunos, mensalidades, frequência, exame de faixas, loja integrada e dashboards administrativos com dados em tempo real.

---

## 🚀 Experiências Adquiridas

### Frontend & UI/UX
- Desenvolvimento de **SPA (Single Page Application)** com React e TypeScript
- Criação de interfaces responsivas com **Tailwind CSS** e componentes reutilizáveis com **shadcn/ui**
- Implementação de **PWA (Progressive Web App)** com service worker, instalação nativa e push notifications
- Animações fluidas com **Framer Motion** e transições de página
- Gerenciamento de temas (dark/light mode) com `next-themes`
- Carrosséis de produtos com **Embla Carousel**
- Gráficos e relatórios com **Recharts**

### Backend & Firebase
- Autenticação de usuários com **Firebase Auth** (email/senha e Google OAuth)
- Banco de dados em tempo real com **Cloud Firestore** (listeners `onSnapshot`)
- Upload e gerenciamento de arquivos com **Firebase Storage**
- Desenvolvimento de **Cloud Functions** (Node.js) para lógica de servidor (pagamentos, notificações, envio de emails)
- Configuração de **regras de segurança** do Firestore e Storage
- Deploy de funções no **Google Cloud Platform**

### Infraestrutura & Deploy
- **Compra e configuração de domínio personalizado** com apontamento DNS (registros A, CNAME, TXT)
- Configuração de **SSL/HTTPS** automático para o domínio
- **Servidor externo para Cloud Functions** — hospedagem e gerenciamento de funções serverless no Firebase/GCP com região `us-central1`
- Deploy contínuo via **Firebase Hosting**
- Configuração de **SEO** (sitemap.xml, robots.txt, meta tags, Open Graph)

### Gestão de Estado & Dados
- Gerenciamento de estado global com **React Context API** (AuthContext, DashboardDateContext)
- Cache e sincronização de dados com **TanStack React Query**
- Formulários avançados com **React Hook Form** + validação **Zod**
- Roteamento protegido com **React Router DOM** (rotas por role: admin/aluno)

### Notificações & Engajamento
- **Push Notifications** via Firebase Cloud Messaging (FCM)
- Service Worker customizado para notificações em background
- Banner de atualização PWA para novas versões

### Integrações & APIs
- Integração com **API de pagamentos** (gerenciamento de mensalidades, status, vencimentos)
- Comunicação com backend via **REST API** (Cloud Functions)
- Integração com provedor de domínio externo

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
|-----------|-----------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Animações** | Framer Motion |
| **Autenticação** | Firebase Auth (Email, Google OAuth) |
| **Banco de Dados** | Cloud Firestore |
| **Storage** | Firebase Storage |
| **Functions** | Firebase Cloud Functions (Node.js) |
| **Hosting** | Firebase Hosting |
| **Domínio** | Domínio personalizado com DNS configurado |
| **Servidor Functions** | Google Cloud Platform (us-central1) |
| **PWA** | vite-plugin-pwa + Service Worker |
| **Notificações** | Firebase Cloud Messaging (FCM) |
| **Gráficos** | Recharts |
| **Formulários** | React Hook Form + Zod |
| **Roteamento** | React Router DOM v6 |
| **State Management** | React Context + TanStack Query |
| **Carrossel** | Embla Carousel |

---

## 📁 Estrutura do Projeto

```
src/
├── assets/          # Imagens, ícones e recursos visuais
├── components/      # Componentes reutilizáveis (UI, dashboard, alunos, loja...)
├── contexts/        # Context API (Auth, Dashboard)
├── hooks/           # Custom hooks (PWA, push, realtime, roles)
├── lib/             # Configurações (Firebase, utils)
├── pages/           # Páginas da aplicação
├── services/        # Serviços de API
public/
├── firebase-messaging-sw.js  # Service Worker para push notifications
├── sitemap.xml               # SEO
├── robots.txt                # SEO
```

---

## 🎯 Funcionalidades Principais

- **Dashboard Administrativo** — visão geral com gráficos, ordens recentes e ações rápidas
- **Gestão de Alunos** — cadastro, edição, filtros, detalhes e controle de faixas
- **Mensalidades** — controle financeiro, status de pagamento, atualização de vencimentos
- **Frequência** — registro de presença por aula com modal de chamada
- **Exame de Faixas** — promoção de graduação dos alunos
- **Loja** — catálogo de produtos com carrossel
- **Perfil do Aluno** — foto, conquistas, resumo de presença, status financeiro
- **Notificações Push** — alertas em tempo real para alunos
- **PWA** — instalável como app nativo no celular
- **Multi-cidades** — suporte a múltiplas unidades

---

## 👨‍💻 Autor

Desenvolvido com dedicação, aprendizado contínuo e muitas linhas de código. ✨
