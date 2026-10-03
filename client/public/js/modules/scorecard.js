/**
 * Module: Interactive Diagnostic Scorecard & Study Plan
 */

class ScorecardModule {
  constructor() {
    this.container = document.getElementById('scorecard-workspace');
  }

  async render(sessionId) {
    this.container.style.display = 'block';
    this.container.innerHTML = `
      <div style="max-width:860px; margin:40px auto; text-align:center;">
        <h2 style="color:#1f2428;">Analyzing Exam Data with AI Diagnostic Engine...</h2>
        <p style="color:#586069; margin-top:8px;">Evaluating Task Achievement, Coherence, Lexical Resource, and Speaking fluency...</p>
        <div style="margin-top:20px;">
          <div class="recording-dot" style="margin:0 auto; width:20px; height:20px; background:#0366d6;"></div>
        </div>
      </div>
    `;

    try {
      const res = await window.apiClient.getScorecard(sessionId);
      if (!res.success || !res.report) {
        throw new Error('Scorecard data unavailable');
      }
      this.renderReport(res.report);
    } catch (err) {
      this.container.innerHTML = `
        <div style="max-width:600px; margin:50px auto; background:#fff; padding:30px; border-radius:8px; border:1px solid #d0d7de;">
          <h3 style="color:#d9383a;">Diagnostic Evaluation in Progress</h3>
          <p style="color:#586069; margin-top:8px;">The AI Diagnostic Engine is finishing evaluation on the host server. Please click refresh below.</p>
          <button class="nav-action-btn primary" style="margin-top:16px;" onclick="window.scorecardModuleInstance.render('${sessionId}')">
            Refresh Scorecard
          </button>
        </div>
      `;
    }
  }

  renderReport(rep) {
    const cand = rep.candidate || {};
    const scores = rep.moduleScores || {};
    const summary = rep.diagnosticSummary || {};

    this.container.innerHTML = `
      <div class="scorecard-container" style="margin-bottom:60px;">
        <!-- Top Toolbar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #e1e4e8; padding-bottom:14px;">
          <div style="font-size:0.85rem; color:#586069;">
            Session Ref: <strong>${rep.sessionId}</strong>
          </div>
          <div style="display:flex; gap:10px;">
            <a href="/report?session=${rep.sessionId}" target="_blank" class="admin-btn btn-primary" style="text-decoration:none;">
              🖨 Open Print-Ready A4 Scorecard
            </a>
          </div>
        </div>

        <!-- Official Header -->
        <div class="report-header">
          <div class="report-header-left">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="ielts-logo-badge" style="font-size:1.3rem;">IELTS</span>
              <span style="font-weight:700; color:#586069; font-size:0.9rem;">COMPUTER-DELIVERED</span>
            </div>
            <h1 style="margin-top:8px;">Diagnostic Performance Profile</h1>
            <p>Certified Mock Examination Assessment & Weakness Analysis</p>
          </div>

          <div class="report-header-right">
            <div class="report-badge-overall">
              <div class="overall-label">Overall Band</div>
              <div class="overall-val">${rep.overallBandScore.toFixed(1)}</div>
            </div>
            <div class="cefr-tag">${rep.cefrLevel}</div>
          </div>
        </div>

        <!-- Candidate Metadata Grid -->
        <div class="candidate-meta-grid">
          <div>
            <div class="meta-field-label">Candidate Name</div>
            <div class="meta-field-val">${cand.name || 'Candidate'}</div>
          </div>
          <div>
            <div class="meta-field-label">Passport / NID</div>
            <div class="meta-field-val">${cand.passport || 'N/A'}</div>
          </div>
          <div>
            <div class="meta-field-label">Exam Type</div>
            <div class="meta-field-val">${cand.examType || 'Academic'}</div>
          </div>
          <div>
            <div class="meta-field-label">Target vs Achieved</div>
            <div class="meta-field-val">${cand.targetBand || 7.0} → <span style="color:${rep.overallBandScore >= (cand.targetBand || 7.0) ? '#28a745' : '#d9383a'}">${rep.overallBandScore.toFixed(1)}</span></div>
          </div>
        </div>

        <!-- 4-Module Score Grid -->
        <div class="module-scores-grid">
          <div class="module-score-card listening">
            <div class="module-title-h4">Listening</div>
            <div class="module-band-val">${scores.listening ? scores.listening.band.toFixed(1) : '-'}</div>
            <div class="module-sub-stat">${scores.listening ? scores.listening.raw : 0}/40 Correct (${scores.listening ? scores.listening.accuracy : 0}%)</div>
          </div>

          <div class="module-score-card reading">
            <div class="module-title-h4">Reading</div>
            <div class="module-band-val">${scores.reading ? scores.reading.band.toFixed(1) : '-'}</div>
            <div class="module-sub-stat">${scores.reading ? scores.reading.raw : 0}/40 Correct (${scores.reading ? scores.reading.accuracy : 0}%)</div>
          </div>

          <div class="module-score-card writing">
            <div class="module-title-h4">Writing</div>
            <div class="module-band-val">${scores.writing ? scores.writing.band.toFixed(1) : '-'}</div>
            <div class="module-sub-stat">TA: ${scores.writing && scores.writing.subScores ? scores.writing.subScores.taskAchievement : '-'} | CC: ${scores.writing && scores.writing.subScores ? scores.writing.subScores.coherenceCohesion : '-'}</div>
          </div>

          <div class="module-score-card speaking">
            <div class="module-title-h4">Speaking</div>
            <div class="module-band-val">${scores.speaking ? scores.speaking.band.toFixed(1) : '-'}</div>
            <div class="module-sub-stat">FC: ${scores.speaking && scores.speaking.subScores ? scores.speaking.subScores.fluencyCoherence : '-'} | LR: ${scores.speaking && scores.speaking.subScores ? scores.speaking.subScores.lexicalResource : '-'}</div>
          </div>
        </div>

        <!-- Standout Strengths -->
        <h3 class="section-heading-h3">Key Candidate Strengths</h3>
        <div class="diagnostic-box" style="border-color:#a8f5a2; background:#f4fcf4;">
          <ul>
            ${(summary.standoutStrengths || []).map(s => `<li><strong>Strength:</strong> ${s}</li>`).join('')}
          </ul>
        </div>

        <!-- Critical Weaknesses -->
        <h3 class="section-heading-h3">Identified Weaknesses & Errors</h3>
        <div class="diagnostic-box danger">
          <ul>
            ${(summary.criticalWeaknesses || []).map(w => `<li><strong>Area for Improvement:</strong> ${w}</li>`).join('')}
          </ul>
        </div>

        <!-- Prescriptive Recommendations -->
        <h3 class="section-heading-h3">High-Yield Prescriptions</h3>
        <div class="diagnostic-box">
          <ul>
            ${(summary.highYieldPrescriptions || []).map(p => `<li><strong>Prescription:</strong> ${p}</li>`).join('')}
          </ul>
        </div>

        <!-- Vocabulary Upgrades (if any) -->
        ${rep.writingEvaluation && rep.writingEvaluation.suggestedUpgrades && rep.writingEvaluation.suggestedUpgrades.length > 0 ? `
          <h3 class="section-heading-h3">Targeted Lexical Upgrades</h3>
          <table class="vocab-table">
            <thead>
              <tr>
                <th>Current Word / Usage</th>
                <th>C1/C2 Recommended Alternatives</th>
                <th>Diagnostic Impact</th>
              </tr>
            </thead>
            <tbody>
              ${rep.writingEvaluation.suggestedUpgrades.map(u => `
                <tr>
                  <td><code>${u.current}</code></td>
                  <td><strong>${u.recommended.join(', ')}</strong></td>
                  <td><span style="color:#0969da; font-weight:600;">${u.impact}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- 14-Day Study Plan -->
        <h3 class="section-heading-h3" style="margin-top:24px;">Personalized 14-Day Prescription Plan</h3>
        <table class="study-plan-table">
          <thead>
            <tr>
              <th style="width:120px;">Timeline</th>
              <th style="width:200px;">Targeted Skill</th>
              <th>Prescribed Study Action</th>
            </tr>
          </thead>
          <tbody>
            ${(summary.studyPlan || []).map(item => `
              <tr>
                <td><strong>${item.dayRange}</strong></td>
                <td><span style="color:#d9383a; font-weight:600;">${item.focus}</span></td>
                <td>${item.action}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

window.ScorecardModule = ScorecardModule;
