export default function SchoolDashboard({ schoolCode, onLogout, onNavigate }) {
  return (
    <div className="min-h-screen bg-[#f0f4f8] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#0f172a]">🏫 School Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              School Code: <span className="font-bold bg-blue-100 px-3 py-1 rounded-full text-[#0f4c81]">{schoolCode}</span> | Database Connection Successfull
            </p>
          </div>
          <button onClick={onLogout} className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-red-600 hover:text-white transition">Logout ✕</button>
        </div>

        

        {/* Main Actions */}
        <h2 className="font-black text-lg mb-4">Online Portal Modules [{schoolCode}]</h2>
        <div className="grid md:grid-cols-3 gap-6">

          {/* 1. TEACHER PORTAL - Marks Entry */}
          <button onClick={()=>onNavigate('teacherPortal')} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all text-left group">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">👩‍🏫</div>
            <h3 className="font-black mt-4 text-[16px]">Teacher Portal</h3>
            <p className="text-[12px] text-gray-500 mt-1">Login as Sana (8th), Faisal, Admin. Load students, enter <b>marks_obtained_online</b>, save to Supabase. Offline users untouched.</p>
            <span className="mt-4 inline-block bg-[#ea580c] text-white px-4 py-1.5 rounded-full text-xs font-bold">Open Teacher →</span>
          </button>

          {/* 2. ADD QUESTION - Fixed Lesson No bug */}
          <button onClick={()=>onNavigate('addQuestion')} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all text-left group border-l-4 border-l-blue-500">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">➕</div>
            <h3 className="font-black mt-4 text-[16px]">Add Question (Q-Bank)</h3>
            <p className="text-[12px] text-gray-500 mt-1">Add questions to <b>question_bank</b>. Fixed Lesson No validation, class filtered to assigned_class (Sana = 8th only).</p>
            <span className="mt-4 inline-block bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">Add Question →</span>
          </button>

          {/* 3. BUILD PAPER - NEW PORTAL YOU ASKED */}
          <button onClick={()=>onNavigate('buildPaper')} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-xl hover:-translate-y-1 transition-all text-left group border-l-4 border-l-[#bd081c]">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition">📝</div>
            <h3 className="font-black mt-4 text-[16px]">Build Exam Paper</h3>
            <p className="text-[12px] text-gray-500 mt-1">Prepare Paper Portal [ONLINE] - Select Exam, Class, Subject, Lesson. Load pool, add to <b>paper_questions</b> with marks.</p>
            <span className="mt-4 inline-block bg-[#bd081c] text-white px-4 py-1.5 rounded-full text-xs font-bold">Build Paper →</span>
          </button>


        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">TIL360 | {schoolCode} | Teacher Sana restricted to 8th | Admin sees All Classes</p>
      </div>
    </div>
  )
}