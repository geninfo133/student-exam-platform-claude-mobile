import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';
const LABEL_CLS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

function StepCard({ step, title, subtitle, color = 'indigo', children }) {
  const gradients = {
    indigo: 'from-indigo-500 to-violet-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-fuchsia-600',
    emerald: 'from-emerald-500 to-teal-600',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradients[color]} px-5 py-4 flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{step}</span>
        </div>
        <div>
          <p className="font-semibold text-white text-sm">{title}</p>
          {subtitle && <p className="text-white/70 text-xs">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function GeneratePaper() {
  const [searchParams] = useSearchParams();
  const [method, setMethod] = useState(null);

  const [assignments, setAssignments] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const [paperFiles, setPaperFiles] = useState([]);
  const [existingPapers, setExistingPapers] = useState([]);
  const [selectedExistingPaperIds, setSelectedExistingPaperIds] = useState([]);
  const [paperForm, setPaperForm] = useState({ subject: '', instructions: '', total_marks: 50, num_mcq: 20, num_short: 5, num_long: 4 });
  const [instructionForm, setInstructionForm] = useState({ subject: '', chapter_ids: [], topics: '', total_marks: 50, num_mcq: 20, num_short: 5, num_long: 4 });

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const profileRes = await api.get('/api/auth/profile/');
        const role = profileRes.data.role;
        if (role === 'school') {
          const res = await api.get('/api/subjects/');
          const subs = res.data.results || res.data;
          setAssignments(subs.map(s => ({ subject: s.id, subject_name: s.name })));
        } else {
          const res = await api.get('/api/assignments/my/');
          setAssignments(res.data.results || res.data);
        }
      } catch { /* ignore */ } finally { setInitLoading(false); }
    };
    fetchAssignments();
  }, []);

  useEffect(() => {
    const preSelected = searchParams.get('papers');
    if (preSelected) {
      const ids = preSelected.split(',').map(Number).filter(Boolean);
      if (ids.length > 0) { setMethod('old_papers'); setSelectedExistingPaperIds(ids); }
    }
  }, [searchParams]);

  const subjects = assignments.map((a) => ({ id: a.subject, name: a.subject_name }));

  useEffect(() => {
    if (!paperForm.subject) { setExistingPapers([]); setSelectedExistingPaperIds([]); return; }
    api.get('/api/exams/papers/').then((res) => {
      const papers = (res.data.results || res.data).filter(p => String(p.subject) === String(paperForm.subject));
      setExistingPapers(papers);
      setSelectedExistingPaperIds([]);
    }).catch(() => {});
  }, [paperForm.subject]);

  useEffect(() => {
    if (!instructionForm.subject) { setChapters([]); setInstructionForm(prev => ({ ...prev, chapter_ids: [] })); return; }
    api.get('/api/chapters/', { params: { subject: instructionForm.subject } }).then(res => {
      setChapters(res.data.results || res.data);
      setInstructionForm(prev => ({ ...prev, chapter_ids: [] }));
    }).catch(() => {});
  }, [instructionForm.subject]);

  const handlePaperChange = e => setPaperForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleInstructionChange = e => setInstructionForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + paperFiles.length > 5) { setError('Maximum 5 papers allowed.'); return; }
    setPaperFiles(prev => [...prev, ...files].slice(0, 5));
    setError('');
  };
  const removeFile = idx => setPaperFiles(prev => prev.filter((_, i) => i !== idx));
  const toggleExistingPaper = id => setSelectedExistingPaperIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleChapter = id => setInstructionForm(prev => ({
    ...prev, chapter_ids: prev.chapter_ids.includes(id) ? prev.chapter_ids.filter(x => x !== id) : [...prev.chapter_ids, id],
  }));

  const calcMarks = (form) => (parseInt(form.num_mcq)||0)*1 + (parseInt(form.num_short)||0)*2 + (parseInt(form.num_long)||0)*5;

  const handlePaperSubmit = async (e) => {
    e.preventDefault();
    if (!paperForm.subject) { setError('Please select a subject.'); return; }
    if (paperFiles.length === 0 && selectedExistingPaperIds.length === 0) { setError('Please select or upload papers.'); return; }
    if (!paperForm.instructions.trim()) { setError('Please provide instructions.'); return; }
    setLoading(true); setError(''); setSuccess(''); setUploadProgress('');
    try {
      const paperIds = [...selectedExistingPaperIds];
      for (let i = 0; i < paperFiles.length; i++) {
        setUploadProgress(`Uploading paper ${i+1} of ${paperFiles.length}…`);
        const formData = new FormData();
        formData.append('title', paperFiles[i].name.replace('.pdf', ''));
        formData.append('subject', paperForm.subject);
        formData.append('total_marks', paperForm.total_marks);
        formData.append('file', paperFiles[i]);
        const res = await api.post('/api/exams/papers/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        paperIds.push(res.data.id);
      }
      setUploadProgress('Starting AI question generation…');
      await api.post('/api/exams/papers/create-from-papers/', {
        paper_ids: paperIds, instructions: paperForm.instructions,
        subject: parseInt(paperForm.subject), total_marks: parseInt(paperForm.total_marks),
        num_mcq: parseInt(paperForm.num_mcq), num_short: parseInt(paperForm.num_short), num_long: parseInt(paperForm.num_long),
      });
      setSuccess('Question generation started! AI is creating questions in the background. This usually takes 1-2 minutes. Check the question bank shortly.');
      setPaperFiles([]); setSelectedExistingPaperIds([]);
      setPaperForm({ subject: '', instructions: '', total_marks: 50, num_mcq: 20, num_short: 5, num_long: 4 });
      const fi = document.getElementById('paper-files-input'); if (fi) fi.value = '';
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to generate. Please try again.');
    } finally { setLoading(false); setUploadProgress(''); }
  };

  const handleInstructionSubmit = async (e) => {
    e.preventDefault();
    if (!instructionForm.subject) { setError('Please select a subject.'); return; }
    if (instructionForm.chapter_ids.length === 0) { setError('Please select at least one chapter.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/api/exams/generate-from-instructions/', {
        subject: parseInt(instructionForm.subject), chapter_ids: instructionForm.chapter_ids,
        topics: instructionForm.topics, total_marks: parseInt(instructionForm.total_marks),
        num_mcq: parseInt(instructionForm.num_mcq), num_short: parseInt(instructionForm.num_short), num_long: parseInt(instructionForm.num_long),
      });
      setSuccess('Question generation started! AI is creating questions in the background. This usually takes 1-2 minutes.');
      setInstructionForm({ subject: '', chapter_ids: [], topics: '', total_marks: 50, num_mcq: 20, num_short: 5, num_long: 4 });
      setChapters([]);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to generate. Please try again.');
    } finally { setLoading(false); }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const isIndigoPrimary = method !== 'instructions';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Teacher Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">Generate Questions</h1>
            <Link to="/teacher/papers-list"
              className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition shrink-0">
              View Papers
            </Link>
          </div>
          <p className="text-indigo-200 text-sm mb-6">Create AI-powered question papers for any subject</p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
              <p className="text-xl font-extrabold text-white">AI</p>
              <p className="text-white/50 text-xs">Powered</p>
            </div>
            <div className="bg-indigo-500/30 border border-indigo-400/40 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
              <p className="text-xl font-extrabold text-indigo-200">MCQ</p>
              <p className="text-white/50 text-xs">Question Type</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
              <p className="text-xl font-extrabold text-emerald-200">PDF</p>
              <p className="text-white/50 text-xs">Export Format</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Success */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-emerald-800 font-semibold text-sm mb-3">{success}</p>
                <div className="flex gap-3">
                  <Link to="/teacher/create-exam" className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all">
                    Create Exam Now
                  </Link>
                  <Link to="/teacher/papers" className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:border-indigo-300 transition-all">
                    View Papers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Method selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              key: 'old_papers',
              title: 'From Old Papers',
              sub: 'Upload previous papers, AI generates new one',
              desc: 'Upload up to 5 question papers (PDF). The AI will analyze them and generate new questions with similar style and difficulty.',
              gradient: 'from-indigo-500 to-violet-600',
              selected: method === 'old_papers',
              borderActive: 'border-indigo-500 ring-2 ring-indigo-200',
            },
            {
              key: 'instructions',
              title: 'From Instructions',
              sub: 'Specify chapters, topics, and marks',
              desc: 'Choose specific chapters and topics, set question distribution, and the AI will generate questions based on your instructions.',
              gradient: 'from-purple-500 to-fuchsia-600',
              selected: method === 'instructions',
              borderActive: 'border-purple-500 ring-2 ring-purple-200',
            },
          ].map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => { setMethod(m.key); setError(''); setSuccess(''); }}
              className={`text-left p-5 rounded-2xl border-2 transition-all bg-white ${m.selected ? m.borderActive : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {m.key === 'old_papers' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.sub}</p>
                </div>
                {m.selected && (
                  <svg className="w-5 h-5 text-indigo-600 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Form: From Old Papers */}
        {method === 'old_papers' && (
          <form onSubmit={handlePaperSubmit} className="space-y-4">
            <StepCard step="1" title="Select Subject" subtitle="Choose the subject for the paper" color="indigo">
              <select name="subject" value={paperForm.subject} onChange={handlePaperChange} required className={INPUT_CLS}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {subjects.length === 0 && <p className="text-xs text-gray-400 mt-2">No subjects assigned. Contact your school admin.</p>}
            </StepCard>

            <StepCard step="2" title="Select Papers" subtitle="Choose existing or upload new PDFs" color="blue">
              {paperForm.subject && existingPapers.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Previously Uploaded</p>
                  <div className="border-2 border-gray-100 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                    {existingPapers.map(paper => (
                      <label key={paper.id} className={`flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl transition ${selectedExistingPaperIds.includes(paper.id) ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-white border-2 border-transparent hover:border-gray-100'}`}>
                        <input type="checkbox" checked={selectedExistingPaperIds.includes(paper.id)} onChange={() => toggleExistingPaper(paper.id)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{paper.title}</p>
                          <p className="text-xs text-gray-400">{new Date(paper.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedExistingPaperIds.length > 0 && <p className="text-xs text-indigo-600 font-semibold mt-2">{selectedExistingPaperIds.length} selected</p>}
                </div>
              )}

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {existingPapers.length > 0 ? 'Or Upload New Papers' : 'Upload Papers'}
              </p>
              <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-indigo-400 transition cursor-pointer bg-gray-50">
                <svg className="mx-auto w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Click to upload PDF files</p>
                <p className="text-xs text-gray-400 mt-1">Up to 5 files</p>
                <input id="paper-files-input" type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
              </label>

              {paperFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {paperFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">({(file.size/1024/1024).toFixed(1)} MB)</span>
                      </div>
                      <button type="button" onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 transition flex-shrink-0 ml-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </StepCard>

            <StepCard step="3" title="Instructions" subtitle="Tell AI what kind of paper to create" color="purple">
              <textarea
                name="instructions" value={paperForm.instructions} onChange={handlePaperChange}
                rows={4} required className={`${INPUT_CLS} resize-none`}
                placeholder="e.g., Focus on Chapters 3 and 4. Include application-based questions. Mix easy and medium difficulty."
              />
            </StepCard>

            <StepCard step="4" title="Question Distribution" subtitle="Set marks and question counts" color="emerald">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[{ label: 'MCQs (1 mark)', name: 'num_mcq', val: paperForm.num_mcq },
                  { label: 'Short Ans (2 marks)', name: 'num_short', val: paperForm.num_short },
                  { label: 'Long Ans (5 marks)', name: 'num_long', val: paperForm.num_long }].map(f => (
                  <div key={f.name}>
                    <label className={LABEL_CLS}>{f.label}</label>
                    <input type="number" name={f.name} value={f.val} onChange={handlePaperChange} min="0" className={INPUT_CLS} />
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className={LABEL_CLS}>Total Marks</label>
                <input type="number" name="total_marks" value={paperForm.total_marks} onChange={handlePaperChange} min="1" required className={INPUT_CLS} />
              </div>
              <div className="bg-indigo-50 rounded-xl px-4 py-2.5 border border-indigo-100">
                <p className="text-sm font-semibold text-indigo-800">
                  {(parseInt(paperForm.num_mcq)||0) + (parseInt(paperForm.num_short)||0) + (parseInt(paperForm.num_long)||0)} questions · {calcMarks(paperForm)} marks
                </p>
              </div>
            </StepCard>

            {uploadProgress && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                <p className="text-blue-700 font-medium text-sm">{uploadProgress}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (paperFiles.length === 0 && selectedExistingPaperIds.length === 0)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating Questions…
                </span>
              ) : 'Upload & Generate Questions'}
            </button>
          </form>
        )}

        {/* Form: From Instructions */}
        {method === 'instructions' && (
          <form onSubmit={handleInstructionSubmit} className="space-y-4">
            <StepCard step="1" title="Select Subject" subtitle="Choose the subject for the paper" color="purple">
              <select name="subject" value={instructionForm.subject} onChange={handleInstructionChange} required className={INPUT_CLS}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {subjects.length === 0 && <p className="text-xs text-gray-400 mt-2">No subjects assigned. Contact your school admin.</p>}
            </StepCard>

            <StepCard step="2" title="Select Chapters" subtitle="Choose one or more chapters to include" color="indigo">
              {!instructionForm.subject ? (
                <p className="text-sm text-gray-400">Select a subject first</p>
              ) : chapters.length === 0 ? (
                <p className="text-sm text-gray-400">No chapters found for this subject</p>
              ) : (
                <div className="border-2 border-gray-100 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 bg-gray-50">
                  {chapters.map(ch => (
                    <label key={ch.id} className={`flex items-center gap-2 cursor-pointer px-3 py-2.5 rounded-xl transition ${instructionForm.chapter_ids.includes(ch.id) ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white border-2 border-transparent hover:border-gray-100'}`}>
                      <input type="checkbox" checked={instructionForm.chapter_ids.includes(ch.id)} onChange={() => toggleChapter(ch.id)} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700">{ch.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {instructionForm.chapter_ids.length > 0 && (
                <p className="text-xs text-purple-600 font-semibold mt-2">{instructionForm.chapter_ids.length} chapter(s) selected</p>
              )}
            </StepCard>

            <StepCard step="3" title="Topics & Focus Areas" subtitle="Describe specific topics or difficulty level" color="blue">
              <textarea
                name="topics" value={instructionForm.topics} onChange={handleInstructionChange}
                rows={4} className={`${INPUT_CLS} resize-none`}
                placeholder="e.g., Focus on quadratic equations. Include application-based problems. Mix easy and medium difficulty."
              />
            </StepCard>

            <StepCard step="4" title="Question Distribution" subtitle="Set marks and question counts" color="emerald">
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[{ label: 'MCQs (1 mark)', name: 'num_mcq', val: instructionForm.num_mcq },
                  { label: 'Short Ans (2 marks)', name: 'num_short', val: instructionForm.num_short },
                  { label: 'Long Ans (5 marks)', name: 'num_long', val: instructionForm.num_long }].map(f => (
                  <div key={f.name}>
                    <label className={LABEL_CLS}>{f.label}</label>
                    <input type="number" name={f.name} value={f.val} onChange={handleInstructionChange} min="0" className={INPUT_CLS} />
                  </div>
                ))}
              </div>
              <div className="mb-3">
                <label className={LABEL_CLS}>Total Marks</label>
                <input type="number" name="total_marks" value={instructionForm.total_marks} onChange={handleInstructionChange} min="1" required className={INPUT_CLS} />
              </div>
              <div className="bg-purple-50 rounded-xl px-4 py-2.5 border border-purple-100">
                <p className="text-sm font-semibold text-purple-800">
                  {(parseInt(instructionForm.num_mcq)||0) + (parseInt(instructionForm.num_short)||0) + (parseInt(instructionForm.num_long)||0)} questions · {calcMarks(instructionForm)} marks
                </p>
              </div>
            </StepCard>

            <button
              type="submit"
              disabled={loading || instructionForm.chapter_ids.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Generating Questions (may take a minute)…
                </span>
              ) : 'Generate Questions with AI'}
            </button>
          </form>
        )}

        {/* No method selected */}
        {!method && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7l4-4m0 0l4 4m-4-4v18" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Choose a method above to get started</p>
            <p className="text-gray-400 text-sm mt-1">Select how you want to generate the question paper</p>
          </div>
        )}
      </div>
    </div>
  );
}
