import React, { useState, useMemo, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import Editor from "@monaco-editor/react";

/**
 * CodingQuestionUI
 * Same behavior as CodingAnswerUI, split for adaptive layout work.
 */
const CodingQuestionUI = ({
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
  settings,
  onSpeakQuestion,
  onStopSpeech,
  isSpeaking,
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

  // Resizable split pane state (desktop only)
  const [leftWidth, setLeftWidth] = useState(40); // percentage for problem panel
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      const container = document.getElementById("coding-split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
      const pct = Math.max(
        20,
        Math.min(60, ((x - rect.left) / rect.width) * 100)
      );
      setLeftWidth(pct);
    };
    const onUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // Keyboard shortcuts: Ctrl+Enter run, Ctrl+Shift+Enter next
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          onNext?.();
        } else {
          onRunCode?.();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onRunCode, onNext]);

  return (
    <div
      id="coding-split-container"
      className="flex flex-col lg:flex-row gap-6"
    >
      {/* Problem panel */}
      <div
        className="space-y-4"
        style={{
          width: "100%",
          maxWidth: "100%",
          ...(typeof window !== "undefined" && window.innerWidth >= 1024
            ? { width: `${leftWidth}%` }
            : {}),
        }}
      >
        <div className="card">
          <div className="mb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-300 mb-2">
                  {problemTitle}
                </h2>
                {currentQuestion?.tags && currentQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentQuestion.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-sm flex-shrink-0">
                <div className="mb-1">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300">
                    {category}
                  </span>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                      difficulty === "beginner"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : difficulty === "intermediate"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-surface-700 dark:text-surface-200">
              {problemText.split("\n").map((line, i) => {
                // Bold text for **text**
                if (line.includes("**")) {
                  const parts = line.split("**");
                  return (
                    <p key={i} className="mb-2">
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          <strong
                            key={j}
                            className="font-semibold text-surface-900 dark:text-surface-100"
                          >
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }
                // Code blocks for ```
                if (line.includes("```")) {
                  return null; // Handle separately if needed
                }
                // Bullet points
                if (line.trim().startsWith("•")) {
                  return (
                    <li key={i} className="ml-4 mb-1 text-sm">
                      {line.trim().substring(1).trim()}
                    </li>
                  );
                }
                // Inline code for `code`
                if (line.includes("`")) {
                  const parts = line.split("`");
                  return (
                    <p key={i} className="mb-2">
                      {parts.map((part, j) =>
                        j % 2 === 1 ? (
                          <code
                            key={j}
                            className="px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-xs font-mono text-primary-600 dark:text-primary-400"
                          >
                            {part}
                          </code>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  );
                }
                // Regular paragraphs
                return line.trim() ? (
                  <p key={i} className="mb-2">
                    {line}
                  </p>
                ) : (
                  <br key={i} />
                );
              })}
            </div>
          </div>
          {/* TTS replay button */}
          {onSpeakQuestion && problemText && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) {
                    onStopSpeech?.();
                  } else {
                    onSpeakQuestion(problemText);
                  }
                }}
                className="btn-ghost !py-1 !px-3 text-sm"
                title={isSpeaking ? "Stop reading" : "Read question aloud"}
              >
                {isSpeaking ? "⏹️ Stop" : "🔊 Read Aloud"}
              </button>
            </div>
          )}
        </div>
        {currentQuestion?.examples?.length ? (
          <div className="card">
            <h3 className="font-semibold text-base mb-3 text-surface-900 dark:text-surface-100">
              Examples
            </h3>
            <div className="space-y-3">
              {currentQuestion.examples.map((ex, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800/60 border border-surface-200 dark:border-surface-700"
                >
                  <div className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">
                    Example {i + 1}
                  </div>
                  <div className="space-y-1.5 text-sm font-mono">
                    <div>
                      <span className="text-surface-600 dark:text-surface-400 font-sans text-xs">
                        Input:{" "}
                      </span>
                      <code className="text-primary-700 dark:text-primary-300">
                        {ex.input}
                      </code>
                    </div>
                    {ex.output && (
                      <div>
                        <span className="text-surface-600 dark:text-surface-400 font-sans text-xs">
                          Output:{" "}
                        </span>
                        <code className="text-green-700 dark:text-green-300">
                          {ex.output}
                        </code>
                      </div>
                    )}
                    {ex.explanation && (
                      <div className="mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                        <span className="text-surface-600 dark:text-surface-400 font-sans text-xs">
                          Explanation:{" "}
                        </span>
                        <span className="text-surface-700 dark:text-surface-300 font-sans text-xs">
                          {ex.explanation}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Hints section - collapsible */}
        {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
          <div className="card">
            <details className="group">
              <summary className="cursor-pointer font-semibold text-base flex items-center gap-2 text-surface-900 dark:text-surface-100">
                <span className="group-open:rotate-90 transition-transform text-primary-600 dark:text-primary-400">
                  ▶
                </span>
                💡 Hints
              </summary>
              <div className="mt-3 space-y-2 pl-6">
                {currentQuestion.hints.map((hint, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200"
                  >
                    <span className="font-medium">Hint {i + 1}: </span>
                    {hint}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Editor + console */}
      <div className="space-y-4 flex-1 relative">
        <div className="card p-4 relative">
          \{/* Optional webcam mini preview */}
          {settings?.videoRecording && (
            <div className="absolute right-3 top-3 w-44 h-28 rounded-lg overflow-hidden border border-surface-600/50 shadow-lg hidden lg:block bg-black/40">
              <Webcam
                audio={false}
                mirrored
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover"
              />
            </div>
          )}
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
              <div className="mt-4 space-y-3">
                {lastRunInfo && (
                  <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
                    <span>⏱️</span>
                    <span>Last run: {lastRunInfo.timeStr}</span>
                    {lastRunInfo.dur && (
                      <span className="font-mono">• {lastRunInfo.dur}</span>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span>📤</span>
                    <span>Execution Output</span>
                  </div>
                  <pre
                    className={`p-4 rounded-lg border whitespace-pre-wrap break-words font-mono text-sm ${
                      runError
                        ? "bg-red-50 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200"
                        : "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200"
                    }`}
                  >
                    {runError
                      ? `❌ Error:\n${runError}`
                      : `✅ Success:\n${runOutput}`}
                  </pre>
                </div>
                {Array.isArray(runResults) && runResults.length > 1 && (
                  <div>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <span>🧪</span>
                      <span>Test Results</span>
                      <span className="text-xs font-normal text-surface-500 dark:text-surface-400">
                        ({runResults.filter((r) => r.pass === true).length}/
                        {runResults.length} passed)
                      </span>
                    </div>
                    <div className="space-y-2.5 max-h-64 overflow-auto pr-1">
                      {runResults.map((r, i) => {
                        const pass = r.pass;
                        return (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs font-mono whitespace-pre-wrap shadow-sm ${
                              pass === true
                                ? "bg-green-50 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200"
                                : pass === false
                                ? "bg-red-50 border-red-300 text-red-900 dark:bg-red-900/20 dark:border-red-700 dark:text-red-200"
                                : "bg-surface-100 border-surface-300 dark:bg-surface-800/40 dark:border-surface-600 dark:text-surface-100"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-current opacity-30">
                              <span className="font-bold text-sm">
                                Test Case {i + 1}
                              </span>
                              {pass === true && (
                                <span className="text-lg">✅</span>
                              )}
                              {pass === false && (
                                <span className="text-lg">❌</span>
                              )}
                            </div>
                            {r.input && (
                              <div className="mb-1">
                                <span className="font-semibold opacity-60">
                                  Input:{" "}
                                </span>
                                <span className="text-primary-700 dark:text-primary-300">
                                  {r.input}
                                </span>
                              </div>
                            )}
                            {typeof r.expectedOutput !== "undefined" && (
                              <div className="mb-1">
                                <span className="font-semibold opacity-60">
                                  Expected:{" "}
                                </span>
                                <span className="text-green-700 dark:text-green-300">
                                  {r.expectedOutput}
                                </span>
                              </div>
                            )}
                            {r.output && (
                              <div className="mb-1">
                                <span className="font-semibold opacity-60">
                                  Output:{" "}
                                </span>
                                <span
                                  className={
                                    pass
                                      ? "text-green-700 dark:text-green-300"
                                      : "text-red-700 dark:text-red-300"
                                  }
                                >
                                  {r.output.trim()}
                                </span>
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

      {/* Draggable Divider (desktop) */}
      <div
        className="hidden lg:block w-1 hover:w-1.5 bg-surface-700/60 rounded cursor-col-resize"
        onMouseDown={() => {
          isDraggingRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        onTouchStart={() => {
          isDraggingRef.current = true;
          document.body.style.userSelect = "none";
        }}
        style={{ alignSelf: "stretch" }}
        aria-label="Resize panels"
        title="Drag to resize"
      />
    </div>
  );
};

export default CodingQuestionUI;
