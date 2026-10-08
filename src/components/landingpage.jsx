import { useState, useEffect, useRef } from 'react';

const SUPABASE_URL = 'https://vxdqfngvmrrupfooywwk.supabase.co';

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

export default function LandingPage({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [error, setError] = useState("");
  const [highlight, setHighlight] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlight(id);
    setTimeout(() => setHighlight(""), 2500);
  };

  const [aboutRef, aboutVisible] = useReveal();
  const [featRef, featVisible] = useReveal();
  const [priceRef, priceVisible] = useReveal();
  const [contactRef, contactVisible] = useReveal();

  const handleViewDashboard = async () => {
    let clean = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) { setError("Please enter School Code"); return; }
    if (clean === 'TECHINFO2026') clean = 'TECHINFO_2026';
    if (clean.length < 3) { setError("Invalid School Code"); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      if (onLogin) onLogin(clean);
      else { localStorage.setItem('school_code', clean); window.location.reload(); }
      setShowLogin(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white text-[#1e293b] overflow-x-hidden selection:bg-[#0f4c81] selection:text-white">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px);} to { opacity:1; transform:translateY(0);} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shine { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes pulseHighlight { 0%{box-shadow:0 0 0 0 rgba(15,76,129,0.7)} 50%{box-shadow:0 0 0 20px rgba(15,76,129,0), 0 0 30px rgba(15,76,129,0.3)} 100%{box-shadow:0 0 0 0 rgba(15,76,129,0)} }
        @keyframes borderGlow { 0%{border-color:#e2e8f0} 50%{border-color:#0f4c81; background:#f0f7ff} 100%{border-color:#e2e8f0} }
      .animate-fadeUp{ animation: fadeUp 0.8s ease-out forwards; }
      .animate-float{ animation: float 4s ease-in-out infinite; }
      .reveal{ opacity:0; transform:translateY(40px); transition: all 0.8s cubic-bezier(0.2,0.8,0.2,1); }
      .reveal.active{ opacity:1; transform:translateY(0); }
      .stagger > *{ opacity:0; transform:translateY(20px); }
      .stagger.active > *{ animation: fadeUp 0.6s ease-out forwards; }
      .stagger.active > *:nth-child(1){animation-delay:0.1s}.stagger.active > *:nth-child(2){animation-delay:0.2s}.stagger.active > *:nth-child(3){animation-delay:0.3s}
      .stagger.active > *:nth-child(4){animation-delay:0.4s}.stagger.active > *:nth-child(5){animation-delay:0.5s}.stagger.active > *:nth-child(6){animation-delay:0.6s}
      .highlight-active{ animation: pulseHighlight 2s ease, borderGlow 2.5s ease; border-width:2px!important; border-radius:24px; }
      `}</style>

      <div className="bg-[#b91c1c] text-white text-center py-2.5 text-[11px] font-bold tracking-wider relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-[50%] animate-[shine_3s_infinite]"></div>
        🚨 TECHINFOLAB360 PRESENTS - EDU PULSE: The Software That Saves 70% of Your Time
      </div>

      <nav className={`bg-white/90 backdrop-blur sticky top-0 z-50 border-b transition-all ${scrolled? 'shadow-lg py-2' : 'shadow-sm py-3.5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="TECHINFOLAB360" className="w-10 h-10 object-contain rounded-lg shadow-sm border bg-white" onError={(e)=>e.target.style.display='none'} />
            <div>
              <h1 className="text-[22px] font-black text-[#0f4c81] leading-none flex items-center gap-1">EduPulse <span className="text-[10px] bg-[#0f4c81] text-white px-2 py-0.5 rounded-full">2026</span></h1>
              <p className="text-[10px] text-gray-500 font-black tracking-[0.2em]">BY TECHINFOLAB360</p>
            </div>
          </div>
          <div className="hidden md:flex gap-8 font-bold text-[13px] tracking-wide">
            {['home','about','features','pricing','contact'].map(l=>(
              <button key={l} onClick={()=>scrollTo(l)} className="hover:text-[#0f4c81] capitalize relative group py-1">{l}<span className={`absolute -bottom-1 left-0 h-[2.5px] bg-[#0f4c81] transition-all ${highlight===l? 'w-full':'w-0 group-hover:w-full'}`}></span></button>
            ))}
          </div>
          <button onClick={()=>setShowLogin(true)} className="bg-[#0f4c81] hover:bg-black hover:scale-105 text-white px-6 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-lg">🔐 School Login</button>
        </div>
      </nav>

      <section id="home" className="bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe] py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="animate-fadeUp">
            <span className="bg-[#0f4c81] text-white text-[11px] font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-2"> <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span> TRUSTED BY 100+ SCHOOLS | PRODUCT BY TECHINFOLAB360</span>
            <h1 className="mt-5 text-4xl md:text-[48px] font-black leading-[0.95] tracking-tight">Complete Offline<br /><span className="text-[#0f4c81]">School Management</span><br />System - EduPulse</h1>
            <p className="mt-5 text-[15px] leading-7 text-gray-600">An all-in-one ERP built for Pakistani schools by <b>TECHINFOLAB360</b>. Manage Students, Fees, RFID, Exams - <b>100% Offline + Online Portal Sync </b></p>
            <div className="mt-8 flex gap-3">
              <button onClick={()=>setShowLogin(true)} className="bg-[#0f4c81] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:bg-black hover:-translate-y-1 transition-all shadow-xl">Login to School Portal →</button>
              <button onClick={()=>scrollTo('features')} className="bg-white border-2 border-[#0f4c81] text-[#0f4c81] px-8 py-3.5 rounded-full font-bold text-sm hover:bg-[#0f4c81] hover:text-white transition">Explore Features</button>
            </div>
            <p className="mt-4 text-[11px] text-gray-500 font-bold">🛡️ School Code Example: TECHINFO_2026 | Company: TECHINFOLAB360</p>
          </div>
          <div className="bg-white rounded-[20px] shadow-2xl border p-6 animate-float">
            <div className="bg-[#0f172a] text-white p-3 rounded-xl font-bold text-[12px] flex justify-between items-center"><span className="flex items-center gap-2"><img src="/logo.png" className="w-5 h-5 rounded bg-white" alt="logo"/> 📊 EDU PULSE LIVE PREVIEW</span><span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-green-50 border p-4 rounded-xl"><p className="text-[11px] text-gray-500 font-bold">Total Students</p><p className="text-2xl font-black">1,248</p></div>
              <div className="bg-blue-50 border p-4 rounded-xl"><p className="text-[11px] text-gray-500 font-bold">Fee Collected</p><p className="text-2xl font-black">Rs. 8.2L</p></div>
              <div className="bg-orange-50 border p-4 rounded-xl"><p className="text-[11px] text-gray-500 font-bold">Present Today</p><p className="text-2xl font-black">96%</p></div>
              <div className="bg-purple-50 border p-4 rounded-xl"><p className="text-[11px] text-gray-500 font-bold">Staff Active</p><p className="text-2xl font-black">42</p></div>
            </div>
            <div className="mt-3 bg-[#f8fafc] p-3 rounded-xl border text-[11px]">🏫 Product: <b>EduPulse</b> | Company: <b>TECHINFOLAB360</b> | Database: Connected</div>
          </div>
        </div>
      </section>

      <section ref={aboutRef} id="about" className={`max-w-7xl mx-auto px-6 py-20 reveal ${aboutVisible?'active':''} ${highlight==='about'?'highlight-active bg-blue-50/50 border':''} border border-transparent`}>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[#0f4c81] font-black text-xs tracking-widest">ABOUT US</span>
            <h2 className="text-4xl font-black mt-2 leading-tight">TechInfoLab360 - <br/>Makers of EduPulse</h2>
            <p className="mt-4 text-gray-600 leading-7">We are <b>TECHINFOLAB360</b>, a Pakistani software house. Our flagship product <b>EduPulse</b> is a complete school ERP. When school enters code like <b>TECHINFO_2026</b>, it navigates to dashboard where all online portal (teacher login, Q-Bank, Build Paper, View Paper) works.</p>
            <div className="mt-6 flex gap-3">
              <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="font-black text-xl">100+</p><p className="text-xs text-gray-500">Schools</p></div>
              <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="font-black text-xl">100%</p><p className="text-xs text-gray-500">Offline</p></div>
              <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="font-black text-xl">24/7</p><p className="text-xs text-gray-500">Support</p></div>
            </div>
          </div>
          <div className="bg-[#f8fafc] rounded-[24px] p-8 border flex flex-col items-center text-center">
            <img src="/logo.png" alt="TECHINFOLAB360" className="w-24 h-24 object-contain rounded-2xl shadow-lg bg-white p-2 border" />
            <h3 className="mt-4 font-black text-xl">TECHINFOLAB360</h3>
            <p className="text-xs text-gray-500 font-bold tracking-widest">SOFTWARE HOUSE</p>
            <p className="mt-3 text-sm text-gray-600">Product: <b className="text-[#0f4c81]">EduPulse</b> - School Management System 2026</p>
          </div>
        </div>
      </section>

      <section ref={featRef} id="features" className={`py-20 px-6 bg-[#f8fafc] border-y reveal ${featVisible?'active':''} ${highlight==='features'?'highlight-active':''} border-2 border-transparent transition-all`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <span className="bg-[#0f4c81] text-white text-[10px] font-bold px-3 py-1 rounded-full">FEATURES</span>
            <h2 className="text-4xl font-black mt-3">Everything Your School Needs - EduPulse</h2>
            <p className="text-gray-500 mt-2 text-sm">By TECHINFOLAB360 - 6 powerful modules, 1 product</p>
          </div>
          <div className={`mt-12 grid md:grid-cols-3 gap-6 stagger ${featVisible?'active':''}`}>
            <FeatureCard title="STUDENT MANAGEMENT" color="bg-[#0f172a]" points={["Centralized Profile & History","Bulk Excel Upload","Fee & Family Tracking","ID Card Generator"]} />
            <FeatureCard title="PORTAL SYNC" color="bg-[#b91c1c]" badge="ONLINE" points={["School Code Based Login [TECHINFO_2026]","Teacher Login (Sana 8th Only)","Real-time Marks Entry","Q-Bank + Build Paper + View Paper"]} />
            <FeatureCard title="RFID ATTENDANCE" color="bg-[#ea580c]" points={["RFID Cards Integration","WhatsApp Auto Alerts","Biometric Support","Monthly Reports"]} />
            <FeatureCard title="EXAM & PAPER" color="bg-[#0f4c81]" points={["Auto Paper Generation","Question Bank (MCQ, Short, Long)","Print Layout with Watermark","Configure Total/Passing Marks"]} />
            <FeatureCard title="FEE MANAGEMENT" color="bg-[#16a34a]" points={["Challan Printing","Defaulter List","Discount & Scholarship","Online Collection Report"]} />
            <FeatureCard title="STAFF & HR" color="bg-[#7c3aed]" points={["Payroll","Leave Management","Teacher Portal Access","Role Based Dashboard"]} />
          </div>
        </div>
      </section>

      {/* PRICING - CORRECTED */}
      <section ref={priceRef} id="pricing" className={`max-w-7xl mx-auto px-6 py-20 reveal ${priceVisible?'active':''} ${highlight==='pricing'?'highlight-active':''} border-2 border-transparent transition-all rounded-[24px]`}>
        <div className="text-center max-w-3xl mx-auto">
          <span className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest">PRICING - TECHINFOLAB360</span>
          <h2 className="text-4xl font-black mt-3">EduPulse Pricing - Offline & Online</h2>
          <p className="text-gray-500 mt-2 text-[13px]">Product by <b>TECHINFOLAB360</b> | Same desktop software, choose with or without online portal</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">

          <div className="bg-white border-2 rounded-[20px] p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-center"><h3 className="font-black text-gray-500 tracking-widest text-[11px]">OFFLINE ONLY</h3><span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full">NO INTERNET NEEDED</span></div>
            <p className="text-4xl font-black mt-4">Rs. 35,000/-</p>
            <p className="text-xs text-green-600 font-bold mt-1">Lifetime - One Time Payment</p>
            <p className="text-[11px] text-gray-400 mt-2 leading-4">Complete offline desktop app. No online portal, no monthly fee. Works 100% without internet.</p>
            <ul className="mt-6 text-[13px] space-y-2.5">
              <li className="flex gap-2"><span className="text-green-600">✓</span> Unlimited Students</li>
              <li className="flex gap-2"><span className="text-green-600">✓</span> Fee, Attendance, Exams, RFID</li>
              <li className="flex gap-2"><span className="text-green-600">✓</span> ID Cards, Certificates</li>
              <li className="flex gap-2 text-gray-400"><span>✕</span> No Teacher Online Portal</li>
              <li className="flex gap-2 text-gray-400"><span>✕</span> No Q-Bank Cloud Sync</li>
            </ul>
            <button onClick={()=>setShowLogin(true)} className="mt-6 w-full border-2 border-black py-3 rounded-full font-black text-sm hover:bg-black hover:text-white transition">Choose Offline</button>
          </div>

          <div className="bg-[#0f172a] text-white rounded-[20px] p-7 shadow-2xl scale-105 border-2 border-yellow-400 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-black px-4 py-1 rounded-full tracking-widest">MOST POPULAR • RECOMMENDED</span>
            <div className="flex justify-between items-center mt-2"><h3 className="font-black text-yellow-400 tracking-widest text-[11px]">SMART SCHOOL - OFFLINE + ONLINE</h3><span className="bg-yellow-400 text-black text-[9px] font-bold px-2 py-1 rounded-full"></span></div>
            <p className="text-4xl font-black mt-4">Rs. 40,000/-</p>
            <p className="text-xs text-yellow-400 font-bold mt-1">Lifetime License + Rs. 500/month</p>
            <div className="mt-3 bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-[11px] font-bold text-yellow-200">Why Rs. 500/month? Cloud Hosting Fee</p>
              <p className="text-[10px] text-gray-300 leading-4 mt-1">Your school gets its own secure cloud database. This covers: Real-time sync, Teacher login, Daily backups, Security, Storage for Question Bank & Papers. You own the software, we maintain your cloud.</p>
            </div>
            <ul className="mt-5 text-[13px] space-y-2.5 text-gray-200">
              <li className="flex gap-2"><span className="text-green-400">✓</span> Everything in Offline +</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Online Portal [TECHINFO_2026]</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Teacher Login (Sana 8th Only)</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Q-Bank + Build Paper + View Paper</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Marks Entry Online - Real Time</li>
              <li className="flex gap-2"><span className="text-green-400">✓</span> Parent Access Ready</li>
            </ul>
            <button onClick={()=>setShowLogin(true)} className="mt-6 w-full bg-white text-black py-3.5 rounded-full font-black text-sm hover:bg-yellow-400 transition shadow-lg">Get Smart Version Now</button>
            <p className="text-[10px] text-gray-400 text-center mt-2">Demo: TECHINFO_2026 • Company: TECHINFOLAB360</p>
          </div>

          <div className="bg-white border-2 rounded-[20px] p-7 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-center"><h3 className="font-black text-[#0f4c81] tracking-widest text-[11px]">ANNUAL SUBSCRIPTION</h3><span className="bg-blue-50 text-[#0f4c81] text-[10px] font-bold px-2 py-1 rounded-full">FLEXIBLE</span></div>
            <p className="text-4xl font-black mt-4 text-[#0f4c81]">Rs. 6,000/-</p>
            <p className="text-xs text-gray-500 font-bold mt-1">Per Year - Offline Only</p>
            <div className="mt-3 bg-[#eff6ff] rounded-xl p-3 border border-blue-100">
              <p className="text-[11px] font-bold text-[#0f4c81]">With Online Portal: Rs. 1,000/month</p>
              <p className="text-[10px] text-gray-600 leading-4 mt-1">6k/year covers offline software. If you need online portal, it's Rs. 1000/month total (includes 500 cloud hosting + 500 portal maintenance & support).</p>
            </div>
            <ul className="mt-5 text-[13px] space-y-2.5">
              <li className="flex gap-2"><span className="text-green-600">✓</span> All Offline Features</li>
              <li className="flex gap-2"><span className="text-green-600">✓</span> Yearly Updates</li>
              <li className="flex gap-2"><span className="text-green-600">✓</span> Cancel Anytime</li>
              <li className="flex gap-2"><span className="text-blue-600">+</span> Add Online: Rs. 1000/mo</li>
            </ul>
            <button onClick={()=>setShowLogin(true)} className="mt-6 w-full bg-[#0f4c81] text-white py-3 rounded-full font-black text-sm hover:bg-black transition">Start Annual Plan</button>
          </div>

        </div>

        <p className="text-center text-[11px] text-gray-400 mt-8">All prices by <b>TECHINFOLAB360</b> | Product: <b>EduPulse</b> | Online database cloud included in online plans | No hidden charges</p>
      </section>

      <footer ref={contactRef} id="contact" className={`bg-[#0f172a] text-white py-12 px-6 reveal ${contactVisible?'active':''} ${highlight==='contact'?'highlight-active!border-yellow-400':''} border-2 border-transparent`}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="flex gap-3">
            <img src="/logo.png" alt="logo" className="w-12 h-12 rounded-xl bg-white p-1 object-contain" />
            <div><h3 className="font-black">TECHINFOLAB360</h3><p className="text-xs text-gray-400">Product: <b className="text-white">EduPulse</b> - School Management System</p><p className="text-[11px] text-gray-500 mt-1">© 2026 All Rights Reserved</p></div>
          </div>
          <div><h4 className="font-bold">Contact</h4><p className="text-sm text-gray-400 mt-2">📞 0311-5101738<br/>📧 techinfolab360@gmail.com<br/>🌐 Database: Connected<br/>🏫 Demo Code: TECHINFO_2026</p></div>
          <div><h4 className="font-bold">Quick Links</h4><div className="flex flex-col gap-1 mt-2 text-sm text-gray-400"><button onClick={()=>scrollTo('about')} className="text-left hover:text-white">About</button><button onClick={()=>scrollTo('features')} className="text-left hover:text-white">Features</button><button onClick={()=>scrollTo('pricing')} className="text-left hover:text-white">Pricing</button><button onClick={()=>setShowLogin(true)} className="text-left hover:text-white">School Login</button></div></div>
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-md overflow-hidden shadow-2xl animate-fadeUp border">
            <div className="bg-[#0f4c81] p-5 text-white flex justify-between items-center">
              <div className="flex gap-3 items-center"><img src="/logo.png" className="w-8 h-8 bg-white rounded-lg p-1" alt="logo"/><div><h2 className="font-black">School Portal Login</h2><p className="text-[11px] opacity-80">EduPulse by TECHINFOLAB360 | Database Verified</p></div></div>
              <button onClick={()=>setShowLogin(false)} className="text-2xl w-8 h-8 bg-white/20 rounded-full">×</button>
            </div>
            <div className="p-6">
              <label className="text-[11px] font-black text-gray-500 tracking-widest">SCHOOL CODE</label>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} onKeyDown={e=>{if(e.key==='Enter') handleViewDashboard()}} placeholder="TECHINFO_2026" className="mt-1 w-full border-2 rounded-xl px-4 py-3 font-black tracking-widest text-[#0f4c81] outline-none focus:border-[#0f4c81] bg-[#f8fafc]" />
              {error && <p className="text-red-600 text-xs mt-2 font-bold bg-red-50 p-2 rounded">{error}</p>}
              <p className="text-[11px] text-gray-400 mt-2">This code is your <b>school_code</b> in EDUPULSE Database tables. EduPulse will open dashboard.</p>
              <button onClick={handleViewDashboard} disabled={loading} className="mt-5 w-full bg-[#0f4c81] text-white py-3.5 rounded-xl font-black hover:bg-black transition disabled:opacity-50 shadow-lg">
                {loading? "Verifying & Opening EduPulse..." : "View Dashboard →"}
              </button>
              <div className="mt-3 text-[11px] bg-yellow-50 p-2.5 rounded-xl border border-yellow-200">Try: <b>TECHINFO_2026</b> or <b>TECHINFO2026</b> - both auto-correct and navigate to dashboard</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ title, color, points, badge }){
  return (
    <div className="bg-white rounded-[16px] border shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
      <div className={`${color} text-white px-4 py-3 font-black text-[11px] tracking-widest flex justify-between items-center`}><span>{title}</span>{badge && <span className="bg-yellow-400 text-black text-[9px] px-2 py-1 rounded-full animate-pulse">{badge}</span>}</div>
      <ul className="p-5 space-y-2.5">{points.map((p,i)=><li key={i} className="text-[13px] flex gap-2 leading-5"><span className="text-green-600 font-bold">✓</span><span className="text-gray-600 group-hover:text-black transition">{p}</span></li>)}</ul>
    </div>
  )
}