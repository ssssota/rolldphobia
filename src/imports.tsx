import { useSignal, type Signal } from "@preact/signals";
import { useMemo } from "preact/hooks";
import { getImportsFromQuery, storeImportsToQuery, type ImportDefinition } from "./import-definition";

interface Props {
  imports: Signal<ImportDefinition[] | undefined>;
}

export function Imports(props: Props) {
  const temporary = useSignal(getImportsFromQuery(window.location.search) || [
    { id: "1", specifier: "preact", names: "{ render }" },
    { id: "2", specifier: "preact/jsx-runtime", names: "{ jsx }" },
    { id: "3", specifier: "preact/hooks", names: "* as hooks" },
    { id: "4", specifier: "jsr:@std/path", names: "{ join, dirname }" },
  ]);

  const onNamesChange = useMemo(() => {
    return debounce((id: string, value: string) => {
      temporary.value = temporary.value.map((i) => (i.id === id ? { ...i, names: value } : i));
    }, 500);
  }, []);

  const onSpecifierChange = useMemo(() => {
    return debounce((id: string, value: string) => {
      temporary.value = temporary.value.map((i) => (i.id === id ? { ...i, specifier: value } : i));
    }, 500);
  }, []);

  return (
    <section class="bg-white rounded-lg shadow-sm p-4 md:p-5 border-2 border-gray-200">
      <h2 class="text-xl font-bold mt-0 mb-4 text-gray-800">Import Statements</h2>
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
                onInput={(ev) => onNamesChange(imp.id, ev.currentTarget.value)}
                placeholder="{ named } or default"
                class="flex-1 min-w-40 px-2 py-1.5 font-mono text-sm border border-gray-200 rounded bg-white transition-all outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
              />
              <span class="text-gray-600 font-semibold text-sm">from</span>
              <div class="flex items-center gap-1 flex-1 min-w-60">
                <span class="text-gray-400">"</span>
                <input
                  type="text"
                  value={imp.specifier}
                  onInput={(ev) => onSpecifierChange(imp.id, ev.currentTarget.value)}
                  placeholder="package-name"
                  class="flex-1 px-2 py-1.5 font-mono text-sm border border-gray-200 rounded bg-white transition-all outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
                />
                <span class="text-gray-400">";</span>
              </div>
              <button
                onClick={() => {
                  temporary.value = temporary.value.filter((i) => i.id !== imp.id);
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
              const newImport: ImportDefinition = {
                id: crypto.randomUUID(),
                specifier: "",
                names: "",
              };
              temporary.value = [...temporary.value, newImport];
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

function debounce<Args extends any[]>(
  func: (...args: Args) => void,
  wait: number,
): (...args: Args) => void {
  let timeout: number | undefined;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}
