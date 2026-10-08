import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dvggOmxQl7wmhpIrkzbrLw_9Zp-Dm57';
const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" };

async function sbGet(path) { try { const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: HEADERS }); if (!r.ok) return []; return await r.json(); } catch { return []; } }
async function sbPost(path, body) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "POST", headers: {...HEADERS, Prefer: "return=representation" }, body: JSON.stringify(body) }); if (!r.ok) { const t = await r.text(); return { error: t }; } return { data: await r.json() }; }
async function sbPatch(path, body) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "PATCH", headers: HEADERS, body: JSON.stringify(body) }); return r.ok; }
async function sbDelete(path) { const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { method: "DELETE", headers: HEADERS }); return r.ok; }

export default function AddQuestion({ schoolCode, onBack }) {
  const REAL_CODE = schoolCode; // DYNAMIC - No hardcode

  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [loginMsg, setLoginMsg] = useState('');
  const [classes, setClasses] = useState([]); const [subjects, setSubjects] = useState([]);
  const [classId, setClassId] = useState(''); const [subject, setSubject] = useState('');
  const [lessonNo, setLessonNo] = useState(''); const [qType, setQType] = useState('MCQ');
  const [qText, setQText] = useState(''); const [correctAns, setCorrectAns] = useState('');
  const [opt1, setOpt1] = useState(''); const [opt2, setOpt2] = useState(''); const [opt3, setOpt3] = useState(''); const [opt4, setOpt4] = useState('');
  const [saveMsg, setSaveMsg] = useState(''); const [editId, setEditId] = useState(null);

  useEffect(() => { const eid = new URLSearchParams(window.location.search).get('editId'); if (eid) setEditId(eid); }, []);
  useEffect(() => { if (currentUser) loadDropdowns(); }, [currentUser]);

  const doLogin = async () => {
    if (!username ||!password) { setLoginMsg("Enter username & password"); return; }
    setLoginMsg("Checking...");
    const data = await sbGet(`users?school_code=eq.${REAL_CODE}&username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}&select=*`);
    if (!data.length) { setLoginMsg(`Failed for ${REAL_CODE} - CASE SENSITIVE`); return; }
    setCurrentUser(data[0]); setLoginMsg("");
  };

  async function loadDropdowns() {
    let cls = await sbGet(`classes?school_code=eq.${REAL_CODE}&select=id,class_name&order=id`);
    const isAdmin = String(currentUser.usertype || '').toLowerCase() === 'admin';
    const assigned = String(currentUser.assigned_class || '').trim();
    if (!isAdmin && assigned && assigned.toLowerCase()!== 'all') {
      const filtered = cls.filter(c => String(c.class_name).trim().toLowerCase() === assigned.toLowerCase() || String(c.id).trim().toLowerCase() === assigned.toLowerCase());
      if (filtered.length > 0) cls = filtered;
    }
    setClasses(cls); if (cls.length === 1) setClassId(cls[0].id);
    const subs = await sbGet(`academy_subjects?school_code=eq.${REAL_CODE}&select=subject_display_name&order=subject_display_name`);
    setSubjects(subs);
    if (editId) {
      const q = await sbGet(`question_bank?school_code=eq.${REAL_CODE}&id=eq.${editId}&select=*`);
      if (q.length) { const row = q[0]; setClassId(row.class_id || ''); setSubject(row.subject || ''); setLessonNo(row.lesson_no || ''); setQType(row.question_type || 'MCQ'); setQText(row.question_text || ''); setCorrectAns(row.correct_answer || ''); setOpt1(row.opt1 || ''); setOpt2(row.opt2 || ''); setOpt3(row.opt3 || ''); setOpt4(row.opt4 || ''); }
    }
  }

  async function getNextId() { const d = await sbGet(`question_bank?school_code=eq.${REAL_CODE}&select=id&order=id.desc&limit=1`); return d.length? d[0].id + 1 : 1; }

  const handleSave = async () => {
    if (!qText.trim() ||!classId ||!subject ||!lessonNo) { alert("Fill Class, Subject, Lesson, Question"); return; }
    setSaveMsg("Saving...");
    if (editId) {
      const ok = await sbPatch(`question_bank?school_code=eq.${REAL_CODE}&id=eq.${editId}`, { class_id: parseInt(classId), subject, lesson_no: parseInt(lessonNo), question_type: qType, question_text: qText, correct_answer: correctAns, opt1, opt2, opt3, opt4 });
      setSaveMsg(ok? "✅ Updated!" : "❌ Failed");
    } else {
      const nid = await getNextId();
      const res = await sbPost(`question_bank`, { id: nid, school_code: REAL_CODE, class_id: parseInt(classId), subject, lesson_no: parseInt(lessonNo), question_type: qType, question_text: qText, correct_answer: correctAns, opt1, opt2, opt3, opt4 });
      if (res.error) setSaveMsg("❌ " + res.error); else { setSaveMsg("✅ Saved ID " + nid + " for " + REAL_CODE); setQText(''); setCorrectAns(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); }
    }
  };

  const handleExcel = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!classId ||!subject ||!lessonNo) { alert("Select Class, Subject, Lesson first!"); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = new Uint8Array(ev.target.result); const wb = XLSX.read(data, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setSaveMsg("Uploading " + rows.length + "...");
      let nid = await getNextId();
      const payload = rows.map(r => ({ id: nid++, school_code: REAL_CODE, class_id: parseInt(classId), subject, lesson_no: parseInt(lessonNo), question_type: r.question_type || r.type || 'MCQ', question_text: r.question_text || r.question || '', opt1: r.opt1 || '', opt2: r.opt2 || '', opt3: r.opt3 || '', opt4: r.opt4 || '', correct_answer: r.correct_answer || r.answer || '' }));
      const res = await sbPost(`question_bank`, payload);
      setSaveMsg(res.error? "❌ " + res.error : `✅ Imported ${payload.length} to ${REAL_CODE}!`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteUnit = async () => {
    if (!classId ||!subject ||!lessonNo) { alert("Select Class, Subject, Lesson"); return; }
    if (!confirm(`Delete all for ${REAL_CODE} Class ${classId}, ${subject}, Lesson ${lessonNo}?`)) return;
    const ok = await sbDelete(`question_bank?school_code=eq.${REAL_CODE}&class_id=eq.${classId}&subject=eq.${encodeURIComponent(subject)}&lesson_no=eq.${lessonNo}`);
    alert(ok? "Deleted!" : "Failed");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-[380px]">
          <h2 className="text-center font-black">Q-BANK LOGIN</h2>
          <p className="text-center text-xs bg-blue-100 py-1 rounded-full font-bold mt-2 text-[#0f4c81]">{REAL_CODE}</p>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username - Case Sensitive" className="w-full mt-4 p-3 border rounded-lg text-sm" />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className="w-full mt-2 p-3 border rounded-lg text-sm" />
          <button onClick={doLogin} className="w-full mt-3 bg-[#ea580c] text-white py-3 rounded-lg font-bold">LOGIN to {REAL_CODE}</button>
          <p className="text-red-500 text-xs text-center mt-2">{loginMsg}</p>
          <button onClick={onBack} className="w-full mt-3 text-sm font-bold">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-3">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white rounded-xl p-4 shadow flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm">Q-Bank [{REAL_CODE}] {editId? `Edit ${editId}` : 'Add'}</h2>
          <div className="flex gap-2 text-sm items-center"><span>Hi <b>{currentUser.username}</b> <span className="bg-[#102a43] text-white px-2 py-1 rounded-full text-[11px]">{currentUser.assigned_class || currentUser.usertype}</span></span><button onClick={onBack} className="font-bold text-[#0f4c81]">← Dashboard</button></div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow">
          <div className="grid md:grid-cols-4 gap-3 bg-[#f8fafc] p-3 rounded-lg border mb-4">
            <div><label className="text-xs font-bold">Class</label><select value={classId} onChange={e => setClassId(e.target.value)} disabled={classes.length === 1} className="w-full mt-1 p-2 border rounded text-sm" style={{background: classes.length===1?'#e2e8f0':'white'}}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
            <div><label className="text-xs font-bold">Subject</label><select value={subject} onChange={e => setSubject(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm"><option value="">Select Subject</option>{subjects.map(s => <option key={s.subject_display_name} value={s.subject_display_name}>{s.subject_display_name}</option>)}</select></div>
            <div><label className="text-xs font-bold">Lesson No</label><input type="number" value={lessonNo} onChange={e => setLessonNo(e.target.value)} placeholder="1" className="w-full mt-1 p-2 border rounded text-sm" /></div>
            <div><label className="text-xs font-bold">Type</label><select value={qType} onChange={e => setQType(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm"><option>MCQ</option><option>Short</option><option>Long</option><option>FillBlank</option><option>TrueFalse</option></select></div>
            <div className="md:col-span-4 text-right"><button onClick={handleDeleteUnit} className="bg-[#dc3545] text-white text-[11px] px-3 py-1.5 rounded font-bold">🗑️ Delete All for Unit</button></div>
          </div>

          <div className="border border-dashed p-3 rounded-lg bg-[#f8fafc] mb-4"><label className="font-bold text-xs">🧩 Bulk Excel for {REAL_CODE}</label><input type="file" accept=".xlsx,.xls" onChange={handleExcel} className="w-full mt-2 text-sm" /></div>

          <div className="grid md:grid-cols-2 gap-6">
            <div><label className="text-xs font-bold">Question Text</label><textarea value={qText} onChange={e => setQText(e.target.value)} rows={5} className="w-full mt-1 p-2 border rounded text-sm"></textarea><label className="text-xs font-bold mt-3 block">Correct Answer</label><input value={correctAns} onChange={e => setCorrectAns(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm" /></div>
            {qType === 'MCQ' && (<div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold">Opt1</label><input value={opt1} onChange={e => setOpt1(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm" /></div><div><label className="text-xs font-bold">Opt2</label><input value={opt2} onChange={e => setOpt2(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm" /></div><div><label className="text-xs font-bold">Opt3</label><input value={opt3} onChange={e => setOpt3(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm" /></div><div><label className="text-xs font-bold">Opt4</label><input value={opt4} onChange={e => setOpt4(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm" /></div></div>)}
          </div>

          <button onClick={handleSave} className="w-full mt-6 bg-[#003049] text-white py-3 rounded-lg font-bold">💾 Save to {REAL_CODE} {editId? '(Update)' : ''}</button>
          <p className="text-center text-xs mt-3 font-bold text-green-600">{saveMsg}</p>
        </div>
      </div>
    </div>
  );
}