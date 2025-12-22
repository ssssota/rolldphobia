import { type Signal, useSignal, useSignalEffect } from "@preact/signals";
import ansis from "ansis";
import { useRef } from "preact/hooks";
import type { ImportDefinition } from "./import-definition";
const slowWarningMessage = "[PLUGIN_TIMINGS]";

type Result = {
  code: string;
  bundled: number;
  minified: number;
  gzip: number;
};

interface Props {
  imports: Signal<ImportDefinition[] | undefined>;
}

export function Analyzer(props: Props) {
  const next = useRef<() => Promise<void>>();
  const warns = useSignal<string[]>([]);
  const result = useSignal<Result>();
  const bundleDuration = useSignal<number | null>(null);
  const isLoading = useSignal<boolean>(false);
  useSignalEffect(() => {
    const imports = props.imports.value;
    if (imports === undefined || imports.length === 0) {
      return;
    }

    warns.value = [];
    bundleDuration.value = null;
    isLoading.value = true;
    const startTime = performance.now();
    import("./bundle")
      .then(({ bundle }) =>
        bundle(imports, (warn) => {
          if (warn.includes(slowWarningMessage)) return;
          warns.value = [...warns.value, warn];
        }),
      )
      .then((res) => {
        result.value = res;
        next.current?.();
      })
      .finally(() => {
        const endTime = performance.now();
        bundleDuration.value = endTime - startTime;
        isLoading.value = false;
      });
  });
  return (
    <section class="bg-white rounded-lg shadow-sm p-4 md:p-5 border-2 border-gray-300">
      <h2 class="text-xl font-bold mt-0 mb-4 text-gray-800 flex items-baseline gap-2">
        Bundle Analysis
        {bundleDuration.value !== null && (
          <span class="text-sm font-normal text-gray-500">
            ({bundleDuration.value.toFixed(0)}ms)
          </span>
        )}
      </h2>
      {isLoading.value ? (
        <div class="text-center py-12">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300/50 border-t-gray-800 blur-[.5px]"
            aria-hidden
          ></div>
          <p class="mt-4 text-gray-600">Analyzing bundle...</p>
        </div>
      ) : result.value ? (
        <div key={result.value.code} class="p-4 bg-gray-50 border border-gray-300 rounded-md">
          <dl class="flex flex-wrap gap-3 mb-3">
            {[
              { title: "Bundle Size", value: byteLengthToString(result.value.bundled) },
              { title: "Minified Size", value: byteLengthToString(result.value.minified) },
              { title: "Gzipped Size", value: byteLengthToString(result.value.gzip) },
            ].map(({ title, value }) => (
              <div
                key={title}
                class="flex-1 min-w-32 p-3 bg-white border border-gray-300 rounded text-center"
              >
                <dt class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  {title}
                </dt>
                <dd class="text-xl font-bold text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
          <details class="mt-3">
            <summary class="px-3 py-2 flex items-center justify-between bg-gray-100 border border-gray-300 rounded cursor-pointer font-semibold text-xs text-gray-600 transition-all list-none hover:bg-gray-200 [&::-webkit-details-marker]:hidden">
              <span>View Minified Code</span>
              <span class="text-gray-400 text-sm">▼</span>
            </summary>
            <pre class="m-0 p-4 bg-gray-50 border border-gray-300 border-t-0 rounded-b overflow-x-auto whitespace-pre-wrap break-words">
              <code class="font-mono text-sm leading-relaxed text-gray-700">
                {result.value.code}
              </code>
            </pre>
          </details>
        </div>
      ) : (
        <div class="text-center py-8 text-gray-400">
          <p class="text-base">Add import statements to analyze bundle size</p>
        </div>
      )}
      {warns.value.length > 0 && (
        <div class="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-md">
          <h3 class="text-base font-semibold mb-2 text-gray-700">Warnings</h3>
          <pre class="px-2 py-1.5 bg-white border border-gray-300 border-l-2 border-l-gray-500 rounded text-sm text-gray-700 font-mono">
            {ansis.strip(warns.value.join("\n"))}
          </pre>
        </div>
      )}
    </section>
  );
}

function byteLengthToString(byteLength: number): string {
  const kb = 2 << 10;
  const mb = 2 << 20;
  if (byteLength < kb) return `${byteLength} B`;
  if (byteLength < mb) return `${(byteLength / kb).toFixed(2)} KiB`;
  return `${(byteLength / mb).toFixed(2)} MiB`;
}
