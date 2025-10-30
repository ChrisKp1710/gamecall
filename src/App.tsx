import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Welcome to Tauri + React
      </h1>

      <div className="flex gap-8 mb-6">
        <a href="https://vite.dev" target="_blank" className="transition-transform hover:scale-110">
          <img src="/vite.svg" className="h-24 w-24" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank" className="transition-transform hover:scale-110">
          <img src="/tauri.svg" className="h-24 w-24" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank" className="transition-transform hover:scale-110">
          <img src={reactLogo} className="h-24 w-24 animate-spin" style={{animationDuration: '20s'}} alt="React logo" />
        </a>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Click on the Tauri, Vite, and React logos to learn more.
      </p>

      <form
        className="flex gap-4 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button 
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
        >
          Greet
        </button>
      </form>
      
      {greetMsg && (
        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
          {greetMsg}
        </p>
      )}
    </main>
  );
}

export default App;
