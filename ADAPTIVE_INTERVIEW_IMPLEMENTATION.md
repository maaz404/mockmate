# Adaptive Interview Layout Implementation

## Overview

Successfully implemented Phase 1 of the adaptive interview layout system. The interview now automatically detects question types and prepares for mode-specific UIs.

## Phase 1: Analysis & Scaffolding ✅ COMPLETE

### What Was Implemented

1. **Question Type State Infrastructure** (`InterviewPage.js`)

   - Added `questionType` state: `"spoken"` or `"coding"`
   - Automatic detection based on `question.type` or `question.category`
   - Updates automatically when navigating between questions

2. **Placeholder Components Created**

   - `client/src/components/interview/SpokenAnswerUI.js`

     - Wrapper component for behavioral/technical questions
     - Currently passes through children (existing UI)

   - `client/src/components/interview/CodingAnswerUI.js`
     - Wrapper component for coding challenges
     - Shows "Coding Mode - Under Construction" placeholder

3. **Conditional Rendering**
   - Interview interface now switches based on `questionType`
   - Spoken questions → `SpokenAnswerUI` component
   - Coding questions → `CodingAnswerUI` component

### Code Changes

**InterviewPage.js:**

- Lines 10-11: Imported `SpokenAnswerUI` and `CodingAnswerUI`
- Line 44: Added `questionType` state
- Lines 196-203: Added useEffect to auto-detect question type:
  ```javascript
  useEffect(() => {
    if (interview?.questions?.[currentQuestionIndex]) {
      const question = interview.questions[currentQuestionIndex];
      const type = question.type || question.category || "spoken";
      setQuestionType(type.toLowerCase() === "coding" ? "coding" : "spoken");
    }
  }, [currentQuestionIndex, interview]);
  ```
- Lines 676-1050: Wrapped existing UI with conditional rendering:
  ```javascript
  {
    questionType === "spoken" ? (
      <SpokenAnswerUI>
        {/* Existing grid layout with video + questions */}
      </SpokenAnswerUI>
    ) : (
      <CodingAnswerUI>
        {/* Placeholder - to be built in Phase 3 */}
      </CodingAnswerUI>
    );
  }
  ```

### Current Behavior

- **Behavioral/Technical Questions**: Display full existing UI (video, question, response textarea, settings)
- **Coding Questions**: Show placeholder "Coding Mode - Under Construction" message
- **Automatic Switching**: Question type detection happens seamlessly as user navigates

### Testing Recommendations

1. Start an interview with mixed question types
2. Navigate between behavioral and coding questions
3. Verify UI switches automatically
4. Confirm existing features still work (video recording, TTS, skip, next/previous)

## Next Steps: Phase 2 - Build Spoken Mode UI

### Objective

Move the existing UI components into the `SpokenAnswerUI` component and enhance with voice features.

### Tasks

1. **Refactor SpokenAnswerUI Component**

   - Accept all necessary props from InterviewPage
   - Move the grid layout with video + question sections into component
   - Maintain all existing functionality

2. **Enhance Voice Features**

   - Rename "Start" button → "Record Answer"
   - Integrate Web Speech API for live transcription (already exists in VideoRecorder)
   - Consider adding ElevenLabs TTS if needed (currently using browser TTS)
   - Wire up recording → transcription → save flow

3. **Props to Pass**
   ```javascript
   <SpokenAnswerUI
     interview={interview}
     currentQuestion={currentQuestion}
     currentQuestionIndex={currentQuestionIndex}
     responses={responses}
     onResponseChange={handleResponseChange}
     settings={settings}
     permission={permission}
     isRecording={isRecording}
     // ... all other necessary state and handlers
   />
   ```

## Next Steps: Phase 3 - Build Coding Mode UI

### Objective

Create dedicated coding challenge interface with Monaco editor and Judge0 execution.

### Tasks

1. **Create Judge0 Backend Route**

   - Endpoint: `POST /api/execute-code`
   - Verify if already exists, if not create new route
   - Handle code execution with Judge0 API

2. **Build CodingAnswerUI Layout**

   - **Left Side (40%)**: Problem description card
   - **Right Side (60%)**: Monaco editor
   - **Bottom**: Console/output area
   - **Actions**: "Run Code" + "Submit Solution" buttons

3. **Code Execution Flow**

   - User writes code in Monaco editor
   - Click "Run Code" → sends to Judge0 → displays output
   - Click "Submit Solution" → saves code with interview response

4. **Props to Pass**
   ```javascript
   <CodingAnswerUI
     interview={interview}
     currentQuestion={currentQuestion}
     currentQuestionIndex={currentQuestionIndex}
     codeSnippets={codeSnippets}
     onCodeChange={(val) =>
       setCodeSnippets((prev) => ({ ...prev, [idx]: val }))
     }
     codeLanguage={codeLanguage}
     onLanguageChange={setCodeLanguage}
     onRunCode={handleRunCode}
     runOutput={runOutput}
     runError={runError}
     isRunning={isRunning}
   />
   ```

## Next Steps: Phase 4 - Final Review & Polish

### Tasks

1. **State Management Review**

   - Verify responses saved correctly for both spoken and coding answers
   - Check transcript storage from voice recordings
   - Ensure code snippets persisted properly

2. **Error Handling**

   - Add error boundaries for each mode
   - Handle Judge0 API failures gracefully
   - Check for race conditions during mode switching

3. **Cleanup**

   - Remove placeholder text from CodingAnswerUI
   - Remove any console.logs added during development
   - Update component prop types/documentation

4. **Testing**
   - Test full interview flow with mixed question types
   - Verify data persistence and retrieval
   - Check results page displays both spoken and coding answers correctly

## Architecture Notes

### Why This Approach?

- **Incremental**: Build in phases, each phase can be tested independently
- **Non-Breaking**: Existing interviews continue to work during refactor
- **Maintainable**: Separation of concerns - each mode has its own component
- **Flexible**: Easy to add new question types in future (e.g., "system-design", "whiteboard")

### Key Design Decisions

1. **Auto-Detection**: Question type determined by `question.type` or `question.category`
2. **Component Composition**: Use `children` prop to pass existing UI during transition
3. **State Hoisting**: Parent (InterviewPage) manages state, children receive props
4. **Feature Preservation**: All existing features (video, TTS, follow-ups) maintained

## Files Modified

- ✅ `client/src/pages/InterviewPage.js` - Added state, imports, conditional rendering
- ✅ `client/src/components/interview/SpokenAnswerUI.js` - Created placeholder
- ✅ `client/src/components/interview/CodingAnswerUI.js` - Created placeholder

## Status

- ✅ Phase 1: Complete - No errors, conditional rendering working
- ⏳ Phase 2: Pending - Build Spoken Mode UI
- ⏳ Phase 3: Pending - Build Coding Mode UI
- ⏳ Phase 4: Pending - Final review and polish
