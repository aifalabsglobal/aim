# AIM Intelligence (AIFA)

A modern, AI-powered chat application featuring a clean, responsive UI inspired by top-tier LLM interfaces.

## Repository
[https://github.com/aifalabsglobal/aimintelligence](https://github.com/aifalabsglobal/aimintelligence)

## Features
-   **AIFA Branding**: Custom serif typography and warm color palette.
-   **Responsive Design**: Fully functional on desktop and mobile devices.
-   **Monaco Editor**: Integrated code blocks with syntax highlighting and execution capabilities.
-   **Markdown Support**: Full rendering for math (KaTeX) and GFM.
-   **Theme System**: Toggle between Light (Day) and Dark (Night) modes.

## Getting Started

### Prerequisites
-   Node.js (v18+)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/aifalabsglobal/aimintelligence.git
    cd aimintelligence
    ```

2.  Install dependencies (Root, Client, Server):
    ```bash
    npm install
    cd client && npm install
    cd ../server && npm install
    ```

3.  Start the development servers:
    ```bash
    # In one terminal (Client)
    cd client
    npm run dev

    # In another terminal (Server)
    cd server
    npm run dev
    ```

## Project Structure
-   `/client`: React + Vite frontend.
-   `/server`: Node.js + Express backend.
