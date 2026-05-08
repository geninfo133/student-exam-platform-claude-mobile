export const GRADES = [
  { min: 90, label: 'A+', bg: '#d1fae5', color: '#065f46' },
  { min: 75, label: 'A',  bg: '#dbeafe', color: '#1e40af' },
  { min: 60, label: 'B',  bg: '#ede9fe', color: '#5b21b6' },
  { min: 50, label: 'C',  bg: '#fef3c7', color: '#92400e' },
  { min: 35, label: 'D',  bg: '#ffedd5', color: '#9a3412' },
  { min: 0,  label: 'F',  bg: '#fee2e2', color: '#dc2626' },
];

export function getGrade(pct) {
  for (const g of GRADES) if (pct >= g.min) return g;
  return GRADES[GRADES.length - 1];
}

export function pctColor(p) {
  if (p == null) return '#64748b';
  return p >= 60 ? '#10b981' : p >= 35 ? '#f59e0b' : '#dc2626';
}

export function studentName(s) {
  return s?.full_name || `${s?.first_name || ''} ${s?.last_name || ''}`.trim() || s?.username || '—';
}

export function deriveHWAnalysis(questions, pct) {
  if (!questions || questions.length === 0) return null;
  const fullQ    = questions.filter(q => (q.marks_awarded ?? 0) >= (q.max_marks ?? 1));
  const partialQ = questions.filter(q => (q.marks_awarded ?? 0) > 0 && (q.marks_awarded ?? 0) < (q.max_marks ?? 1));
  const zeroQ    = questions.filter(q => (q.marks_awarded ?? 0) === 0);

  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (fullQ.length > 0) strengths.push(`Scored full marks on ${fullQ.length} of ${questions.length} questions.`);
  if (pct >= 75) strengths.push('Strong overall understanding of the subject demonstrated.');
  else if (pct >= 50) strengths.push('Good grasp of core concepts with room for improvement.');
  if (partialQ.length > 0) strengths.push(`${partialQ.length} answers earned partial credit — on the right track.`);

  if (zeroQ.length > 0) {
    weaknesses.push(`${zeroQ.length} question${zeroQ.length > 1 ? 's' : ''} scored zero — needs focused revision.`);
    const topics = zeroQ.slice(0, 2).map(q => q.question_text?.slice(0, 40)).filter(Boolean);
    if (topics.length > 0) weaknesses.push(`Weak areas: "${topics.join('", "')}…"`);
  }
  if (partialQ.length > 0) weaknesses.push(`${partialQ.length} incomplete answer${partialQ.length > 1 ? 's' : ''} — key points missing.`);
  if (pct < 50) weaknesses.push('Overall score below passing — comprehensive revision recommended.');

  if (zeroQ.length > 0) recommendations.push('Re-study zero-mark topics and practice similar questions.');
  if (partialQ.length > 0) recommendations.push('Write complete structured answers with all required key points.');
  recommendations.push('Review AI feedback per question to understand expected responses.');
  if (pct < 75) recommendations.push('Practice timed writing to improve answer completeness.');

  return { strengths, weaknesses, recommendations };
}

export function deriveOnlineAnalysis(answers, pct) {
  if (!answers || answers.length === 0) return null;
  const correctQ = answers.filter(a => a.is_correct);
  const partialQ = answers.filter(a => !a.is_correct && a.marks_obtained > 0);
  const wrongQ   = answers.filter(a => !a.is_correct && a.marks_obtained === 0);

  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (correctQ.length > 0) strengths.push(`Answered ${correctQ.length} of ${answers.length} questions correctly.`);
  if (pct >= 75) strengths.push('Strong overall performance — solid command of the subject.');
  else if (pct >= 50) strengths.push('Good grasp of core concepts with room for improvement.');
  if (partialQ.length > 0) strengths.push(`${partialQ.length} answer${partialQ.length > 1 ? 's' : ''} earned partial credit — on the right track.`);

  if (wrongQ.length > 0) {
    weaknesses.push(`${wrongQ.length} question${wrongQ.length > 1 ? 's' : ''} answered incorrectly — needs focused revision.`);
    const topics = wrongQ.slice(0, 2).map(a => a.question?.question_text?.slice(0, 40)).filter(Boolean);
    if (topics.length > 0) weaknesses.push(`Missed topics include: "${topics.join('", "')}…"`);
  }
  if (partialQ.length > 0) weaknesses.push(`${partialQ.length} incomplete answer${partialQ.length > 1 ? 's' : ''} — key points were missing.`);
  if (pct < 50) weaknesses.push('Overall score below passing threshold — comprehensive review recommended.');

  if (wrongQ.length > 0) recommendations.push('Re-study incorrect topics and attempt similar practice questions.');
  if (partialQ.length > 0) recommendations.push('Review model answers for partially correct questions.');
  recommendations.push('Check feedback per question to understand where marks were lost.');
  if (pct < 75) recommendations.push('Timed practice sessions can help improve speed and accuracy.');

  return { strengths, weaknesses, recommendations };
}

export function deriveProgressAnalysis(progress, grand) {
  if (!progress || !grand) return null;
  const pct = Math.round(grand.percentage);
  const online      = progress.online      || [];
  const handwritten = progress.handwritten || [];
  const allSubjects = progress.subjects    || [];

  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (pct >= 75) strengths.push(`Overall average of ${pct}% — excellent academic performance.`);
  else if (pct >= 60) strengths.push(`Overall average of ${pct}% — solid performance across subjects.`);
  else if (pct >= 50) strengths.push(`Overall average of ${pct}% — passing standard achieved.`);

  const bestSubject = [...allSubjects].sort((a, b) => b.percentage - a.percentage)[0];
  if (bestSubject) strengths.push(`Strongest subject: ${bestSubject.subject_name} at ${Math.round(bestSubject.percentage)}%.`);

  if (online.length > 0 && handwritten.length > 0) {
    const onlineAvg = online.reduce((a, s) => a + s.percentage, 0) / online.length;
    const hwAvg     = handwritten.reduce((a, s) => a + s.percentage, 0) / handwritten.length;
    if (onlineAvg > hwAvg + 10) strengths.push(`Online exams avg (${Math.round(onlineAvg)}%) significantly better than handwritten (${Math.round(hwAvg)}%).`);
    else if (hwAvg > onlineAvg + 10) strengths.push(`Handwritten exams avg (${Math.round(hwAvg)}%) significantly better than online (${Math.round(onlineAvg)}%).`);
  }

  const weakSubjects = allSubjects.filter(s => s.percentage < 50).sort((a, b) => a.percentage - b.percentage);
  if (weakSubjects.length > 0) weaknesses.push(`${weakSubjects.length} subject${weakSubjects.length > 1 ? 's' : ''} below passing: ${weakSubjects.map(s => s.subject_name).join(', ')}.`);
  if (pct < 50) weaknesses.push('Overall average below passing — urgent attention needed across subjects.');
  else if (pct < 60) weaknesses.push('Overall average below 60% — consistent revision required to improve grades.');

  if (weakSubjects.length > 0) recommendations.push(`Focus extra study time on: ${weakSubjects.slice(0, 2).map(s => s.subject_name).join(' and ')}.`);
  if (pct < 75) recommendations.push('Review previous exam papers and practise regularly in weak areas.');
  recommendations.push('Track progress over time by comparing results across different periods.');
  if (online.length > 0 && handwritten.length > 0) {
    const onlineAvg = online.reduce((a, s) => a + s.percentage, 0) / online.length;
    const hwAvg     = handwritten.reduce((a, s) => a + s.percentage, 0) / handwritten.length;
    if (Math.abs(onlineAvg - hwAvg) > 10) recommendations.push('The gap between online and handwritten scores suggests one exam format needs more practice.');
  }

  return { strengths, weaknesses, recommendations };
}
