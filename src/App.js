import React, { useState, useEffect } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  RadialLinearScale, PointElement, LineElement, Filler
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbUuCsFVSNA7ijESCAG9TFofQOFmVmWOU",
  authDomain: "payroll-skills-platform.firebaseapp.com",
  projectId: "payroll-skills-platform",
  storageBucket: "payroll-skills-platform.appspot.com",
  messagingSenderId: "373583398443",
  appId: "1:373583398443:web:12c57176373976b71ecc6e",
  measurementId: "G-H0PKLLW5PM"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const auth = getAuth(app);

// --- Main App Component ---
function App() {
    const [view, setView] = useState('loading');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                console.log("Firebase user signed in anonymously:", firebaseUser.uid);
                setView('login');
            } else {
                console.log("No user, signing in anonymously...");
                signInAnonymously(auth).catch((error) => {
                    console.error("Anonymous sign-in error:", error);
                    setView('error');
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const navigateTo = (newView, userData = null) => {
        setView(newView);
        if (userData) { setUser(userData); }
    };

    const renderContent = () => {
        if (view === 'loading') {
            return <div className="flex items-center justify-center min-h-screen">Loading Platform...</div>;
        }
        if (view === 'error') {
            return <div className="flex items-center justify-center min-h-screen">An error occurred. Please refresh.</div>;
        }

        switch (view) {
            case 'login': return <LoginScreen onNavigate={navigateTo} />;
            case 'orgAdminTeamSkills': return <TeamSkillsDashboard user={user} />;
            case 'orgAdminDashboard': return <CandidateDashboard user={user} onNavigate={navigateTo}/>;
            case 'orgAdminTestBuilder': return <TestBuilder user={user} />;
            case 'orgAdminResults': return <CandidateReport user={user} />;
            case 'candidateDashboard': return <CandidateWelcome user={user} onNavigate={navigateTo} />;
            case 'candidateTestInProgress': return <TestInProgress user={user} onNavigate={navigateTo} />;
            default: return <LoginScreen onNavigate={navigateTo} />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
             {view === 'login' || view === 'loading' || view === 'error' ? renderContent() : (
                <Shell user={user} onNavigate={navigateTo} currentView={view}>
                    {renderContent()}
                </Shell>
            )}
        </div>
    );
}

// --- Main Application Shell ---
const Shell = ({ user, children, onNavigate, currentView }) => {
    const navs = {
        orgAdmin: [
            { id: 'orgAdminTeamSkills', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Team Skills' },
            { id: 'orgAdminDashboard', icon: 'M9 17v-2a3 3 0 013-3h2a3 3 0 013 3v2m-6 0h6M12 4a3 3 0 100 6 3 3 0 000-6z', label: 'Candidates' },
            { id: 'orgAdminTestBuilder', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Test Builder' },
        ],
        candidate: [
            { id: 'candidateDashboard', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'My Tests' }
        ],
    };
    
    const navigationLinks = user && user.role ? navs[user.role] : [];
    const showSidebar = currentView !== 'candidateTestInProgress';

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
             {showSidebar && user && (
                <aside className="w-64 bg-white dark:bg-slate-800/75 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="p-4"><h1 className="text-2xl font-bold text-sky-600 dark:text-sky-400">Payroll<span className="font-light">Test</span></h1></div>
                    <nav className="p-4 space-y-2">
                         {navigationLinks.map(item => (
                            <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.id, user); }}
                               className={`sidebar-link text-slate-600 dark:text-slate-300 ${currentView === item.id ? 'active' : ''}`}>
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                {item.label}
                            </a>
                        ))}
                    </nav>
                     <div className="p-4 absolute bottom-0 w-64">
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/75">
                             <div className="flex items-center">
                                <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name}/>
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.company}</p>
                                </div>
                            </div>
                            <a href="#" onClick={() => onNavigate('login')} className="w-full text-center mt-3 text-xs text-slate-500 hover:text-sky-500">Sign Out</a>
                        </div>
                    </div>
                </aside>
            )}
            <main className="flex-1 overflow-y-auto">
                <div className={showSidebar ? "p-6 md:p-8" : "p-2 sm:p-4 md:p-8"}>
                    {children}
                </div>
            </main>
        </div>
    );
};

// --- Component Views ---

const LoginScreen = ({ onNavigate }) => {
    const orgAdminUser = { name: 'Payroll Manager', role: 'orgAdmin', company: 'ABC Corp', avatar: 'https://placehold.co/100x100/a3e635/14532d?text=A' };
    const candidateUser = { name: 'Liam Gallagher', role: 'candidate', company: 'Candidate', avatar: 'https://placehold.co/100x100/60a5fa/1e3a8a?text=L' };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Skills Platform</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Welcome back! Please sign in.</p>
                </div>
                <div className="space-y-6">
                    <button onClick={() => onNavigate('orgAdminTeamSkills', orgAdminUser)} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                        Sign in as Payroll Manager
                    </button>
                     <button onClick={() => onNavigate('candidateDashboard', candidateUser)} className="w-full flex justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                        Sign in as Candidate
                    </button>
                </div>
            </div>
        </div>
    );
};

const TeamSkillsDashboard = ({ user }) => {
    // ... TeamSkillsDashboard JSX remains the same ...
    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold text-slate-900 dark:text-white">Team Skills Overview</h2></header>
            <AITools />
        </>
    );
};

const AITools = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState("");
    const [topic, setTopic] = useState("Pensions");

    const handleGenerateQuestion = async () => {
        setLoading(true);
        setResult("");
        try {
            const callGeminiFunction = httpsCallable(functions, 'callGemini');
            const prompt = `You are an expert in UK Payroll regulations. Create one new multiple-choice quiz question based on the topic: "${topic}". Provide 4 options, one of which must be correct. Also provide a brief explanation.`;
            const response = await callGeminiFunction({ prompt });
            const text = response.data.candidates[0].content.parts[0].text;
            setResult(text);
        } catch (error) {
            console.error("Error calling Cloud Function:", error);
            setResult(`An error occurred: ${error.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
            <h3 className="text-lg font-semibold">✨ AI Question Generator</h3>
            <div className="flex items-center gap-2 mt-4">
                 <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Enter a payroll topic" className="flex-grow w-full px-4 py-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"/>
                <button onClick={handleGenerateQuestion} disabled={loading} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 disabled:bg-slate-400">
                    {loading ? "Generating..." : "Generate Question"}
                </button>
            </div>
            {result && <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg whitespace-pre-wrap"><p>{result}</p></div>}
        </div>
    );
};

const CandidateWelcome = ({ user, onNavigate }) => {
     return (
        <>
             <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome, {user.name.split(' ')[0]}!</h2>
                <p className="mt-1 text-slate-500 dark:text-slate-400">Here are your assigned skills assessments.</p>
            </header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Tests to Take</h3>
                <div className="p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Graduate Assessment</p>
                        <p className="text-sm text-slate-500">Assigned by ABC Corp</p>
                    </div>
                    <button onClick={() => onNavigate('candidateTestInProgress', user)} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors text-sm">Begin Test</button>
                </div>
            </div>
        </>
    )
};

const TestInProgress = ({ user, onNavigate }) => {
    const [timer, setTimer] = useState(25 * 60);

    useEffect(() => {
        const interval = setInterval(() => setTimer(prev => (prev > 0 ? prev - 1 : 0)), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    const handleAnswerClick = (e) => {
        const optionsContainer = e.currentTarget;
        if (e.target.classList.contains('answer-option')) {
            optionsContainer.querySelectorAll('.answer-option').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-bold">Graduate Assessment</h2><p className="text-slate-500">Question 1 of 8</p></div>
                <div className="text-right"><p className="text-lg font-semibold text-sky-600">{formatTime(timer)}</p><p className="text-xs text-slate-500">Time Remaining</p></div>
            </header>
            <div className="mb-6 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"><div className="bg-sky-500 h-2.5 rounded-full" style={{ width: '12.5%' }}></div></div>
            <div className="bg-white dark:bg-slate-800/75 p-8 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-6 leading-relaxed">What is the standard emergency tax code for the 2025/2026 tax year in the UK?</h3>
                <div className="space-y-4" onClick={handleAnswerClick}>
                    <button className="answer-option">1257L W1/M1</button>
                    <button className="answer-option">BR</button>
                    <button className="answer-option">0T</button>
                    <button className="answer-option">K100</button>
                </div>
                 <div className="mt-8 flex justify-end"><button className="bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-sky-700 transition-colors">Next Question &rarr;</button></div>
            </div>
        </div>
    );
};

// --- Other components to make the file complete ---
const CandidateDashboard = () => <div>Candidate Management Dashboard</div>;
const TestBuilder = () => <div>Test Builder</div>;
const CandidateReport = () => <div>Candidate Report</div>;

export default App;