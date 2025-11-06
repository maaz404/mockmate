# Interview Timing & Status Management Fix Plan

## Issues Identified

### 1. Timer Management Issues

- **Problem**: Timer runs in client-side only, resets when page reloads
- **Impact**: When user leaves and resumes, timer starts fresh (30 mins again)
- **Root Cause**: `timeRemaining` state is initialized from `interview.config.duration` without checking elapsed time

### 2. Auto-Completion on Page Leave

- **Problem**: Timer continues counting in background, calls `handleEndInterview()` when reaching 0
- **Impact**: Interview marked as completed even though user left the page
- **Root Cause**: `useEffect` timer interval continues running until component unmounts

### 3. No Server-Side Time Tracking

- **Problem**: Server doesn't track or enforce time limits
- **Impact**: Client can manipulate time, no authoritative source
- **Root Cause**: `timing.startedAt` exists but no `timing.remainingSeconds` or enforcement

### 4. Resuming Completed Interviews

- **Problem**: InterviewPage allows opening completed interviews
- **Impact**: Users can try to record video/answer questions on completed interviews
- **Root Cause**: No status check or redirect when loading completed interview

## Solution Architecture

### Phase 1: Server-Side Time Tracking

1. Add `timing.remainingSeconds` to Interview model
2. When interview starts, set `remainingSeconds = config.duration * 60`
3. On each answer submission, calculate elapsed time and update remaining
4. Return remaining time in interview details response
5. Auto-complete when remainingSeconds <= 0

### Phase 2: Client-Side Time Sync

1. Initialize timer from `interview.timing.remainingSeconds` (not config.duration)
2. Add periodic sync with server (every 30 seconds) to get updated remaining time
3. If server says time's up, complete locally
4. Remove auto-complete on unmount - only complete when:
   - Time runs out naturally while user is active
   - User clicks "End Interview"
   - All questions answered

### Phase 3: Status Guards

1. In InterviewPage, check if interview.status === "completed"
2. If completed, show read-only view or redirect to results
3. Disable video recording, answer submission for completed interviews
4. Add visual indicator for in-progress vs completed

### Phase 4: Resume Logic

1. In InterviewHistoryPage, differentiate "Resume" vs "View" buttons
2. "Resume" only shown for status === "in-progress"
3. "View" for completed (goes to results page)
4. Add confirmation dialog before resuming

## Implementation Order

1. ✅ Add timing fields to model
2. ✅ Update startInterview to set remainingSeconds
3. ✅ Update submitAnswer to calculate/update remaining time
4. ✅ Add endpoint to get current remaining time
5. ✅ Modify completeInterview to check time limit
6. ✅ Update InterviewPage timer initialization
7. ✅ Add periodic time sync in InterviewPage
8. ✅ Add completed status guard in InterviewPage
9. ✅ Update InterviewHistoryPage buttons
10. ✅ Remove timer auto-complete on unmount

## Files to Modify

### Backend

- `server/src/models/Interview.js` - Add timing.remainingSeconds
- `server/src/controllers/interviewController.js`:
  - `startInterview` - Initialize remaining time
  - `submitAnswer` - Update remaining time
  - `getInterviewDetails` - Calculate and return current remaining time
  - `completeInterview` - Add time-based completion logic

### Frontend

- `client/src/pages/InterviewPage.js`:
  - Initialize timer from server remaining time
  - Add periodic sync
  - Add completed status check
  - Remove auto-complete on unmount
- `client/src/pages/InterviewHistoryPage.js`:
  - Update buttons based on status
  - Add confirmation for resume

## Testing Checklist

- [ ] Start interview, leave, resume - timer continues from where it left off
- [ ] Timer reaches 0 while actively using - auto-completes
- [ ] Leave page before time expires - doesn't auto-complete
- [ ] Resume in-progress interview - can continue
- [ ] Try to resume completed interview - redirects to results
- [ ] Video recording disabled for completed interviews
