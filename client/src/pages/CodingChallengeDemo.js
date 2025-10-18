import React, { useState, useEffect, useMemo, useRef } from "react";
import CodeEditor from "../components/ui/CodeEditor";
import CodeExecutionResults from "../components/ui/CodeExecutionResults";
import { setDemoState } from "../utils/demoState";

const CodingChallengeDemo = () => {
  const [code, setCode] = useState(`// Two Sum Problem - LeetCode #1
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) return [map.get(complement), i];
        map.set(nums[i], i);
    }
    return [];
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6)); // Expected: [1, 2]`);

  const [language, setLanguage] = useState("javascript");
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [consoleLines, setConsoleLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minute timer (demo)
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [overlayRect, setOverlayRect] = useState({
    x: 80,
    y: 80,
    width: 900,
    height: 480,
  });
  const dragState = useRef(null);
  const resizeState = useRef(null);
  // Viewport clamp helper
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  const handleDragMove = (e) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setOverlayRect((r) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        ...r,
        x: clamp(dragState.current.origX + dx, 0, vw - 200),
        y: clamp(dragState.current.origY + dy, 0, vh - 120),
      };
    });
  };
  const handleDragEnd = () => {
    dragState.current = null;
    window.removeEventListener("pointermove", handleDragMove);
  };

  const handleResizeMove = (e) => {
    if (!resizeState.current) return;
    const dx = e.clientX - resizeState.current.startX;
    const dy = e.clientY - resizeState.current.startY;
    setOverlayRect((r) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const minW = 360;
      const minH = 240;
      const maxW = vw - r.x - 16;
      const maxH = vh - r.y - 16;
      return {
        ...r,
        width: clamp(resizeState.current.origW + dx, minW, maxW),
        height: clamp(resizeState.current.origH + dy, minH, maxH),
      };
    });
  };
  const handleResizeEnd = () => {
    resizeState.current = null;
    window.removeEventListener("pointermove", handleResizeMove);
  };

  const passRatio = useMemo(() => {
    if (!executionResult) return 0;
    return executionResult.totalTests > 0
      ? executionResult.passedTests / executionResult.totalTests
      : 0;
  }, [executionResult]);

  const progressGradient = useMemo(() => {
    if (passRatio === 1)
      return "from-green-500 via-green-500 to-green-600 dark:from-green-400 dark:via-green-400 dark:to-green-500";
    if (passRatio >= 0.5)
      return "from-blue-500 via-primary-500 to-primary-600 dark:from-blue-400 dark:via-primary-400 dark:to-primary-500";
    if (passRatio > 0)
      return "from-amber-500 via-orange-500 to-orange-600 dark:from-amber-400 dark:via-orange-400 dark:to-orange-500";
    return "from-red-500 via-red-500 to-red-600 dark:from-red-400 dark:via-red-400 dark:to-red-500";
  }, [passRatio]);

  // Demo navbar integration
  useEffect(() => {
    setDemoState({
      mode: "coding",
      title: "Two Sum Problem",
      progress: executionResult ? passRatio : 0.25,
      primaryActionLabel: "Run",
    });
  }, [executionResult, passRatio]);

  // Handle body scroll + ESC key when console expanded
  useEffect(() => {
    if (consoleExpanded) {
      const handleKey = (e) => {
        if (e.key === "Escape") setConsoleExpanded(false);
      };
      document.addEventListener("keydown", handleKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = prev;
      };
    }
  }, [consoleExpanded]);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const timeDisplay = useMemo(() => {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [timeLeft]);

  const handleCodeExecution = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    const startTs = performance.now();
    setConsoleLines((lines) => [
      ...lines,
      `> Running (${language}) at ${new Date().toLocaleTimeString()}...`,
    ]);
    try {
      const payload = { code, language, challengeId: "two-sum" };
      const res = await (
        await import("../services/api")
      ).apiService.post("/coding/test", payload);
      if (!res?.success) throw new Error(res?.message || "Execution failed");
      const data = res.data || {};
      const mapped = {
        success: true,
        testResults: data.testResults || [],
        score: data.score ?? data.codeReview?.score ?? 0,
        passedTests: data.passedTests ?? 0,
        totalTests:
          data.totalTests ?? (data.testResults ? data.testResults.length : 0),
        codeReview: data.codeReview || null,
      };
      // Annotate each test with simple executionTime if absent
      mapped.testResults = mapped.testResults.map((t, i) => ({
        testIndex: i,
        executionTime: t.executionTime || 1,
        ...t,
      }));
      setExecutionResult(mapped);
      const totalRuntime = mapped.testResults.reduce(
        (a, b) => a + (b.executionTime || 0),
        0
      );
      setConsoleLines((lines) => [
        ...lines,
        `> Tests: ${mapped.passedTests}/${mapped.totalTests} passed`,
        `> Score: ${mapped.score}`,
        `> Runtime: ${totalRuntime} ms`,
      ]);
    } catch (err) {
      setConsoleLines((lines) => [
        ...lines,
        `> Execution error: ${err.message || err}`,
      ]);
    } finally {
      const elapsed = Math.round(performance.now() - startTs);
      setConsoleLines((lines) => [...lines, `> Finished in ${elapsed} ms`]);
      setIsExecuting(false);
    }
  };

  const handleSubmit = () => {
    if (!executionResult) {
      setConsoleLines((l) => [...l, "> Run your code before submitting"]);
      return;
    }
    setSubmitting(true);
    setConsoleLines((l) => [...l, "> Submitting solution..."]);
    setTimeout(() => {
      setConsoleLines((l) => [...l, "> Submission accepted (demo)."]);
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900 py-6 transition-colors duration-200">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-surface-800 dark:text-surface-50">
            Two Sum Problem
          </h1>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 text-xs">
            {timeDisplay}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Left / Problem Section (sticky) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 self-start max-h-[calc(100vh-6rem)]">
            <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden h-full">
              <div className="flex border-b border-surface-200 dark:border-surface-700 text-sm font-medium shrink-0">
                {["description", "hints", "solution"].map((id) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={[
                      "px-4 py-2.5 transition-colors",
                      activeTab === id
                        ? "bg-surface-100 dark:bg-surface-700/50 text-surface-900 dark:text-surface-50"
                        : "text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200",
                    ].join(" ")}
                  >
                    {id.charAt(0).toUpperCase() + id.slice(1)}
                  </button>
                ))}
              </div>
              <div className="p-5 space-y-4 text-sm leading-relaxed overflow-auto flex-1">
                {activeTab === "description" && (
                  <>
                    <div>
                      <h2 className="font-semibold mb-2 text-surface-900 dark:text-surface-50">
                        Problem Statement
                      </h2>
                      <p className="text-surface-700 dark:text-surface-300">
                        Given an array of integers{" "}
                        <code className="bg-surface-200 dark:bg-surface-700 px-1 rounded">
                          nums
                        </code>{" "}
                        and an integer{" "}
                        <code className="bg-surface-200 dark:bg-surface-700 px-1 rounded">
                          target
                        </code>
                        , return indices of the two numbers such that they add
                        up to{" "}
                        <code className="bg-surface-200 dark:bg-surface-700 px-1 rounded">
                          target
                        </code>
                        .
                      </p>
                      <p className="text-surface-700 dark:text-surface-300">
                        You may assume that each input would have exactly one
                        solution, and you may not use the same element twice.
                      </p>
                    </div>
                    <div className="bg-surface-50 dark:bg-surface-900/40 rounded-lg p-4 border border-surface-200 dark:border-surface-700">
                      <p className="font-medium mb-1">Example 1:</p>
                      <pre className="text-xs whitespace-pre-wrap">
                        Input: nums = [2,7,11,15], target = 9\nOutput:
                        [0,1]\nExplanation: Because nums[0] + nums[1] == 9.
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Constraints:</p>
                      <ul className="list-disc ml-5 space-y-1 text-surface-600 dark:text-surface-400">
                        <li>
                          2 ≤ nums.length ≤ 10<sup>4</sup>
                        </li>
                        <li>
                          -10<sup>9</sup> ≤ nums[i] ≤ 10<sup>9</sup>
                        </li>
                        <li>
                          -10<sup>9</sup> ≤ target ≤ 10<sup>9</sup>
                        </li>
                        <li>Only one valid answer exists</li>
                      </ul>
                    </div>
                  </>
                )}
                {activeTab === "hints" && (
                  <ul className="list-disc ml-5 space-y-2 text-surface-600 dark:text-surface-400">
                    <li>Use a hash map for faster complement lookups.</li>
                    <li>Can you do it in one pass?</li>
                    <li>What is the time / space complexity?</li>
                  </ul>
                )}
                {activeTab === "solution" && (
                  <pre className="text-xs bg-surface-100 dark:bg-surface-800 p-3 rounded-md overflow-auto">{`function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) return [map.get(complement), i];
    map.set(nums[i], i);
  }
  return [];
}`}</pre>
                )}
              </div>
            </div>
          </div>

          {/* Right / Coding Panel */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-700 text-xs">
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="form-select text-xs py-2 h-8 !bg-surface-100 dark:!bg-surface-700 !border-surface-300 dark:!border-surface-600"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                  <span className="text-surface-500 dark:text-surface-400 hidden md:inline">
                    Auto-save enabled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCodeExecution}
                    disabled={isExecuting}
                    className="px-4 h-9 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isExecuting && (
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    Run Code
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-4 h-9 rounded-md bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
                onRun={handleCodeExecution}
                loading={isExecuting}
                height="420px"
              />
            </div>

            {/* Execution Summary Bar */}
            {executionResult && (
              <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-800/70 backdrop-blur-sm px-4 pt-3 pb-2 flex flex-col gap-2 text-xs shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const full = passRatio === 1;
                      const partial = passRatio > 0 && passRatio < 1;
                      const cls = full
                        ? "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20"
                        : partial
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20";
                      return (
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${cls}`}
                        >
                          {executionResult.passedTests}/
                          {executionResult.totalTests} Passed
                        </span>
                      );
                    })()}
                    <span className="text-surface-500 dark:text-surface-400">
                      Score:{" "}
                      <span className="font-medium text-primary-600 dark:text-primary-400">
                        {executionResult.codeReview?.score}
                      </span>
                    </span>
                  </div>
                  <div className="hidden md:block text-surface-400 dark:text-surface-500">
                    Runtime:{" "}
                    {executionResult.testResults.reduce(
                      (a, b) => a + b.executionTime,
                      0
                    )}{" "}
                    ms
                  </div>
                  <div className="grow" />
                  <button
                    onClick={handleCodeExecution}
                    className="px-3 h-8 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium text-xs"
                  >
                    Rerun
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-3 h-8 rounded-md bg-primary-600 hover:bg-primary-500 text-white font-medium text-xs disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Again"}
                  </button>
                </div>
                {/* Animated progress bar */}
                <div className="h-2 rounded bg-surface-200 dark:bg-surface-700 overflow-hidden relative">
                  <div
                    className={`h-full bg-gradient-to-r ${progressGradient} transition-all duration-700`}
                    style={{ width: `${Math.round(passRatio * 100)}%` }}
                    aria-label="Test pass progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(passRatio * 100)}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.6)_45%,rgba(255,255,255,0)_60%)] animate-[shimmer_2.5s_infinite] pointer-events-none" />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 auto-rows-[1fr]">
              <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 flex flex-col h-full">
                <h3 className="font-medium mb-3 text-surface-800 dark:text-surface-50 text-sm flex items-center gap-2">
                  Test Cases
                </h3>
                <div className="space-y-3 overflow-auto text-xs">
                  {(
                    executionResult?.testResults || [
                      {
                        testIndex: 0,
                        input: [[2, 7, 11, 15], 9],
                        expected: [0, 1],
                      },
                      { testIndex: 1, input: [[3, 2, 4], 6], expected: [1, 2] },
                    ]
                  ).map((tr) => (
                    <div
                      key={tr.testIndex}
                      className="border border-surface-200 dark:border-surface-600 rounded-md p-2"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">
                          Test {tr.testIndex + 1}
                        </span>
                        {tr.passed !== undefined && (
                          <span
                            className={
                              tr.passed ? "text-green-500" : "text-red-500"
                            }
                          >
                            {tr.passed ? "Passed" : "Failed"}
                          </span>
                        )}
                      </div>
                      <div className="text-surface-600 dark:text-surface-400">
                        Input: {JSON.stringify(tr.input)}
                      </div>
                      <div className="text-surface-600 dark:text-surface-400">
                        Expected: {JSON.stringify(tr.expected)}
                      </div>
                      {tr.actual && (
                        <div className="text-surface-600 dark:text-surface-400">
                          Actual: {JSON.stringify(tr.actual)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-surface-800 dark:text-surface-50 text-sm">
                    Console Output
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConsoleExpanded(true)}
                      className="px-2 py-1 text-[10px] rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-600 dark:text-surface-300 transition-colors"
                      title="Expand Console"
                    >
                      Maximize
                    </button>
                    <button
                      onClick={() => setConsoleLines([])}
                      className="px-2 py-1 text-[10px] rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 text-surface-600 dark:text-surface-300 transition-colors"
                      title="Clear Console"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-black/90 text-green-300 font-mono text-[11px] rounded-md p-3 overflow-auto">
                  {consoleLines.length === 0 ? (
                    <div className="opacity-50">
                      Click "Run Code" to see output...
                    </div>
                  ) : (
                    consoleLines.map((l, i) => <div key={i}>{l}</div>)
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 flex flex-col h-full">
                <h3 className="font-medium mb-3 text-surface-800 dark:text-surface-50 text-sm">
                  AI Code Analysis
                </h3>
                <div className="flex-1 overflow-auto">
                  <CodeExecutionResults
                    result={executionResult}
                    loading={isExecuting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Expanded Console Overlay */}
      {consoleExpanded && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm"
            onClick={() => setConsoleExpanded(false)}
          />
          {/* Draggable Panel */}
          <div
            className="absolute bg-surface-900/95 border border-surface-700 rounded-lg flex flex-col shadow-xl pointer-events-auto"
            style={{
              top: overlayRect.y,
              left: overlayRect.x,
              width: overlayRect.width,
              height: overlayRect.height,
              minWidth: 360,
              minHeight: 240,
            }}
          >
            <div
              className="flex items-center justify-between px-3 h-10 cursor-move select-none bg-surface-800 border-b border-surface-700 rounded-t-lg gap-2"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                dragState.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: overlayRect.x,
                  origY: overlayRect.y,
                };
                window.addEventListener("pointermove", handleDragMove);
                window.addEventListener("pointerup", handleDragEnd, {
                  once: true,
                });
              }}
            >
              <div className="flex items-center gap-2 text-xs text-surface-300">
                <span className="font-medium">Console Output</span>
                <span className="px-1.5 py-0.5 rounded bg-surface-700/80">
                  Drag to move
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleLines([])}
                  className="px-2 h-7 rounded bg-surface-700 hover:bg-surface-600 text-surface-300 text-[11px]"
                >
                  Clear
                </button>
                <button
                  onClick={handleCodeExecution}
                  className="px-2 h-7 rounded bg-green-600 hover:bg-green-500 text-white text-[11px]"
                >
                  Rerun
                </button>
                <button
                  onClick={() => setConsoleExpanded(false)}
                  className="px-2 h-7 rounded bg-primary-600 hover:bg-primary-500 text-white text-[11px]"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-black rounded-b-lg text-green-300 font-mono text-xs">
              {consoleLines.length === 0 ? (
                <div className="opacity-50">No output yet. Run your code.</div>
              ) : (
                consoleLines.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
            {/* Resize handle */}
            <div
              className="absolute w-4 h-4 bottom-1 right-1 cursor-se-resize text-surface-500"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                resizeState.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  origW: overlayRect.width,
                  origH: overlayRect.height,
                };
                window.addEventListener("pointermove", handleResizeMove);
                window.addEventListener("pointerup", handleResizeEnd, {
                  once: true,
                });
              }}
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 opacity-60">
                <path
                  fill="currentColor"
                  d="M10 16h2v-2h-2v2Zm4 0h2v-6h-2v6ZM10 12h2v-2h-2v2Zm4-4h2V6h-2v2Zm0-4h2V0h-2v4Z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// (All handlers defined within component to access state setters)

export default CodingChallengeDemo;
