# Multiplayer Unicode Grid Web Application

## Overview

The goal of this project was to build a real‑time multiplayer web
application where multiple players share a single 10 × 10 grid.  Each player
may select a cell and fill it with a Unicode character.  Once a character is
submitted, that player is restricted from editing any further cells (an
optional feature allows them to update again after a one‑minute cooldown).

Features included :

* Real‑time synchronisation – when a player fills a cell, all other players
  should see the updated grid immediately.
* A live display of the number of currently connected players.
* Shared state – every player sees and interacts with the same grid.
* An optional “history” view that allows the grid to be rewound to previous
  states.

The Technology stack is **React** for the front‑end and a
**Node/Express** back‑end written in **TypeScript**. The solution uses only built‑in Node modules and
CDN‑hosted client libraries.  The back‑end exposes a lightweight HTTP API
and uses **Server‑Sent Events (SSE)** to push real‑time updates to clients.

## Architecture

### Server

The server is written in TypeScript (compiled with the included `tsc`)
and compiled to JavaScript in `server/dist/index.js`.  It uses Node’s
built‑in `http` module to listen for incoming requests and implements the
following endpoints:

| Endpoint        | Method | Description |
|-----------------|--------|-------------|
| `/events`       | `GET`  | Opens a long‑lived **Server‑Sent Events** stream.  Clients connecting to this endpoint receive an initial payload containing their unique client identifier, the current grid state and the number of connected players.  Updates about the grid and player count are broadcast to all connected streams. |
| `/update`       | `POST` | Accepts JSON with `{ clientId, row, col, char }`.  The server validates the input, enforces a per‑client cooldown (60 seconds) and ensures that the target cell is empty.  On success the grid is updated, a history snapshot is recorded and all clients are notified via SSE.  Error responses contain a human‑readable message. |
| `/history`      | `GET`  | When called without query parameters returns an array of timestamps representing each recorded grid state.  Supplying `?index=n` returns the grid snapshot at a specific history index. |
| `/*`            | `GET`  | Serves static files for the client application (HTML, CSS, JavaScript). |

Key components of the server implementation:

* **Grid state** – The grid is represented as a two‑dimensional array of
  strings (`string[][]`).  Empty cells contain an empty string.
* **Client management** – When a client connects to `/events`, the server
  generates a unique identifier and stores their response object in an array.
  When the connection closes the client is removed and the player count is
  broadcast.
* **Per‑client cooldown** – A simple in‑memory record (`playerState`) stores
  the timestamp of each client’s last successful update.  A new update is
  refused if it occurs within one minute of the previous one.
* **History tracking** – After each update the server records a deep copy of
  the grid along with a timestamp.  If multiple updates occur within one
  second of each other they are coalesced into the most recent history entry
  (this satisfies the optional requirement to group updates made within a
  second).  The history API allows clients to browse these snapshots.
* **Event broadcasting** – A helper function serialises JSON data and
  writes it to each open SSE connection.  Events are named (`init`, `grid`,
  `players`) to allow the client to register specific handlers.
* **Static file serving** – The server includes a very simple static file
  loader that maps URL paths to files in the `client` directory.  In a
  production environment you would likely use a dedicated static file
  middleware such as Express’s `express.static`.

To start the server manually run the following commands from the project
root:

```bash
cd server
npx tsc          # compile the TypeScript source into dist/
node dist/index.js
```

The server listens on port `3000` by default.  You can change this by
setting the `PORT` environment variable before starting the process.

### Client

The client is a single‑page application located in the `client` folder.  It
consists of three files:

1. **`index.html`** – Defines the root of the app and pulls in
   React, ReactDOM and Babel from public CDNs.  The use of Babel in the
   browser allows JSX syntax in the included script without a build step.
2. **`style.css`** – Provides basic styling for the grid, buttons and
   informational elements.  The grid uses CSS Grid Layout to create a
   10 × 10 matrix where each cell is a square.  Used cells are greyed out
   and disabled.
3. **`app.js`** – Contains the React code for the application.  The
   component uses hooks (`useState`, `useEffect`) to manage state and side
   effects.  Major responsibilities include:
   * Establishing the SSE connection on mount and handling incoming events
     (`init`, `grid`, `players`).  The unique `clientId` provided by
     the server is stored for use in subsequent updates.
   * Rendering the grid.  Each cell displays its character or remains blank
     and becomes disabled when filled.  Clicking a blank cell prompts the
     user to enter a character and sends it to the server via a `fetch`
     `POST` call.  The response message is displayed to the user and a
     local 60‑second cooldown timer prevents multiple submissions.
   * Showing the current number of connected players.
   * Implementing the optional history feature.  A “View History” button
     fetches the list of timestamps from the server and switches the UI into
     history mode.  In this mode the user can navigate forward and backward
     through the recorded snapshots.  While viewing history the live updates
     are not applied and attempts to modify the grid are ignored.  An
     “Exit History” button returns the user to the live grid.

When the server is running you can open the client by navigating to
`http://localhost:3000` in your browser.  Each open browser tab acts as a
separate player, connected to the same grid via SSE.

## Development Notes

* **AI usage** – Portions of this project (architecture planning and
  implementation) were drafted with the assistance of OpenAI’s ChatGPT.  All
  code was reviewed, refined and integrated manually.  The final
  deliverable, including this report, reflects a cohesive understanding of
  the problem and a deliberate design process.
* **Why Server‑Sent Events?** – The original requirements suggested using
  WebSockets for real‑time communication.  Installing additional
  dependencies such as `socket.io` was not possible in the restricted
  environment, so the solution uses SSE instead.  SSE provides a
  unidirectional channel from server to client over standard HTTP and works
  well for broadcasting updates.  Clients send their updates via simple
  `fetch` requests.
* **Scalability** – This implementation keeps all state in memory and
  broadcasts to all connected clients.  For a small demo or interview
  scenario this is sufficient.  In a production system you would likely
  extract state management into a separate service (e.g. Redis), add
  persistent storage for the history and perhaps use a message broker to
  fan‑out events across multiple server instances.
* **Security** – Input validation is minimal.  A real‑world application
  should sanitise user input, implement authentication and authorisation,
  guard against denial of service by limiting connections per user/IP and
  consider using HTTPS.

## Running the application

1. **Compile and start the server**
   ```bash
   cd server
   npx tsc
   node dist/index.js
   ```
   The server listens on `localhost:3000`.

2. **Open the client**
   Navigate to `http://localhost:3000` in one or more browser tabs.

3. **Interact**
   * Click on any empty cell in the grid and enter a Unicode character.
   * Your character will appear immediately and all other connected clients
     will see the update.  You must wait one minute before submitting
     another character.
   * The number of connected players is displayed at the top of the page.
   * Optional: click “View History” to browse previous states of the grid.

## Conclusion

This project demonstrates how to build a real‑time collaborative application
without relying on external dependencies or complex build tooling.  By
combining Node’s standard library with modern browser APIs (SSE and
fetch) and leveraging React for the front‑end, it provides a clear and
extensible foundation for multiplayer interactions.  
