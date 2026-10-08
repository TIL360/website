import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dvggOmxQl7wmhpIrkzbrLw_9Zp-Dm57';
const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" };

async function sbGet(path){ try{ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:HEADERS}); return r.ok? await r.json():[]; }catch{ return []; } }
async function sbPost(path,body){ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method:"POST",headers:{...HEADERS, Prefer:"return=representation"},body:JSON.stringify(body)}); if(!r.ok){ const t=await r.text(); return {error:t}; } return {data:await r.json()}; }
async function sbDelete(path){ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method:"DELETE",headers:HEADERS}); return r.ok; }

export default function BuildPaper({ schoolCode, onBack }) {
  const REAL_CODE = schoolCode || localStorage.getItem('school_code');
  const [user,setUser]=useState(null); const [uName,setUName]=useState(''); const [uPass,setUPass]=useState(''); const [loginMsg,setLoginMsg]=useState('');
  const [exams,setExams]=useState([]); const [classes,setClasses]=useState([]); const [subjects,setSubjects]=useState([]);
  const [examType,setExamType]=useState(''); const [filterClass,setFilterClass]=useState(''); const [subject,setSubject]=useState('');
  const [lessonNo,setLessonNo]=useState(''); const [qType,setQType]=useState('All'); const [search,setSearch]=useState('');
  const [questions,setQuestions]=useState([]); const [cached,setCached]=useState([]); const [selected,setSelected]=useState(new Set());
  const [msg,setMsg]=useState('');

  const login=async()=>{
    if(!uName.trim()||!uPass.trim()){ setLoginMsg("Enter username & password"); return; }
    setLoginMsg("Checking...");
    const data=await sbGet(`users?school_code=eq.${REAL_CODE}&username=eq.${encodeURIComponent(uName.trim())}&password=eq.${encodeURIComponent(uPass.trim())}&select=*`);
    if(!data.length){ setLoginMsg(`Failed - '${uName}' CASE SENSITIVE for ${REAL_CODE}`); return; }
    setUser(data[0]); setLoginMsg(""); loadAll(data[0]);
  };

  const loadAll=async(cUser)=>{
    const userObj=cUser||user;
    const ex=await sbGet(`exams?school_code=eq.${REAL_CODE}&select=exam_name&order=exam_id.desc`); setExams(ex);
    let cls=await sbGet(`classes?school_code=eq.${REAL_CODE}&select=id,class_name&order=id`);
    const isAdmin=String(userObj.usertype||'').toLowerCase()==='admin';
    const assigned=String(userObj.assigned_class||'').trim();
    if(!isAdmin && assigned && assigned.toLowerCase()!=='all'){
      const f=cls.filter(c=> String(c.class_name).trim().toLowerCase()===assigned.toLowerCase() || String(c.id).trim().toLowerCase()===assigned.toLowerCase());
      if(f.length>0) cls=f;
    }
    setClasses(cls); if(cls.length===1) setFilterClass(String(cls[0].id));
    const subs=await sbGet(`academy_subjects?school_code=eq.${REAL_CODE}&select=subject_code,subject_display_name&order=subject_display_name`); setSubjects(subs);
  };

  useEffect(()=>{ const s=sessionStorage.getItem('paper_teacher'); if(s){ try{ const u=JSON.parse(s); setUser(u); loadAll(u);}catch{} } },[]);

  const loadQuestions=async()=>{
    if(!examType||!filterClass||!subject){ setMsg("Pick Exam, Class, Subject first!"); return; }
    setMsg("Loading..."); setSearch('');
    let path=`question_bank?school_code=eq.${REAL_CODE}&class_id=eq.${filterClass}&subject=eq.${encodeURIComponent(subject)}&select=*&order=id.desc`;
    if(lessonNo) path+=`&lesson_no=eq.${lessonNo}`;
    let qs=await sbGet(path);
    if(qType!=='All') qs=qs.filter(q=>q.question_type===qType);
    setCached(qs); setQuestions(qs); setSelected(new Set()); setMsg(qs.length?`Found ${qs.length} questions`:`No questions`);
  };

  const filterPool=()=>{
    if(!search.trim()){ setQuestions(cached); return; }
    const q=search.toLowerCase(); setQuestions(cached.filter(x=> x.question_text && x.question_text.toLowerCase().includes(q)));
  };

  const toggleSelect=(id)=>{
    const ns=new Set(selected); if(ns.has(id)) ns.delete(id); else ns.add(id); setSelected(ns);
  };

  async function getNextId(table){ const d=await sbGet(`${table}?school_code=eq.${REAL_CODE}&select=id&order=id.desc&limit=1`); return d.length? d[0].id+1 : 1; }

  const addToPaper=async(qId, marksEl)=>{
    if(!examType){ setMsg("Select Exam Target first"); return; }
    const marks=parseFloat(document.getElementById(`marks-${qId}`)?.value)||2;
    const nid=await getNextId('paper_questions');
    const payload={ id:nid, school_code:REAL_CODE, exam_type:examType, class_id:parseInt(filterClass)||8, subject, question_id:qId, marks };
    const res=await sbPost(`paper_questions`,payload);
    setMsg(res.error?`❌ ${res.error}`:`✅ Added Q${qId} to ${examType}`);
  };

  const addBulk=async()=>{
    if(!examType||selected.size===0) return;
    let c=0; for(let qId of selected){ const marks=parseFloat(document.getElementById(`marks-${qId}`)?.value)||2; const nid=await getNextId('paper_questions'); const res=await sbPost(`paper_questions`,{id:nid,school_code:REAL_CODE,exam_type:examType,class_id:parseInt(filterClass)||8,subject,question_id:qId,marks}); if(!res.error) c++; }
    setMsg(`✅ Added ${c} questions to ${examType}`); setSelected(new Set());
  };

  const delQ=async(id)=>{ if(!confirm("Delete question permanently?")) return; const ok=await sbDelete(`question_bank?school_code=eq.${REAL_CODE}&id=eq.${id}`); if(ok){ setQuestions(questions.filter(q=>q.id!==id)); setCached(cached.filter(q=>q.id!==id)); setMsg("Deleted"); } };

  if(!user){
    return (
      <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-6 w-full max-w-[380px]">
          <h2 className="text-center font-black text-[#102a43]">PAPER BUILDER LOGIN</h2><p className="text-center text-xs bg-blue-100 py-1 rounded-full font-bold mt-2">{REAL_CODE}</p>
          <input value={uName} onChange={e=>setUName(e.target.value)} placeholder="Username - Case Sensitive" className="w-full mt-4 p-3 border rounded-lg text-sm"/>
          <input type="password" value={uPass} onChange={e=>setUPass(e.target.value)} placeholder="Password" className="w-full mt-2 p-3 border rounded-lg text-sm"/>
          <button onClick={login} className="w-full mt-3 bg-[#ea580c] text-white py-3 rounded-lg font-bold">LOGIN</button>
          <p className="text-red-500 text-xs text-center mt-2">{loginMsg}</p>
          <button onClick={onBack} className="w-full mt-3 text-xs font-bold">← Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-3">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white rounded-xl p-4 shadow flex justify-between items-center mb-4">
          <h2 className="font-bold text-sm">Exam Paper Builder [ONLINE] - {user.username} <span className="bg-[#102a43] text-white px-2 py-1 rounded-full text-[10px] ml-2">{user.assigned_class||user.usertype}</span></h2>
          <div className="flex gap-2"><button onClick={onBack} className="bg-[#f8fafc] border px-3 py-1 rounded text-xs font-bold">⬅️ Dashboard</button><button onClick={()=>{setUser(null); sessionStorage.clear();}} className="text-red-600 text-xs font-bold">Logout</button></div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-bold text-sm border-b pb-2 mb-3">2. Build Exam Paper Layout - {REAL_CODE}</h3>
          <div className="grid md:grid-cols-6 gap-3 bg-[#f8fafc] p-3 rounded-lg border">
            <div><label className="text-[11px] font-bold">Exam Target</label><select value={examType} onChange={e=>setExamType(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm"><option value="">-- Select Exam --</option>{exams.map(e=><option key={e.exam_name} value={e.exam_name}>{e.exam_name}</option>)}</select></div>
            <div><label className="text-[11px] font-bold">Class ({user.assigned_class||'All'})</label><select value={filterClass} onChange={e=>setFilterClass(e.target.value)} disabled={classes.length===1} className="w-full mt-1 p-2 border rounded text-sm" style={{background:classes.length===1?'#e2e8f0':'white'}}><option value="">Select Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
            <div><label className="text-[11px] font-bold">Subject</label><select value={subject} onChange={e=>setSubject(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm"><option value="">Select Subject</option>{subjects.map(s=><option key={s.subject_code} value={s.subject_display_name}>{s.subject_display_name}</option>)}</select></div>
            <div><label className="text-[11px] font-bold">Lesson No</label><input type="number" value={lessonNo} onChange={e=>setLessonNo(e.target.value)} placeholder="All" className="w-full mt-1 p-2 border rounded text-sm"/></div>
            <div><label className="text-[11px] font-bold">Q Type</label><select value={qType} onChange={e=>setQType(e.target.value)} className="w-full mt-1 p-2 border rounded text-sm"><option value="All">All Types</option><option value="MCQ">MCQ</option><option value="FillBlank">FillBlank</option><option value="TrueFalse">TrueFalse</option><option value="Short">Short</option><option value="Long">Long</option></select></div>
            <button onClick={loadQuestions} className="bg-[#bd081c] text-white rounded-lg font-bold text-xs h-[38px] self-end">🔍 Load</button>
          </div>

          <div className="mt-4 flex gap-3 items-center">
            <input value={search} onChange={e=>{setSearch(e.target.value); setTimeout(filterPool,0)}} placeholder="Search question..." className="flex-1 p-2 border rounded text-sm"/>
            {selected.size>0 && <div className="flex gap-2 items-center bg-green-50 border border-green-300 px-3 py-1.5 rounded-lg"><span className="text-xs font-bold text-green-800">Selected: {selected.size}</span><button onClick={addBulk} className="bg-green-700 text-white px-3 py-1 rounded text-xs font-bold">📥 Add Selected to Paper</button></div>}
          </div>

          <p className="text-xs text-green-600 font-bold mt-2">{msg}</p>

          <div className="mt-3 max-h-[55vh] overflow-auto">
            {questions.map(q=>{
              let def=2; if(q.question_type==='MCQ'||q.question_type==='FillBlank') def=1; else if(q.question_type==='Long') def=5;
              return (
                <div key={q.id} className="bg-white p-3 border-l-4 border-[#bd081c] mb-3 rounded border shadow-sm flex gap-3">
                  <input type="checkbox" checked={selected.has(q.id)} onChange={()=>toggleSelect(q.id)} className="w-5 h-5 mt-1"/>
                  <div className="flex-1">
                    <div className="text-sm font-semibold"><span className="text-[#bd081c]">[{q.question_type}]</span> <span className="text-gray-500 text-xs">(Lesson {q.lesson_no||'N/A'})</span> {q.question_text}</div>
                    {q.question_type==='MCQ' && <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2"><div><b className="text-[#bd081c]">A)</b> {q.opt1}</div><div><b className="text-[#bd081c]">B)</b> {q.opt2}</div><div><b className="text-[#bd081c]">C)</b> {q.opt3}</div><div><b className="text-[#bd081c]">D)</b> {q.opt4}</div></div>}
                    <div className="flex justify-between items-center mt-3 pt-2 border-t">
                      <div className="flex items-center gap-2"><label className="text-xs font-bold">Marks:</label><input id={`marks-${q.id}`} type="number" defaultValue={def} className="w-14 p-1 border rounded text-center text-sm"/></div>
                      <div className="flex gap-1"><button onClick={()=>addToPaper(q.id)} className="bg-[#003049] text-white px-3 py-1 rounded text-xs font-bold">+ Add</button><button onClick={()=>delQ(q.id)} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Delete</button><a href={`addq.html?editId=${q.id}`} className="bg-sky-600 text-white px-3 py-1 rounded text-xs">Edit</a></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}