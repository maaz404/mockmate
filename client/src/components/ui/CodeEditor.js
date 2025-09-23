import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, Settings } from 'lucide-react';

const CodeEditor = ({ 
  value, 
  onChange, 
  language = 'javascript',
  onLanguageChange,
  onRun,
  loading = false,
  readOnly = false,
  height = '400px',
  theme = 'vs-dark'
}) => {
  const editorRef = useRef(null);

  const supportedLanguages = [
    { value: 'javascript', label: 'JavaScript', ext: 'js' },
    { value: 'python', label: 'Python', ext: 'py' },
    { value: 'java', label: 'Java', ext: 'java' },
    { value: 'cpp', label: 'C++', ext: 'cpp' },
    { value: 'c', label: 'C', ext: 'c' }
  ];

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
      lineNumbers: 'on',
      renderWhitespace: 'selection'
    });

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRun && !loading) {
        onRun();
      }
    });
  };

  const handleReset = () => {
    if (editorRef.current && onChange) {
      const defaultCode = getDefaultCode(language);
      onChange(defaultCode);
      editorRef.current.setValue(defaultCode);
    }
  };

  const getDefaultCode = (lang) => {
    const templates = {
      javascript: `// Write your solution here
function solution() {
    // Your code here
    return result;
}

// Test your solution
// console.log(solution());`,
      python: `# Write your solution here
def solution():
    # Your code here
    return result

# Test your solution
if __name__ == "__main__":
    print(solution())`,
      java: `public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println(sol.solution());
    }
    
    public Object solution() {
        // Your code here
        return null;
    }
}`,
      cpp: `#include <iostream>
#include <vector>

class Solution {
public:
    // Your solution here
};

int main() {
    Solution sol;
    // Test your solution
    return 0;
}`,
      c: `#include <stdio.h>

// Your solution here

int main() {
    // Test your solution
    return 0;
}`
    };
    
    return templates[lang] || templates.javascript;
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-gray-500" />
            <select
              value={language}
              onChange={(e) => onLanguageChange && onLanguageChange(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={readOnly}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Reset Button */}
          {!readOnly && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              title="Reset to template"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          )}

          {/* Run Button */}
          {onRun && (
            <button
              onClick={onRun}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 rounded transition-colors"
              title="Run code (Ctrl+Enter)"
            >
              <Play className="h-4 w-4" />
              <span>{loading ? 'Running...' : 'Run'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          theme={theme}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading editor...</div>
            </div>
          }
          options={{
            readOnly,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-1 text-xs text-gray-500 flex justify-between">
        <span>
          {supportedLanguages.find(l => l.value === language)?.label || 'Unknown'} • 
          {value?.split('\n').length || 0} lines
        </span>
        <span>
          Press Ctrl+Enter to run
        </span>
      </div>
    </div>
  );
};

export default CodeEditor;