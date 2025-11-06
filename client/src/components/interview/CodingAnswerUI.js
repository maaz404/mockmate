import React, { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";

/**
 * CodingAnswerUI
 * Layout for coding challenges.
 * Left: Problem description and details
 * Right: Monaco editor + run output + actions
 */
const CodingAnswerUI = ({
  currentQuestion,
  currentQuestionIndex,
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  isRunning,
  runOutput,
  runError,
  runResults,
  runMeta, // { lastRunAt, durationMs }
  onRunCode,
  onPrevious,
  onSkip,
  onNext,
  submittingAnswer,
  skipping,
  disableSubmit,
}) => {
  const problemTitle =
    currentQuestion?.title || `Challenge #${currentQuestionIndex + 1}`;
  const problemText =
    currentQuestion?.questionText ||
    currentQuestion?.text ||
    currentQuestion?.description ||
    "";
  const difficulty = currentQuestion?.difficulty || "-";
  const category = currentQuestion?.category || "coding";

  const [testInput, setTestInput] = useState("");
  const [testExpected, setTestExpected] = useState("");

  const lastRunInfo = useMemo(() => {
    if (!runMeta?.lastRunAt) return null;
    try {
      const dt = new Date(runMeta.lastRunAt);
      const timeStr = dt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dur =
        typeof runMeta.durationMs === "number" ? `${runMeta.durationMs}ms` : "";
      return { timeStr, dur };
    } catch (_) {
      return null;
    }
  }, [runMeta]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Problem panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-300">
              {problemTitle}
            </h2>
            <div className="text-right text-sm">
              <div>
                <span className="text-surface-600 dark:text-surface-400">
                  Category:{" "}
                </span>
                <span className="text-primary-700 dark:text-primary-300">
                  {category}
                </span>
              </div>
              <div>
                <span className="text-surface-600 dark:text-surface-400">
                  Difficulty:{" "}
                </span>
                <span className="text-yellow-700 dark:text-yellow-300">
                  {difficulty}
                </span>
              </div>
            </div>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed">{problemText}</p>
          </div>
        </div>
        {currentQuestion?.examples?.length ? (
          <div className="card">
            <h3 className="font-medium mb-2">Examples</h3>
            <ul className="space-y-2 text-sm">
              {currentQuestion.examples.map((ex, i) => (
                <li key={i} className="p-2 rounded bg-surface-800/40">
                  <div>
                    <span className="text-surface-400">Input: </span>
                    <code>{ex.input}</code>
                  </div>
                  {ex.output && (
                    <div>
                      <span className="text-surface-400">Output: </span>
                      <code>{ex.output}</code>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Editor + console */}
      <div className="lg:col-span-3 space-y-4">
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-surface-400">Language</label>
              <select
                value={language}
                onChange={(e) => onChangeLanguage?.(e.target.value)}
                className="form-input-dark !w-auto !py-1 !px-2 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const customCase =
                    testInput.trim() || testExpected.trim()
                      ? {
                          input: testInput.trim(),
                          expectedOutput: testExpected.trim() || undefined,
                        }
                      : undefined;
                  onRunCode?.(customCase);
                }}
                disabled={isRunning}
                className={`btn-primary !py-1 !px-3 text-sm ${
                  isRunning ? "opacity-70 cursor-wait" : ""
                }`}
              >
                {isRunning ? "Running..." : "Run Code"}
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={submittingAnswer || disableSubmit}
                className={`btn-primary !py-1 !px-3 text-sm ${
                  submittingAnswer || disableSubmit
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                title={
                  disableSubmit
                    ? "Run your code at least once before submitting"
                    : undefined
                }
              >
                {submittingAnswer
                  ? "Submitting..."
                  : disableSubmit
                  ? "Run First"
                  : "Next Question"}
              </button>
            </div>
          </div>

          <Editor
            height="380px"
            language={language}
            theme="vs-dark"
            value={code || ""}
            onChange={(val) => onChangeCode?.(val || "")}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />

          {/* Custom test case input */}
          <div className="mt-4 space-y-2">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">
                  ▶
                </span>
                Custom Test Case
              </summary>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block mb-1 opacity-70">Input (stdin)</label>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    rows={3}
                    placeholder={"e.g. 5\n10"}
                    className="form-input-dark w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 opacity-70">
                    Expected Output (optional)
                  </label>
                  <textarea
                    value={testExpected}
                    onChange={(e) => setTestExpected(e.target.value)}
                    rows={3}
                    placeholder={"e.g. 15"}
                    className="form-input-dark w-full text-xs"
                  />
                </div>
              </div>
              {(testInput || testExpected) && (
                <div className="mt-2 text-[10px] opacity-70">
                  This custom case will be appended to example test cases when
                  you run code.
                </div>
              )}
            </details>
          </div>

          {/* Judge0 not configured banner */}
          {runError && /Judge0 API not configured/i.test(runError) && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-medium mb-1">
                Remote code execution unavailable
              </div>
              <p>
                Judge0 API credentials are not set. You can still write code and
                submit the solution; execution will be enabled once RAPIDAPI_KEY
                or JUDGE0_API_KEY is configured on the server.
              </p>
            </div>
          )}

          {(runOutput || runError) &&
            !/Judge0 API not configured/i.test(runError || "") && (
              <div className="mt-3 space-y-3">
                {lastRunInfo && (
                  <div className="text-[11px] opacity-70">
                    Last run at {lastRunInfo.timeStr}
                    {lastRunInfo.dur ? ` • ${lastRunInfo.dur}` : ""}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium mb-1">Run Output</div>
                  <pre
                    className={`p-3 rounded-lg border whitespace-pre-wrap break-words ${
                      runError
                        ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                        : "bg-surface-100 border-surface-300 dark:bg-surface-800/40 dark:border-surface-700 dark:text-surface-100"
                    }`}
                  >
                    {runError ? runError : runOutput}
                  </pre>
                </div>
                {Array.isArray(runResults) && runResults.length > 1 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Test Cases</div>
                    <div className="space-y-2 max-h-48 overflow-auto pr-1">
                      {runResults.map((r, i) => {
                        const pass = r.pass;
                        return (
                          <div
                            key={i}
                            className={`p-2 rounded border text-xs font-mono whitespace-pre-wrap ${
                              pass === true
                                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200"
                                : pass === false
                                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200"
                                : "bg-surface-100 border-surface-300 dark:bg-surface-800/40 dark:border-surface-700 dark:text-surface-100"
                            }`}
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold">
                                Case {i + 1}
                              </span>
                              {pass === true && <span>✅</span>}
                              {pass === false && <span>❌</span>}
                            </div>
                            {r.input && (
                              <div>
                                <span className="opacity-70">Input: </span>
                                {r.input}
                              </div>
                            )}
                            {typeof r.expectedOutput !== "undefined" && (
                              <div>
                                <span className="opacity-70">Expected: </span>
                                {r.expectedOutput}
                              </div>
                            )}
                            {r.output && (
                              <div>
                                <span className="opacity-70">Output: </span>
                                {r.output.trim()}
                              </div>
                            )}
                            {r.status && (
                              <div>
                                <span className="opacity-70">Status: </span>
                                {r.status}
                              </div>
                            )}
                            {r.stderr && (
                              <div className="mt-1 text-red-600 dark:text-red-400">
                                {r.stderr}
                              </div>
                            )}
                            {r.compile_output && (
                              <div className="mt-1 text-red-600 dark:text-red-400">
                                {r.compile_output}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button onClick={onPrevious} className="flex-1 btn-secondary">
            Previous
          </button>
          <button
            onClick={onSkip}
            disabled={skipping}
            className={`flex-1 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-400 transition-colors ${
              skipping
                ? "bg-amber-400 text-white cursor-wait"
                : "bg-amber-500 text-white hover:bg-amber-600"
            }`}
          >
            {skipping ? "Skipping..." : "Skip"}
          </button>
          <button onClick={onNext} className="flex-1 btn-primary">
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodingAnswerUI;
