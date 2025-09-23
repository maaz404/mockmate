# Judge0 API Setup Guide

This guide explains how to set up the Judge0 API for code execution in MockMate's coding challenge feature.

## Overview

MockMate uses Judge0 API for secure, sandboxed code execution across multiple programming languages. The integration supports:

- **JavaScript** (Node.js)
- **Python** 3
- **Java**
- **C++**
- **C**
- **C#**

## Setup Instructions

### 1. Get RapidAPI Account

1. Visit [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to the [Judge0 CE API](https://rapidapi.com/judge0-official/api/judge0-ce/)

### 2. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Judge0 Configuration (for code execution)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3. Testing the Integration

The system includes fallback mechanisms:

- **With API Key**: Uses Judge0 for secure execution
- **Without API Key**: Falls back to local JavaScript execution (development only)

### 4. Language Support

| Language   | Judge0 ID | Extension | Runtime      |
|------------|-----------|-----------|--------------|
| JavaScript | 63        | .js       | Node.js      |
| Python     | 71        | .py       | Python 3     |
| Java       | 62        | .java     | Java 8+      |
| C++        | 54        | .cpp      | g++          |
| C          | 50        | .c        | gcc          |
| C#         | 51        | .cs       | .NET Core    |

## Features

### Code Execution
- Secure sandboxed environment
- Timeout protection
- Memory limit enforcement
- Error handling and reporting

### Test Case Validation
- Multiple test case support
- Input/output comparison
- Execution time tracking
- Performance metrics

### AI Code Review
- OpenAI integration for code analysis
- Quality assessment scoring
- Improvement suggestions
- Best practices recommendations

## API Endpoints

The coding challenge endpoints are available at:

- `POST /api/coding/session` - Create coding session
- `GET /api/coding/session/:sessionId/current` - Get current challenge
- `POST /api/coding/session/:sessionId/submit` - Submit code
- `POST /api/coding/test` - Test code without submission

## Error Handling

The system gracefully handles:

- API timeouts
- Compilation errors
- Runtime exceptions
- Network connectivity issues
- Invalid code submissions

## Security

Judge0 provides:
- Isolated execution environment
- Resource limits (CPU, memory, time)
- Network restrictions
- File system isolation

## Development vs Production

### Development
- Uses fallback local execution when Judge0 not configured
- Limited to JavaScript execution
- Warning messages displayed in console

### Production
- Requires Judge0 API configuration
- Full multi-language support
- Secure sandboxed execution
- Performance monitoring

## Troubleshooting

### Common Issues

1. **"Judge0 API not configured" warning**
   - Add RAPIDAPI_KEY to environment variables
   - Verify Judge0 subscription on RapidAPI

2. **Execution timeouts**
   - Check network connectivity
   - Verify RapidAPI quotas
   - Review code complexity

3. **Language not supported errors**
   - Verify language ID mapping
   - Check Judge0 language availability

### Debug Mode

Set `NODE_ENV=development` to enable:
- Detailed error logging
- Fallback execution warnings
- API response debugging

## Cost Considerations

Judge0 on RapidAPI offers:
- **Free Tier**: 1000 requests/month
- **Basic Plan**: $10/month for 10,000 requests
- **Pro Plans**: Higher limits and features

Monitor usage through RapidAPI dashboard.

## Migration Notes

When migrating from local execution:
1. Update environment variables
2. Test with sample code submissions
3. Verify all supported languages work
4. Monitor API usage and costs

## Support

For issues:
1. Check Judge0 API status on RapidAPI
2. Review MockMate server logs
3. Test with simple code examples
4. Verify API key permissions