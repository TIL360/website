import { useState } from 'react';
const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dvggOmxQl7wmhpIrkzbrLw_9Zp-Dm57';
const HEADERS = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
async function sbGet(path){ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:HEADERS}); return r.ok? await r.json():[]; }
async function sbPatch(path,body){ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method:"PATCH",headers:HEADERS,body:JSON.stringify(body)}); return r.ok; }

export default function TeacherPortal({ schoolCode, onBack, onLogout }) {
  const REAL_CODE = schoolCode || localStorage.getItem('school_code');
  const [user,setUser]=useState(null); const [myClass,setMyClass]=useState('');
  const [username,setUsername]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const [exams,setExams]=useState([]); const [classes,setClasses]=useState([]); const [subjects,setSubjects]=useState([]);
  const [subjectMap,setSubjectMap]=useState({}); const [selExam,setSelExam]=useState(''); const [selClass,setSelClass]=useState(''); const [selSubj,setSelSubj]=useState('');
  const [marks,setMarks]=useState([]); const [studentsMap,setStudentsMap]=useState({});

  const loginTeacher=async()=>{
    if(!username.trim()||!password.trim()){ setError("Enter username & password"); return; }
    setLoading(true); setError('');
    const data=await sbGet(`users?school_code=eq.${REAL_CODE}&username=eq.${encodeURIComponent(username.trim())}&select=*`);
    if(!data.length || data[0].password!==password.trim()){ setError("Invalid username or password"); setLoading(false); return; }
    const u=data[0]; setUser(u); setMyClass(String(u.assigned_class||'').trim());
    const names=await sbGet(`academy_subjects?school_code=eq.${REAL_CODE}&select=subject_code,subject_display_name`);
    const m={}; names.forEach(n=>{ m[n.subject_code.toLowerCase().trim()]=n.subject_display_name; m[n.subject_code]=n.subject_display_name; }); setSubjectMap(m);
    const ex=await sbGet(`exams?school_code=eq.${REAL_CODE}&select=*&order=exam_id.desc`); setExams(ex); setLoading(false);
  };

  const loadClasses=async(examId)=>{
    setSelExam(examId); setSelClass(''); setSelSubj(''); setSubjects([]); setMarks([]);
    if(!examId) return;
    const data=await sbGet(`exam_subject_settings?school_code=eq.${REAL_CODE}&exam_id=eq.${examId}&select=class`);
    let allCls=[...new Set(data.map(d=>String(d.class).trim()).filter(Boolean))];
    const assigned=myClass||String(user?.assigned_class||'').trim(); const isAdmin=String(user?.usertype||'').toLowerCase()==='admin';
    if(!isAdmin && assigned && assigned.toLowerCase()!=='all'){
      const allowed=assigned.split(',').map(s=>s.trim().toLowerCase()); const filtered=allCls.filter(c=>allowed.includes(c.toLowerCase()));
      if(filtered.length){ setClasses(filtered); if(filtered.length===1){ setSelClass(filtered[0]); loadSubjectsForClass(filtered[0],examId); } }
      else{ setClasses([assigned]); setSelClass(assigned); loadSubjectsForClass(assigned,examId); }
    }else setClasses(allCls);
  };
  const loadSubjectsForClass=async(cls,examId)=>{ const eid=examId||selExam; const data=await sbGet(`exam_subject_settings?school_code=eq.${REAL_CODE}&exam_id=eq.${eid}&class=eq.${encodeURIComponent(cls)}&select=subject_code,total_marks`); setSubjects(data); };
  const loadSubjects=async(cls)=>{ setSelClass(cls); setSelSubj(''); setMarks([]); loadSubjectsForClass(cls,selExam); };
  const loadStudents=async()=>{
    if(!selExam||!selClass||!selSubj){ alert("Select Exam, Class and Subject"); return; }
    const data=await sbGet(`student_subject_marks?school_code=eq.${REAL_CODE}&exam_id=eq.${selExam}&class=eq.${selClass}&subject_code=eq.${selSubj}&select=result_id,student_id,subject_code,marks_set,marks_obtained,marks_obtained_online&order=student_id`);
    const ids=[...new Set(data.map(d=>d.student_id))]; let studs=[]; if(ids.length) studs=await sbGet(`students?school_code=eq.${REAL_CODE}&id=in.(${ids.join(',')})&select=id,registration_no,student_name`);
    const map={}; studs.forEach(s=>map[s.id]=s); setStudentsMap(map);
    // FIX: If marks_obtained_online is NULL, show marks_obtained as initial value
    setMarks(data.map(d=>({...d, marks_obtained_online: d.marks_obtained_online?? d.marks_obtained })));
  };
  const saveAll=async()=>{
    let c=0; for(let r of marks){ if(r.marks_obtained_online===''||r.marks_obtained_online===null) continue; const ok=await sbPatch(`student_subject_marks?school_code=eq.${REAL_CODE}&result_id=eq.${r.result_id}&subject_code=eq.${r.subject_code}`,{marks_obtained_online:Number(r.marks_obtained_online)}); if(ok) c++; }
    alert(`✅ ${c} Online Marks saved!`); loadStudents();
  };

  if(!user) return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-[380px]">
        <div className="flex justify-between items-center mb-6"><p className="text-sm font-black">School: {REAL_CODE}</p><button onClick={onLogout} className="text-[11px] font-bold text-red-600">Change School ✕</button></div>
        <h2 className="text-center font-black text-xl">TEACHER LOGIN</h2>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full mt-6 p-3.5 border-2 rounded-xl text-sm" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full mt-3 p-3.5 border-2 rounded-xl text-sm" />
        <button onClick={loginTeacher} className="w-full mt-5 bg-[#ea580c] text-white py-3.5 rounded-xl font-black">{loading?"Checking...":"LOGIN"}</button>
        {error && <p className="text-red-600 text-xs text-center mt-3 font-bold">{error}</p>}
        <button onClick={onBack} className="w-full mt-3 text-xs text-gray-500 font-bold">← Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-4">
      <div className="bg-white rounded-2xl shadow p-6 max-w-[1100px] mx-auto">
        <div className="flex justify-between text-sm border-b pb-4"><span>Welcome <b>{user.username}</b> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-[10px] font-bold ml-1">{REAL_CODE} | {myClass||'All Classes'}</span></span><button onClick={()=>setUser(null)} className="text-red-600 font-bold text-xs">Logout</button></div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <select value={selExam} onChange={e=>loadClasses(e.target.value)} className="w-full p-3.5 border-2 border-black rounded-xl font-bold text-sm"><option value="">-- Select Exam --</option>{exams.map(e=><option key={e.exam_id} value={e.exam_id}>{e.exam_name}</option>)}</select>
          <select value={selClass} onChange={e=>loadSubjects(e.target.value)} className="w-full p-3.5 border-2 border-black rounded-xl font-bold text-sm"><option value="">-- Select Class --</option>{classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <select value={selSubj} onChange={e=>setSelSubj(e.target.value)} className="w-full p-3.5 border-2 border-black rounded-xl font-bold text-sm"><option value="">-- Select Subject --</option>{subjects.map(s=>{ const name=subjectMap[s.subject_code.toLowerCase()]||s.subject_code.toUpperCase(); return <option key={s.subject_code} value={s.subject_code}>{name} ({s.total_marks})</option>})}</select>
        </div>
        <button onClick={loadStudents} className="w-full mt-6 bg-[#ea580c] text-white py-4 rounded-xl font-black">📥 Load Students</button>
        {marks.length>0 && (
          <>
            <div className="mt-6 overflow-auto border-2 rounded-2xl max-h-[520px]">
              <table className="w-full text-sm"><thead className="bg-[#102a43] text-white text-[11px] sticky top-0"><tr><th className="p-3 text-left">Reg No</th><th className="p-3 text-left">Name</th><th className="p-3 text-center">Offline<br/><span className="text-[9px] font-normal opacity-70">Total / Obt</span></th><th className="p-3 text-center">Teacher Online Marks</th></tr></thead>
              <tbody>{marks.map((row,i)=>{const st=studentsMap[row.student_id]||{registration_no:row.student_id, student_name:'Student'}; return <tr key={i} className="border-b hover:bg-orange-50"><td className="p-3 text-xs">{st.registration_no}</td><td className="p-3 font-bold text-xs">{st.student_name}</td><td className="p-3 text-center"><span className="bg-gray-100 px-3 py-1.5 rounded-full font-black text-xs border">{row.marks_set||75} / {row.marks_obtained}</span></td>
              <td className="p-3 text-center">
                <input type="number" value={row.marks_obtained_online??''} onChange={e=>{const nm=[...marks]; nm[i].marks_obtained_online=e.target.value; setMarks(nm);}} className="w-28 p-2.5 border-2 border-orange-400 bg-orange-50 rounded-lg text-center font-black text-sm outline-none focus:border-orange-600" />
              </td></tr>})}</tbody></table>
            </div>
            <button onClick={saveAll} className="w-full mt-5 bg-green-600 text-white py-4 rounded-xl font-black">💾 Save {marks.length} Marks - {REAL_CODE}</button>
          </>
        )}
      </div>
    </div>
  );
}