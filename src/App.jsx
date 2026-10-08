import { useState } from 'react';
import LandingPage from './components/landingpage.jsx';
import SchoolDashboard from './components/SchoolDashboard.jsx';
import TeacherPortal from './components/TeacherPortal.jsx';
import AddQuestion from './components/AddQuestion.jsx'; // FIXED case - was addquestion.jsx
import BuildPaper from './components/BuildPaper.jsx';
import ViewPaper from './components/viewpaper.jsx';

const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_dvggOmxQl7wmhpIrkzbrLw_9Zp-Dm57';

function App() {
  const [schoolCode, setSchoolCode] = useState(localStorage.getItem('school_code') || '');
  const [view, setView] = useState('dashboard'); // dashboard | teacherPortal | addQuestion | buildPaper
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError("Please enter your school code to continue.");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/schools?school_code=eq.${clean}&select=school_code`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      const data = await res.json();
      if (!data || data.length === 0) {
        setError(`The school code "${clean}" is not correct or not registered. Please check your school code and try again.`);
        setChecking(false);
        return;
      }
      localStorage.setItem('school_code', clean);
      setSchoolCode(clean);
      setView('dashboard');
    } catch (e) {
      setError("Unable to connect right now. Please try again in a moment.");
    }
    setChecking(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('school_code');
    setSchoolCode('');
    setView('dashboard');
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] font-black">Checking School Code... ⏳</div>;
  }

  return (
    <>
    {schoolCode && view === 'viewPaper' && <ViewPaper schoolCode={schoolCode} onBack={()=>setView('dashboard')} />}
      {!schoolCode? <LandingPage onLogin={handleLogin} /> : null}

      {schoolCode && view === 'dashboard' && (
        <SchoolDashboard schoolCode={schoolCode} onLogout={handleLogout} onNavigate={(v) => setView(v)} />
      )}

      {schoolCode && view === 'teacherPortal' && (
        <TeacherPortal schoolCode={schoolCode} onBack={() => setView('dashboard')} onLogout={handleLogout} />
      )}

      {schoolCode && view === 'addQuestion' && (
        <AddQuestion schoolCode={schoolCode} onBack={() => setView('dashboard')} />
      )}

      {/* NEW PORTAL ADDED */}
      {schoolCode && view === 'buildPaper' && (
        <BuildPaper schoolCode={schoolCode} onBack={() => setView('dashboard')} />
      )}

      {/* BEAUTIFUL ALERT BOX */}
      {error && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-[scaleIn_0.2s_ease]">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔒</div>
            <h3 className="text-center font-black text-lg text-[#0f172a]">Invalid School Code</h3>
            <p className="text-center text-sm text-gray-500 mt-2 leading-relaxed">{error}</p>
            <button
              onClick={() => setError('')}
              className="w-full mt-6 bg-[#0f4c81] hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition"
            >
              Okay, Got it
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-3">If you forgot your code, contact your school admin.</p>
          </div>
        </div>
      )}
    </>
  );
}
export default App;