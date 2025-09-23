const axios = require('axios');

class Judge0Service {
  constructor() {
    this.baseURL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
    this.rapidApiKey = process.env.RAPIDAPI_KEY;
    this.enabled = !!this.rapidApiKey;
    
    if (!this.enabled) {
      console.warn('Judge0 API not configured. Code execution will use fallback method.');
    }

    // Language mappings for Judge0
    this.languageIds = {
      javascript: 63, // Node.js
      python: 71,     // Python 3
      java: 62,       // Java
      cpp: 54,        // C++
      c: 50,          // C
      csharp: 51      // C#
    };
  }

  /**
   * Submit code for execution
   */
  async executeCode(code, language, input = '') {
    if (!this.enabled) {
      throw new Error('Judge0 API not configured');
    }

    try {
      const languageId = this.languageIds[language];
      if (!languageId) {
        throw new Error(`Language ${language} not supported`);
      }

      // Submit code for execution
      const submissionResponse = await axios.post(
        `${this.baseURL}/submissions`,
        {
          source_code: Buffer.from(code).toString('base64'),
          language_id: languageId,
          stdin: input ? Buffer.from(input).toString('base64') : '',
          wait: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
        }
      );

      const token = submissionResponse.data.token;
      
      // Poll for result
      return await this.pollForResult(token);
      
    } catch (error) {
      throw new Error(`Judge0 execution failed: ${error.message}`);
    }
  }

  /**
   * Poll Judge0 for execution result
   */
  async pollForResult(token, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(
          `${this.baseURL}/submissions/${token}`,
          {
            headers: {
              'X-RapidAPI-Key': this.rapidApiKey,
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
            }
          }
        );

        const result = response.data;
        
        // Check if execution is complete
        if (result.status.id <= 2) {
          // Still processing, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        return {
          stdout: result.stdout ? Buffer.from(result.stdout, 'base64').toString() : '',
          stderr: result.stderr ? Buffer.from(result.stderr, 'base64').toString() : '',
          compile_output: result.compile_output ? Buffer.from(result.compile_output, 'base64').toString() : '',
          status: result.status,
          time: result.time,
          memory: result.memory
        };
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new Error(`Failed to get execution result: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Execution timeout - result not available');
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languageIds);
  }

  /**
   * Check if Judge0 is configured and available
   */
  isAvailable() {
    return this.enabled;
  }
}

module.exports = new Judge0Service();