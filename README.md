# Kaarya Setu

###  Real-Time, All-in-One Platform for Distributed Teams

The **Remote Work Collaboration Suite** is a full-stack, browser-based platform that enables distributed teams to **communicate, collaborate, and coordinate in real time** — unifying document editing, video calls, whiteboarding, task management, and team chat into one seamless application.

It’s built with **React + Node.js + Supabase**, leveraging **WebRTC**, **WebSockets**, and **CRDT (Yjs)** for real-time performance.

---

##  Table of Contents
- [ Project Aim](#project-aim)
- [ Features](#features)
- [ Technology Stack](#️technology-stack)
- [ Project Structure](#project-structure)
- [ Core Modules](#core-modules)
- [ Authentication](#authentication)
- [ Getting Started](#️getting-started)
- [ Environment Variables](#add-environment-variables)
- [ Quick Setup](#quick-setup)


---

##  Project Aim
The goal of this suite is to **build a unified collaboration experience** that replaces the need for switching between multiple tools like Google Docs, Zoom, Slack, Trello, and Miro.  
It demonstrates **cutting-edge full-stack and real-time web engineering**, emphasizing scalability, modularity, and modern UX.

---

##  Features

| Module | Description | Technologies |
|--------|--------------|--------------|
|  **Real-Time Document Editor** | Multi-user collaborative document editing with conflict-free synchronization. | Yjs (CRDT), WebSockets |
|  **Video Conferencing** | Peer-to-peer video/audio calls with room-based signaling. | WebRTC, Socket.io |
|  **Collaborative Whiteboard** | Interactive whiteboard for sketching and brainstorming. | Fabric.js / Excalidraw, Socket.io |
|  **Task Boards** | Kanban-style task management for teams. | React DnD, WebSockets, Supabase |
|  **Team Chat** | Real-time messaging with persistent chat history. | Socket.io, Supabase |
|  **User Authentication** | Secure authentication and role-based access. | Supabase Auth / JWT |
|  **Workspace Management** | Create/join workspaces, invite members, and manage projects. | Supabase |

---

##  Technology Stack

**Frontend**
- React.js (Vite)
- Tailwind CSS
- Socket.io Client
- Yjs (for document collaboration)
- WebRTC API
- Excalidraw / Fabric.js (for whiteboard)

**Backend**
- Node.js + Express.js
- Supabase (PostgreSQL + Auth + Storage)
- Socket.io / ws (WebSocket server)
- Prisma ORM
- Redis (presence tracking, caching)
- WebRTC Signaling Server

**Deployment**
- Frontend → Netlify / Vercel
- Backend → Render / Railway
- Supabase → Managed cloud database & auth

---

##  Project Structure
```bash

    remote-collab-suite/
├── backend/
│ ├── src/
│ │ ├── models/ # Data models (Chat, TaskBoard)
│ │ ├── routes/ # Express routes (auth, chat, documents, tasks, etc.)
│ │ ├── sockets/ # Real-time socket handlers
│ │ └── server.js # Main backend entry point
│ ├── package.json
│ └── ...
│
├── frontend/
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── contexts/ # React Context (Auth, Socket)
│ │ ├── hooks/ # Custom hooks for real-time features
│ │ ├── pages/ # Page-level components (Login, Dashboard, Workspace)
│ │ ├── services/ # API + Socket configurations
│ │ └── main.jsx # React entry file
│ ├── vite.config.js
│ ├── tailwind.config.js
│ ├── package.json
│ └── index.html
│
├── package.json
└── README.md

```

---

##  Core Modules

###  1. Real-Time Document Collaboration
- Built using **Yjs (CRDT)** + **WebSocket**.
- Concurrent editing with conflict resolution.
- Auto-saves to Supabase database snapshots.

###  2. Video Conferencing
- Real-time **P2P** communication via **WebRTC**.
- **Socket.io signaling** for SDP/ICE candidate exchange.
- Room-based multi-user calls.

###  3. Collaborative Whiteboard
- Shared drawing canvas with tools, colors, shapes, and eraser.
- Real-time sync via **Socket.io**.
- Export and clear board features.

###  4. Task Boards
- Kanban-style columns: To-Do, In Progress, Done.
- Real-time updates via **WebSockets**.
- Persistent storage in **Supabase**.

###  5. Team Chat
- Live messaging with Socket.io.
- Stores messages in Supabase for history persistence.
- Typing indicators and notifications.

---

##  Authentication
- Uses **Supabase Auth** (or JWT fallback).
- Supports registration, login, logout.
- Tracks user presence via Redis.
- Role-based access (admin/member).

---

##  Getting Started

###  Clone the Repository
```bash

git clone https://github.com/yourusername/remote-work-collaboration-suite.git
cd remote-work-collaboration-suite

```

## Add Environment Variables

```bash

# Create a .env file inside /backend
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# Create a .env file inside /frontend
VITE_BACKEND_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

``` 

## Quick Setup
```bash
cd backend

npm install

cd ../frontend

npm install

cd ..

npm install concurrently

```

## Author
**Developed by:** Soham Suraj Koli
*Pimpri Chinchwad University,  B.Tech CSE*

