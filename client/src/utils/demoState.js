// Simple event-based demo state communication between pages and the Navbar.
// Pages (e.g., CodingChallengeDemo, VideoRecordingDemo) dispatch demo state updates
// and register action handlers; Navbar listens and renders enhanced UI.

const DEMO_STATE_EVENT = "demo:state";
const DEMO_PRIMARY_ACTION_EVENT = "demo:action:primary";

// Shape of state (advisory): {
//   mode: 'coding' | 'video',
//   title: string,
//   subtitle?: string,
//   progress?: number (0-1),
//   primaryActionLabel?: string
// }

export function setDemoState(state) {
  window.dispatchEvent(new CustomEvent(DEMO_STATE_EVENT, { detail: state }));
}

export function clearDemoState() {
  window.dispatchEvent(new CustomEvent(DEMO_STATE_EVENT, { detail: null }));
}

export function triggerDemoPrimaryAction() {
  window.dispatchEvent(new CustomEvent(DEMO_PRIMARY_ACTION_EVENT));
}

export function onDemoPrimaryAction(handler) {
  window.addEventListener(DEMO_PRIMARY_ACTION_EVENT, handler);
  return () => window.removeEventListener(DEMO_PRIMARY_ACTION_EVENT, handler);
}

export function onDemoState(handler) {
  window.addEventListener(DEMO_STATE_EVENT, handler);
  return () => window.removeEventListener(DEMO_STATE_EVENT, handler);
}

// Provide a convenience hook (optional) if React available; wrapped to avoid circular deps.
// eslint-disable-next-line import/no-mutable-exports
export let useDemoState;
try {
  // Dynamically require React only if available (runtime guard for tests)
  // eslint-disable-next-line global-require
  const React = require("react");
  useDemoState = function useDemoStateImpl() {
    const [demoState, setDemoStateValue] = React.useState(null);
    React.useEffect(() => {
      const unsub = onDemoState((e) => setDemoStateValue(e.detail));
      return () => unsub();
    }, []);
    return demoState;
  };
} catch (_) {
  // ignore if React not present
}
