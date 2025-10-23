# DigiYou CRM - Pipeline Manager

This project is a modern CRM focused on a Kanban-style pipeline manager, inspired by ActiveCampaign. It allows for comprehensive management of funnels, stages, and deals, with dashboard analytics.

## Project Structure

-   **Frontend**: The user interface is built with React, TypeScript, and TailwindCSS, powered by a Vite build environment. Source files are located in the `src/` directory.
-   **Backend**: A Node.js Express server that provides a REST API and persists data in a `crm.db` SQLite database file. The server logic is in `server.js`.

---

## Running the Application

There are two main ways to run this application: for development and for production.

### Development

For development, you need to run the backend API server and the frontend development server in **two separate terminals**. This allows for features like hot-reloading on the frontend.

**1. Start the Backend Server:**

-   Install dependencies:
    ```bash
    npm install
    ```
-   Start the API server:
    ```bash
    npm start
    ```
-   The server will start on `http://localhost:4029` and create a `crm.db` file if it doesn't exist. Keep this terminal running.

**2. Start the Frontend Server:**

-   Open a **new terminal** in the same project directory.
-   Install dependencies (if you haven't already):
    ```bash
    npm install
    ```
-   Start the Vite development server:
    ```bash
    npm run dev
    ```
-   Vite will provide a local URL, typically `http://localhost:5173`. Open this URL in your browser.

The default login credentials for the initial seeded company are `ADMIN` / `1234`.

---

### Production Deployment on Linux

For a production environment, you should build the React application into static files and have a single Node.js server that serves both the API and the frontend.

**1. Prerequisites:**

-   A Linux server with Node.js and npm installed.
-   Git (for cloning the repository).

**2. Installation:**

-   Clone your project repository to the server.
-   Navigate to the project directory and install all dependencies:
    ```bash
    npm install
    ```

**3. Configuration (Optional but Recommended):**

-   You can configure the server using environment variables. You can set them directly in your shell or use a `.env` file (you would need to add a library like `dotenv` to your project).
    -   `PORT`: The port for the server to run on (defaults to `4029`).
    -   `DB_FILE`: The path to the SQLite database file (defaults to `./crm.db`).

**4. Build the Frontend:**

-   Run the build script to compile the React application into an optimized `dist` folder:
    ```bash
    npm run build
    ```

**5. Start the Production Server:**

-   Run the `start` script. This single command will launch the production-ready server, which serves both your API and the compiled frontend.
    ```bash
    npm start
    ```
-   The application will be accessible at `http://<your-server-ip>:<PORT>`.

**6. Process Management (Recommended):**

-   To ensure your application runs continuously and restarts automatically if it crashes, use a process manager like **PM2**.

-   Install PM2 globally:
    ```bash
    npm install -g pm2
    ```

-   Start your application with PM2:
    ```bash
    pm2 start server.js --name "digiyou-crm"
    ```

-   To make the application start automatically on server reboot, run:
    ```bash
    pm2 startup
    ```
    (This will provide a command you need to copy and run with sudo privileges).

-   Save the current process list to be restored on reboot:
    ```bash
    pm2 save
    ```

-   You can monitor your application with `pm2 list` or `pm2 monit`.
