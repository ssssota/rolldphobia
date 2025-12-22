import { useSignal, type Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import {
  getImportsFromQuery,
  storeImportsToQuery,
  type ImportDefinition,
} from "./import-definition";

interface Props {
  imports: Signal<ImportDefinition[] | undefined>;
}

const defaultImports = [
  { id: "1", specifier: "preact", names: "{ render }" },
  { id: "2", specifier: "preact/jsx-runtime", names: "{ jsx }" },
  { id: "3", specifier: "preact/hooks", names: "* as hooks" },
  { id: "4", specifier: "jsr:@std/path", names: "{ join, dirname }" },
];

export function Imports(props: Props) {
  const temporary = useDraftImports(() => {
    return getImportsFromQuery(window.location.search) || defaultImports;
  });

  return (
    <section class="bg-white rounded-lg shadow-sm p-4 md:p-5 border-2 border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold m-0 text-gray-800">Import Statements</h2>
        <button
          onClick={() => {
            temporary.clear();
          }}
          class="text-sm text-gray-500 hover:text-red-600 hover:underline cursor-pointer bg-transparent border-none p-0 transition-colors"
        >
          Clear all
        </button>
      </div>
      <ul class="flex flex-col gap-3">
        {temporary.value.map((imp) => (
          <li
            key={imp.id}
            class="p-3 bg-gray-50 border border-gray-200 rounded-md transition-all hover:border-gray-400 hover:shadow-sm"
          >
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-gray-600 font-semibold text-sm">import</span>
              <input
                type="text"
                value={imp.names}
                onInput={(ev) =>
                  temporary.update(imp.id, (i) => ({ ...i, names: ev.currentTarget.value }))
                }
                placeholder="{ named } or default"
                class="flex-1 min-w-40 px-2 py-1.5 font-mono text-sm border border-gray-200 rounded bg-white transition-all outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
              />
              <span class="text-gray-600 font-semibold text-sm">from</span>
              <div class="flex items-center gap-1 flex-1 min-w-60">
                <span class="text-gray-400">"</span>
                <input
                  type="text"
                  value={imp.specifier}
                  onInput={(ev) =>
                    temporary.update(imp.id, (i) => ({ ...i, specifier: ev.currentTarget.value }))
                  }
                  placeholder="package-name"
                  class="flex-1 px-2 py-1.5 font-mono text-sm border border-gray-200 rounded bg-white transition-all outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
                />
                <span class="text-gray-400">";</span>
              </div>
              <button
                onClick={() => {
                  temporary.remove(imp.id);
                }}
                class="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 font-semibold cursor-pointer transition-all hover:bg-gray-100 hover:border-gray-400"
                title="Remove import"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        <li class="mt-1">
          <button
            onClick={() => {
              temporary.new();
            }}
            class="w-full px-4 flex items-center justify-center gap-2 bg-gray-200 border border-gray-300 rounded-md text-gray-700 font-semibold cursor-pointer transition-all shadow-sm hover:bg-gray-300 hover:shadow-md active:translate-y-0"
          >
            <span class="text-lg">+</span>
            Add Import Statement
          </button>
        </li>
      </ul>
      <div class="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            props.imports.value = temporary.value;
            storeImportsToQuery(temporary.value);
          }}
          class="w-full px-4 py-2 flex items-center justify-center gap-2 bg-gray-700 border border-gray-800 rounded-md text-white font-semibold cursor-pointer transition-all shadow-sm hover:bg-gray-800 hover:shadow-md active:translate-y-0"
        >
          Bundle &amp; Analyze
        </button>
        <p class="text-xs text-gray-500 m-0 mt-2">
          Note: First run will download Rolldown binary (~10MB) and imported packages
        </p>
      </div>
    </section>
  );
}

function useDraftImports(init: () => ImportDefinition[]) {
  const draft = useSignal(useMemo(init, []));

  return useMemo(
    () => ({
      get value() {
        return draft.value;
      },
      new() {
        draft.value = [...draft.value, createBlank()];
      },
      remove(id: string) {
        const tmp = draft.value.filter((i) => i.id !== id);
        if (tmp.length === 0) tmp.push(createBlank());
        draft.value = tmp;
      },
      update(id: string, updater: (importDefinition: ImportDefinition) => ImportDefinition) {
        draft.value = draft.value.map((i) => (i.id === id ? updater(i) : i));
      },
      clear() {
        draft.value = [createBlank()];
      },
    }),
    [draft],
  );
}

function createBlank() {
  return { id: crypto.randomUUID(), specifier: "", names: "" };
}
