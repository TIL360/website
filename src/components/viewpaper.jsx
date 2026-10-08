import { useState, useEffect } from 'react';

const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dvggOmxQl7wmhpIrkzbrLw_9Zp-Dm57';
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };

async function sbGet(path){ try{ const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers:HEADERS}); if(!r.ok){ console.log(await r.text()); return []; } return await r.json(); }catch(e){return [];} }

export default function ViewPaper({ schoolCode, onBack }) {
  const REAL_CODE = schoolCode;
  const [exams,setExams]=useState([]); const [classes,setClasses]=useState([]); const [subjects,setSubjects]=useState([]);
  const [examType,setExamType]=useState(''); const [classId,setClassId]=useState(''); const [subject,setSubject]=useState('');
  const [schoolInfo,setSchoolInfo]=useState({name:REAL_CODE, address:'', email:'', contact:''});
  const [paper,setPaper]=useState([]);
  const [settings,setSettings]=useState({total_marks:100,passing_marks:50,obj_marks:40,subj_marks:60,note_objective:'All questions are compulsory',note_subjective:'Attempt only 5'});
  const [showConfig,setShowConfig]=useState(false); const [msg,setMsg]=useState('');
  const [delQId,setDelQId]=useState(null); const [delAll,setDelAll]=useState(false);
  const [existingPaperRow,setExistingPaperRow]=useState(null);

  useEffect(()=>{ loadInit(); },[]);

  const loadInit=async()=>{
    const sch=await sbGet(`schools?school_code=eq.${REAL_CODE}&select=*&limit=1`);
    if(sch[0]) setSchoolInfo({name:sch[0].school_name||sch[0].institute_name||REAL_CODE, address:sch[0].address||'', email:sch[0].email||'', contact:sch[0].contact_number||''});
    let cls=await sbGet(`classes?school_code=eq.${REAL_CODE}&select=id,class_name&order=id`); setClasses(cls); if(cls.length===1) setClassId(String(cls[0].id));
    const ex=await sbGet(`exams?school_code=eq.${REAL_CODE}&select=exam_name&order=exam_id.desc`); setExams(ex);
    const subs=await sbGet(`academy_subjects?school_code=eq.${REAL_CODE}&select=subject_display_name&order=subject_display_name`); setSubjects(subs);
  };

  const loadPaper=async()=>{
    if(!examType||!classId||!subject){ setMsg("Select Exam, Class, Subject"); return; }
    setMsg("Loading...");

    // TRY BOTH COLUMN NAMES - paper_name / subject / subject_name
    let setData=[];
    // Try subject
    setData=await sbGet(`exam_papers?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&subject=eq.${encodeURIComponent(subject)}&select=*&limit=1`);
    if(!setData.length) setData=await sbGet(`exam_papers?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&paper_name=eq.${encodeURIComponent(subject)}&select=*&limit=1`);
    if(!setData.length) setData=await sbGet(`exam_papers?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&select=*&limit=10`);
    // Filter manually for subject if column mismatch
    if(setData.length>1){ const f=setData.find(s=> (s.subject===subject || s.paper_name===subject || s.subject_name===subject)); if(f) setData=[f]; }

    if(setData[0]){
      setExistingPaperRow(setData[0]);
      setSettings({
        total_marks:setData[0].total_marks||100,
        passing_marks:setData[0].passing_marks||50,
        obj_marks:setData[0].obj_marks||40,
        subj_marks:setData[0].subj_marks||60,
        note_objective:setData[0].note_objective||'',
        note_subjective:setData[0].note_subjective||'Attempt the following detailed questions precisely.'
      });
    } else {
      setExistingPaperRow(null);
    }

    // Load paper_questions
    const pq=await sbGet(`paper_questions?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&subject=eq.${encodeURIComponent(subject)}&select=*&order=id`);
    let finalPQ=pq;
    if(!finalPQ.length){
      // Try paper_name column in paper_questions also
      const pq2=await sbGet(`paper_questions?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&select=*&order=id`);
      finalPQ=pq2.filter(p=> (p.subject===subject || p.paper_name===subject));
    }
    if(!finalPQ.length){ setPaper([]); setMsg("No questions found for this paper"); return; }

    const qIds=finalPQ.map(p=>p.question_id);
    const qBank=await sbGet(`question_bank?school_code=eq.${REAL_CODE}&id=in.(${qIds.join(',')})&select=*`);
    const qMap={}; qBank.forEach(q=> qMap[q.id]=q);
    const merged=finalPQ.map(p=>({paper_question_id:p.id, marks_assigned:p.marks,...qMap[p.question_id]}));
    setPaper(merged); setMsg(`Loaded ${merged.length} questions`);
  };

  const saveSettings=async()=>{
    try{
      // Get next ID for new row
      const last=await sbGet(`exam_papers?school_code=eq.${REAL_CODE}&select=id&order=id.desc&limit=1`);
      const nextId=last.length? last[0].id+1:1;

      const basePayload={
        school_code:REAL_CODE,
        exam_type:examType,
        class_id:parseInt(classId),
        subject:subject,
        paper_name:subject,
        subject_name:subject,
        total_marks:settings.total_marks,
        passing_marks:settings.passing_marks,
        obj_marks:settings.obj_marks,
        subj_marks:settings.subj_marks,
        note_objective:settings.note_objective,
        note_subjective:settings.note_subjective
      };

      let ok=false;
      if(existingPaperRow){
        // PATCH existing - try id based
        const r=await fetch(`${SUPABASE_URL}/rest/v1/exam_papers?id=eq.${existingPaperRow.id}&school_code=eq.${REAL_CODE}`,{method:"PATCH",headers:HEADERS,body:JSON.stringify(basePayload)});
        const t=await r.text(); console.log("PATCH:",t); ok=r.ok;
        if(!ok){
          // try without id filter
          const r2=await fetch(`${SUPABASE_URL}/rest/v1/exam_papers?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}`,{method:"PATCH",headers:HEADERS,body:JSON.stringify({total_marks:settings.total_marks, passing_marks:settings.passing_marks, obj_marks:settings.obj_marks, subj_marks:settings.subj_marks, note_objective:settings.note_objective, note_subjective:settings.note_subjective})});
          ok=r2.ok;
        }
      }else{
        // POST new with id
        const payload={id:nextId,...basePayload};
        const r=await fetch(`${SUPABASE_URL}/rest/v1/exam_papers`,{method:"POST",headers:{...HEADERS, Prefer:"return=representation"},body:JSON.stringify(payload)});
        const t=await r.text(); console.log("POST:",t);
        if(!r.ok && t.includes("subject")){
          // Retry without subject column
          const payload2={id:nextId, school_code:REAL_CODE, exam_type:examType, class_id:parseInt(classId), paper_name:subject, total_marks:settings.total_marks, passing_marks:settings.passing_marks, obj_marks:settings.obj_marks, subj_marks:settings.subj_marks, note_objective:settings.note_objective, note_subjective:settings.note_subjective};
          const r2=await fetch(`${SUPABASE_URL}/rest/v1/exam_papers`,{method:"POST",headers:{...HEADERS, Prefer:"return=representation"},body:JSON.stringify(payload2)});
          const t2=await r2.text(); console.log("POST retry:",t2); ok=r2.ok;
        }else ok=r.ok;
      }

      if(ok){ setMsg("✅ Layout saved"); setShowConfig(false); }
      else setMsg("❌ Save failed - Check Supabase table columns");
    }catch(e){ setMsg("Error: "+e.message); }
  };

  const removeQ=async()=>{ if(!delQId) return; await fetch(`${SUPABASE_URL}/rest/v1/paper_questions?id=eq.${delQId}&school_code=eq.${REAL_CODE}`,{method:"DELETE",headers:HEADERS}); setPaper(paper.filter(p=>p.paper_question_id!==delQId)); setDelQId(null); setMsg("Question removed"); };
  const deleteEntire=async()=>{ await fetch(`${SUPABASE_URL}/rest/v1/paper_questions?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}&subject=eq.${encodeURIComponent(subject)}`,{method:"DELETE",headers:HEADERS}); await fetch(`${SUPABASE_URL}/rest/v1/paper_questions?school_code=eq.${REAL_CODE}&exam_type=eq.${encodeURIComponent(examType)}&class_id=eq.${classId}`,{method:"DELETE",headers:HEADERS}); setPaper([]); setDelAll(false); setMsg("Paper deleted"); };

  const mcqs=paper.filter(q=>q.question_type==='MCQ'); const blanks=paper.filter(q=>q.question_type==='FillBlank'); const shorts=paper.filter(q=>q.question_type==='Short'); const tfs=paper.filter(q=>q.question_type==='TrueFalse'); const longs=paper.filter(q=>q.question_type==='Long'); let qCounter=1;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-3">
      <style>{`@media print {.no-print { display:none!important; }.paper-sheet{ box-shadow:none!important; } }.paper-sheet{ background:white; padding:60px 70px 80px 70px; max-width:850px; margin:0 auto; min-height:1100px; box-sizing:border-box; box-shadow:0 4px 12px rgba(0,0,0,0.05); position:relative; }`}</style>
      <div className="no-print bg-white p-4 rounded-xl shadow flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="flex gap-2"><select value={examType} onChange={e=>setExamType(e.target.value)} className="p-2 border rounded text-sm"><option value="">Exam</option>{exams.map(e=><option key={e.exam_name} value={e.exam_name}>{e.exam_name}</option>)}</select><select value={classId} onChange={e=>setClassId(e.target.value)} className="p-2 border rounded text-sm"><option value="">Class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.class_name}</option>)}</select><select value={subject} onChange={e=>setSubject(e.target.value)} className="p-2 border rounded text-sm"><option value="">Subject</option>{subjects.map(s=><option key={s.subject_display_name} value={s.subject_display_name}>{s.subject_display_name}</option>)}</select><button onClick={loadPaper} className="bg-[#bd081c] text-white px-4 py-2 rounded font-bold text-xs">🔍 Load Paper</button><button onClick={()=>setShowConfig(true)} className="bg-gray-700 text-white px-3 py-2 rounded text-xs">⚙️ Configure</button><button onClick={()=>setDelAll(true)} className="bg-red-600 text-white px-3 py-2 rounded text-xs">🗑️ Delete</button></div>
        <div className="flex gap-2"><button onClick={onBack} className="bg-gray-100 border px-3 py-2 rounded text-xs font-bold">← Dashboard</button><button onClick={()=>window.print()} className="bg-[#003049] text-white px-4 py-2 rounded font-bold text-xs">🖨 Print</button></div>
      </div>
      <p className="no-print text-center text-xs font-bold text-green-600">{msg}</p>
      <div className="paper-sheet">
        <div className="text-center border-b-2 border-black pb-3 mb-5"><h1 className="text-[26px] font-bold underline">{schoolInfo.name}</h1><p className="text-sm">{schoolInfo.address}<br/>E-mail: {schoolInfo.email} || Contact: {schoolInfo.contact}</p></div>
        <div className="flex justify-between text-sm border-b-2 border-black pb-4 mb-6"><div><div><b>Date:</b> {new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div><div><b>Paper:</b> {subject}</div><div><b>Total Marks:</b> {settings.total_marks}</div></div><div className="text-right"><div><b>Exam:</b> {examType}</div><div><b>Passing Marks:</b> {settings.passing_marks}</div></div></div>
        <div>
          {paper.length===0 && <p className="text-center text-gray-400 italic py-20">(No questions found)</p>}
          {mcqs.length>0 && <><div className="text-center font-bold underline my-6">OBJECTIVE (Total Marks: {settings.obj_marks})</div>{settings.note_objective && <div className="text-sm mb-3"><b>Note:</b> {settings.note_objective}</div>}<div className="font-bold">Q.{qCounter++}. MCQs</div><ol className="pl-10 list-[upper-roman]">{mcqs.map(q=><li key={q.paper_question_id} className="mb-2 text-[15px]">{q.question_text} ({q.marks_assigned} Mark) <button onClick={()=>setDelQId(q.paper_question_id)} className="no-print text-red-600 border px-1 ml-2 text-xs">Del</button><div className="text-xs">A) {q.opt1} B) {q.opt2} C) {q.opt3} D) {q.opt4}</div></li>)}</ol></>}
          {longs.length>0 && <><div className="text-center font-bold underline my-8">SUBJECTIVE (Total Marks: {settings.subj_marks})</div><div className="text-sm mb-4"><b>Note:</b> {settings.note_subjective}</div>{longs.map(q=>{const n=qCounter++; return <div key={q.paper_question_id} className="mb-3"><b>Q. {n}.</b> {q.question_text} <b>({q.marks_assigned||5} Marks)</b><button onClick={()=>setDelQId(q.paper_question_id)} className="no-print text-red-600 border px-1 ml-2 text-xs">Del</button></div>})}</>}
        </div>
        <div className="absolute bottom-10 left-[70px] right-[70px] flex justify-between text-[10px] border-t border-black pt-1"><span>© Techinfo</span><span>{REAL_CODE}</span></div>
      </div>

      {showConfig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 no-print p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-[450px]">
            <h3 className="font-black border-b pb-2 mb-4">⚙️ Configure Layout [{REAL_CODE}]</h3>
            <label className="text-xs font-bold">Total Marks</label><input type="number" value={settings.total_marks} onChange={e=>setSettings({...settings,total_marks:+e.target.value})} className="w-full p-2 border rounded mb-2"/>
            <label className="text-xs font-bold">Passing Marks</label><input type="number" value={settings.passing_marks} onChange={e=>setSettings({...settings,passing_marks:+e.target.value})} className="w-full p-2 border rounded mb-2"/>
            <label className="text-xs font-bold">Objective Marks</label><input type="number" value={settings.obj_marks} onChange={e=>setSettings({...settings,obj_marks:+e.target.value})} className="w-full p-2 border rounded mb-2"/>
            <label className="text-xs font-bold">Subjective Marks</label><input type="number" value={settings.subj_marks} onChange={e=>setSettings({...settings,subj_marks:+e.target.value})} className="w-full p-2 border rounded mb-2"/>
            <label className="text-xs font-bold">Note Objective</label><textarea value={settings.note_objective} onChange={e=>setSettings({...settings,note_objective:e.target.value})} className="w-full p-2 border rounded mb-2" rows={2}/>
            <label className="text-xs font-bold">Note Subjective</label><textarea value={settings.note_subjective} onChange={e=>setSettings({...settings,note_subjective:e.target.value})} className="w-full p-2 border rounded mb-3" rows={2}/>
            <div className="flex justify-end gap-2"><button onClick={()=>setShowConfig(false)} className="px-4 py-2 border rounded text-xs">Cancel</button><button onClick={saveSettings} className="bg-[#bd081c] text-white px-4 py-2 rounded font-bold text-xs">💾 Save</button></div>
          </div>
        </div>
      )}
      {delQId && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 no-print"><div className="bg-white rounded-xl w-[380px] p-4"><p className="font-bold">Delete question?</p><div className="flex justify-end gap-2 mt-4"><button onClick={removeQ} className="bg-red-600 text-white px-4 py-1.5 rounded text-xs">Delete</button><button onClick={()=>setDelQId(null)} className="border px-4 py-1.5 rounded text-xs">Cancel</button></div></div></div>}
      {delAll && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 no-print"><div className="bg-white rounded-xl w-[400px] p-4"><p className="font-bold">Delete entire paper {examType} - {subject}?</p><div className="flex justify-end gap-2 mt-4"><button onClick={deleteEntire} className="bg-red-600 text-white px-4 py-1.5 rounded text-xs">Delete</button><button onClick={()=>setDelAll(false)} className="border px-4 py-1.5 rounded text-xs">Cancel</button></div></div></div>}
    </div>
  );
}