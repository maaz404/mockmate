const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerationService {
  /**
   * Generate PDF report from session summary
   */
  async generateSessionSummaryPDF(summary, userProfile) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          margin: 50,
          size: 'A4'
        });

        // Buffer to collect PDF data
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate PDF content
        this.generatePDFContent(doc, summary, userProfile);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate the PDF content
   */
  generatePDFContent(doc, summary, userProfile) {
    const pageWidth = doc.page.width - 100; // Account for margins

    // Header
    this.addHeader(doc, summary, userProfile);
    
    // Session Overview
    this.addSessionOverview(doc, summary);
    
    // Performance Metrics
    this.addPerformanceMetrics(doc, summary);
    
    // Category Scores
    this.addCategoryScores(doc, summary);
    
    // Performance Highlights
    this.addPerformanceHighlights(doc, summary);
    
    // Time Analysis
    this.addTimeAnalysis(doc, summary);
    
    // Overall Assessment
    this.addOverallAssessment(doc, summary);
    
    // Footer
    this.addFooter(doc, summary);
  }

  addHeader(doc, summary, userProfile) {
    // Title
    doc.fontSize(24)
       .fillColor('#1f2937')
       .text('Interview Session Summary', 50, 50);

    // Subtitle
    doc.fontSize(16)
       .fillColor('#6b7280')
       .text(`${summary.sessionInfo.jobRole} - ${summary.sessionInfo.experienceLevel}`, 50, 80);

    // Date and candidate info
    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Generated: ${new Date(summary.generatedAt).toLocaleDateString()}`, 50, 110)
       .text(`Candidate: ${userProfile?.firstName || 'N/A'} ${userProfile?.lastName || ''}`, 300, 110)
       .text(`Interview Type: ${summary.sessionInfo.interviewType}`, 50, 125)
       .text(`Completed: ${new Date(summary.sessionInfo.completedAt).toLocaleDateString()}`, 300, 125);

    // Horizontal line
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, 150)
       .lineTo(doc.page.width - 50, 150)
       .stroke();

    doc.y = 170; // Set position for next content
  }

  addSessionOverview(doc, summary) {
    this.addSectionTitle(doc, 'Session Overview');

    const metrics = summary.aggregateMetrics;
    const startY = doc.y;

    // Left column
    doc.fontSize(10)
       .fillColor('#374151')
       .text(`Total Questions: ${metrics.totalQuestions}`, 50, startY)
  .text(`Questions Answered: ${metrics.answeredQuestions}`, 50, startY + 15)
  .text(`Questions Skipped: ${metrics.skippedQuestions || 0}`, 50, startY + 30)
  .text(`Completion Rate: ${metrics.completionRate}%`, 50, startY + 45);

    // Right column
    doc.text(`Average Score: ${metrics.averageScore}/100`, 300, startY)
       .text(`Total Time: ${summary.sessionInfo.totalDuration} minutes`, 300, startY + 15)
       .text(`Avg. Response Time: ${metrics.averageResponseTime}s`, 300, startY + 30);

  doc.y = startY + 75;
  }

  addPerformanceMetrics(doc, summary) {
    this.addSectionTitle(doc, 'Performance Breakdown');

    const distribution = summary.aggregateMetrics.scoreDistribution;
    const startY = doc.y;

    // Score distribution
    doc.fontSize(10)
       .fillColor('#374151')
       .text('Score Distribution:', 50, startY);

    const barWidth = 100;
    const barHeight = 12;
    let yPos = startY + 20;

    // Excellent (85+)
    this.drawPerformanceBar(doc, 50, yPos, barWidth, barHeight, distribution.excellent, summary.aggregateMetrics.answeredQuestions, '#10b981', 'Excellent (85+)');
    yPos += 25;

    // Good (75-84)
    this.drawPerformanceBar(doc, 50, yPos, barWidth, barHeight, distribution.good, summary.aggregateMetrics.answeredQuestions, '#3b82f6', 'Good (75-84)');
    yPos += 25;

    // Average (60-74)
    this.drawPerformanceBar(doc, 50, yPos, barWidth, barHeight, distribution.average, summary.aggregateMetrics.answeredQuestions, '#f59e0b', 'Average (60-74)');
    yPos += 25;

    // Poor (<60)
    this.drawPerformanceBar(doc, 50, yPos, barWidth, barHeight, distribution.poor, summary.aggregateMetrics.answeredQuestions, '#ef4444', 'Needs Improvement (<60)');

    doc.y = yPos + 40;
  }

  addCategoryScores(doc, summary) {
    this.addSectionTitle(doc, 'Category Performance');

    const categories = summary.categoryScores.slice(0, 8); // Limit to top 8 categories
    const startY = doc.y;

    categories.forEach((category, index) => {
      const yPos = startY + (index * 20);
      
      // Category name
      doc.fontSize(10)
         .fillColor('#374151')
         .text(category.category, 50, yPos);

      // Score
      doc.text(`${category.averageScore}/100`, 200, yPos);

      // Performance indicator
      const color = this.getPerformanceColor(category.performance);
      doc.fillColor(color)
         .text(category.performance, 270, yPos);

      // Question count
      doc.fillColor('#6b7280')
         .text(`(${category.questionsCount} questions)`, 350, yPos);
    });

    doc.y = startY + (categories.length * 20) + 20;
  }

  addPerformanceHighlights(doc, summary) {
    this.addSectionTitle(doc, 'Performance Highlights');

    const highlights = summary.performanceHighlights;
    const startY = doc.y;

    // Best Answers
    if (highlights.bestAnswers.length > 0) {
      doc.fontSize(12)
         .fillColor('#10b981')
         .text('✓ Best Performing Answers:', 50, startY);

      highlights.bestAnswers.slice(0, 3).forEach((answer, index) => {
        const yPos = startY + 20 + (index * 35);
        doc.fontSize(9)
           .fillColor('#374151')
           .text(`${index + 1}. ${answer.question}`, 50, yPos)
           .fillColor('#10b981')
           .text(`Score: ${answer.score}/100`, 50, yPos + 12)
           .fillColor('#6b7280')
           .text(`Category: ${answer.category} | Time: ${answer.timeSpent}s`, 50, yPos + 24);
      });

      doc.y = startY + 20 + (highlights.bestAnswers.slice(0, 3).length * 35) + 10;
    }

    // Areas for Improvement
    if (highlights.worstAnswers.length > 0) {
      doc.fontSize(12)
         .fillColor('#ef4444')
         .text('⚠ Areas for Improvement:', 50, doc.y);

      highlights.worstAnswers.slice(0, 2).forEach((answer, index) => {
        const yPos = doc.y + 20 + (index * 35);
        doc.fontSize(9)
           .fillColor('#374151')
           .text(`${index + 1}. ${answer.question}`, 50, yPos)
           .fillColor('#ef4444')
           .text(`Score: ${answer.score}/100`, 50, yPos + 12)
           .fillColor('#6b7280')
           .text(`Category: ${answer.category} | Time: ${answer.timeSpent}s`, 50, yPos + 24);
      });

      doc.y = doc.y + 20 + (highlights.worstAnswers.slice(0, 2).length * 35) + 20;
    }
  }

  addTimeAnalysis(doc, summary) {
    this.addSectionTitle(doc, 'Time Analysis');

    const timeAnalysis = summary.timeAnalysis;
    const startY = doc.y;

    doc.fontSize(10)
       .fillColor('#374151')
       .text(`Total Session Time: ${timeAnalysis.totalTime} minutes`, 50, startY)
       .text(`Average Response Time: ${timeAnalysis.averageTime} seconds`, 50, startY + 15)
       .text(`Time Efficiency: ${timeAnalysis.timeEfficiency}`, 50, startY + 30);

    if (timeAnalysis.fastestAnswer) {
      doc.text('Fastest Response:', 300, startY)
         .fontSize(9)
         .fillColor('#6b7280')
         .text(`${timeAnalysis.fastestAnswer.time}s - Score: ${timeAnalysis.fastestAnswer.score}/100`, 300, startY + 12);
    }

    if (timeAnalysis.slowestAnswer) {
      doc.fontSize(10)
         .fillColor('#374151')
         .text('Slowest Response:', 300, startY + 30)
         .fontSize(9)
         .fillColor('#6b7280')
         .text(`${timeAnalysis.slowestAnswer.time}s - Score: ${timeAnalysis.slowestAnswer.score}/100`, 300, startY + 42);
    }

    doc.y = startY + 70;
  }

  addOverallAssessment(doc, summary) {
    this.addSectionTitle(doc, 'Overall Assessment');

    const assessment = summary.overallAssessment;
    const startY = doc.y;

    // Overall score - larger text
    doc.fontSize(18)
       .fillColor(this.getScoreColor(assessment.overallScore))
       .text(`Overall Score: ${assessment.overallScore}/100`, 50, startY);

    // Readiness level
    doc.fontSize(14)
       .fillColor(this.getPerformanceColor(assessment.readinessLevel))
       .text(`Readiness Level: ${assessment.readinessLevel.replace('-', ' ')}`, 50, startY + 30);

    // Session rating (stars)
    const stars = '★'.repeat(Math.floor(assessment.sessionRating)) + '☆'.repeat(5 - Math.floor(assessment.sessionRating));
    doc.fontSize(16)
       .fillColor('#f59e0b')
       .text(`Session Rating: ${stars} (${assessment.sessionRating}/5)`, 50, startY + 55);

    // Recommendation
    doc.fontSize(11)
       .fillColor('#374151')
       .text('Recommendation:', 50, startY + 85)
       .fontSize(10)
       .fillColor('#6b7280')
       .text(assessment.recommendation, 50, startY + 100, { width: 500, align: 'left' });

    doc.y = startY + 140;
  }

  addFooter(doc, summary) {
    const pageBottom = doc.page.height - 50;
    
    doc.fontSize(8)
       .fillColor('#9ca3af')
       .text(`Generated by MockMate on ${new Date(summary.generatedAt).toLocaleDateString()}`, 50, pageBottom - 20)
       .text('This report is confidential and intended for the candidate only.', 50, pageBottom - 10);
  }

  addSectionTitle(doc, title) {
    doc.fontSize(14)
       .fillColor('#1f2937')
       .text(title, 50, doc.y)
       .fontSize(10);
    
    doc.y += 25;
  }

  drawPerformanceBar(doc, x, y, width, height, value, total, color, label) {
    const percentage = total > 0 ? (value / total) : 0;
    const fillWidth = width * percentage;

    // Background bar
    doc.rect(x, y, width, height)
       .fillColor('#f3f4f6')
       .fill();

    // Fill bar
    if (fillWidth > 0) {
      doc.rect(x, y, fillWidth, height)
         .fillColor(color)
         .fill();
    }

    // Label
    doc.fillColor('#374151')
       .text(label, x + width + 10, y - 2);

    // Count
    doc.fillColor('#6b7280')
       .text(`${value}`, x + width + 120, y - 2);
  }

  getPerformanceColor(performance) {
    switch (performance) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'average': return '#f59e0b';
      case 'needs-improvement': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getScoreColor(score) {
    if (score >= 85) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }
}

module.exports = new PDFGenerationService();