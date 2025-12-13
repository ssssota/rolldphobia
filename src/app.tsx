import { useSignal } from "@preact/signals";
import { Analyzer } from "./analyzer";
import { Imports } from "./imports";
import type { ImportDefinition } from "./types";

export function App() {
  const imports = useSignal<ImportDefinition[]>();

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="mx-auto max-w-5xl p-4 md:p-6">
        <header class="mb-6 pb-4 border-b border-gray-300">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-2">
            <h1 class="text-3xl md:text-4xl font-bold text-gray-800 mt-4 mb-0 md:mb-4">
              Rolld
              <span class="text-gray-500">(own)</span>
              phobia
            </h1>
            <div class="flex items-center gap-3 text-sm">
              <a
                href="https://github.com/ssssota"
                class="text-gray-600 hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                @ssssota
              </a>
              <a
                href="https://github.com/ssssota/rolldphobia"
                class="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                title="View on GitHub"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clip-rule="evenodd"
                  />
                </svg>
                GitHub
              </a>
            </div>
          </div>
          <p class="text-base text-gray-600 leading-normal max-w-3xl mx-auto text-center">
            A modern bundle size analyzer powered by{" "}
            <a
              href="https://rolldown.rs"
              class="text-gray-700 hover:text-gray-900 font-medium transition-colors underline decoration-2 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rolldown
            </a>{" "}
            and{" "}
            <a
              href="https://esm.sh"
              class="text-gray-700 hover:text-gray-900 font-medium transition-colors underline decoration-2 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              esm.sh
            </a>{" "}
            — running entirely in your browser, inspired by{" "}
            <a
              href="https://bundlephobia.com"
              class="text-gray-700 hover:text-gray-900 font-medium transition-colors underline decoration-2 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bundlephobia
            </a>{" "}
            and{" "}
            <a
              href="https://shakerphobia.netlify.app/"
              class="text-gray-700 hover:text-gray-900 font-medium transition-colors underline decoration-2 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shakerphobia
            </a>
            .
          </p>
        </header>
        <main class="space-y-5">
          <Imports imports={imports} />
          <Analyzer imports={imports} />
        </main>
      </div>
    </div>
  );
}
