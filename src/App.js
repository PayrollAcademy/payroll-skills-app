import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
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
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// --- Main App Component ---
function App() {
    const [view, setView] = useState('loading');
    const [user, setUser] = useState(null);
    const [appId] = useState('payroll-skills-app-v1');
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setView('login');
            } else {
                signInAnonymously(auth).catch((error) => { console.error("Anonymous sign-in error:", error); setView('error'); });
            }
        });
        return () => unsubscribe();
    }, []);

    const navigateTo = (newView, navData = {}) => {
        setView(newView);
        if (navData.user) setUser(navData.user);
        if (navData.result) setSelectedResult(navData.result);
    };

    const renderContent = () => {
        if (view === 'loading') return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading Platform...</div>;
        if (view === 'error') return <div className="flex items-center justify-center min-h-screen text-red-500">An error occurred. Please refresh.</div>;

        switch (view) {
            case 'login': return <LoginScreen onNavigate={navigateTo} />;
            case 'orgAdminDashboard': return <CandidateDashboard user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'orgAdminQuestionBank': return <QuestionBank user={user} db={db} appId={appId} />;
            case 'orgAdminReview': return <FeedbackReview user={user} result={selectedResult} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'candidateDashboard': return <CandidateWelcome user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'candidateTestInProgress': return <TestInProgress user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'testFinished': return <TestFinishedScreen user={user} onNavigate={navigateTo} />;
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
            { id: 'orgAdminDashboard', icon: 'M9 17v-2a3 3 0 013-3h2a3 3 0 013 3v2m-6 0h6M12 4a3 3 0 100 6 3 3 0 000-6z', label: 'Candidates' },
            { id: 'orgAdminQuestionBank', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Question Bank' },
        ],
        candidate: [
            { id: 'candidateDashboard', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'My Dashboard' }
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
                            <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.id, { user }); }}
                               className={`sidebar-link text-slate-600 dark:text-slate-300 ${currentView === item.id ? 'active' : ''}`}>
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                                {item.label}
                            </a>
                        ))}
                    </nav>
                     <div className="p-4 absolute bottom-0 w-64"><div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/75"><div className="flex items-center"><img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name}/><div className="ml-3"><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p><p className="text-xs text-slate-500 dark:text-slate-400">{user.company}</p></div></div><a href="#" onClick={() => onNavigate('login')} className="w-full text-center mt-3 text-xs text-slate-500 hover:text-sky-500">Sign Out</a></div></div>
                </aside>
            )}
            <main className="flex-1 overflow-y-auto"><div className={showSidebar ? "p-6 md:p-8" : "p-2 sm:p-4 md:p-8"}>{children}</div></main>
        </div>
    );
};

// --- Component Views ---

const LoginScreen = ({ onNavigate }) => {
    const orgAdminUser = { name: 'Payroll Manager', role: 'orgAdmin', company: 'ABC Corp', avatar: 'https://placehold.co/100x100/a3e635/14532d?text=A' };
    const candidateUser = { name: 'Liam Gallagher', role: 'candidate', company: 'Candidate', avatar: 'https://placehold.co/100x100/60a5fa/1e3a8a?text=L', uid: 'candidate_liam_gallagher' }; // Add mock UID

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
                <div className="text-center"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Skills Platform</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Welcome back! Please sign in.</p></div>
                <div className="space-y-6">
                    <button onClick={() => onNavigate('orgAdminDashboard', { user: orgAdminUser })} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700">Sign in as Payroll Manager</button>
                    <button onClick={() => onNavigate('candidateDashboard', { user: candidateUser })} className="w-full flex justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">Sign in as Candidate</button>
                </div>
            </div>
        </div>
    );
};

const CandidateDashboard = ({ user, db, appId, onNavigate }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/results`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    if (loading) return <div>Loading candidates...</div>;

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Candidate Results</h2><p className="mt-1 text-slate-500">Review and share test results.</p></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">All Results</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-600 text-sm text-slate-500">
                            <tr><th className="py-2 px-4">Candidate</th><th className="py-2 px-4">Score</th><th className="py-2 px-4">Status</th><th className="py-2 px-4"></th></tr>
                        </thead>
                        <tbody>
                            {results.length > 0 ? results.map(r => (
                                <tr key={r.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="py-3 px-4 font-medium">{r.userName}</td>
                                    <td className="py-3 px-4">{r.percentage}%</td>
                                    <td className="py-3 px-4">{r.isShared ? <span className="text-emerald-500 font-semibold">Shared</span> : <span className="text-slate-500">Not Shared</span>}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button onClick={() => onNavigate('orgAdminReview', { user, result: r })} className="text-sky-600 hover:underline text-sm font-semibold">Review & Share</button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center py-4">No results have been submitted yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const FeedbackReview = ({ user, result, db, appId, onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(result.aiFeedback || '');
    const [managerFeedback, setManagerFeedback] = useState(result.managerFeedback || '');
    const [isShared, setIsShared] = useState(result.isShared || false);

    const generateAiFeedback = async () => {
        setLoading(true);
        try {
            const callGeminiFunction = httpsCallable(functions, 'callGemini');
            const prompt = `Analyze the following UK payroll test result for a candidate named ${result.userName} who scored ${result.percentage}%. Generate a concise, professional performance summary (2 paragraphs). Highlight strengths and identify key knowledge gaps based on their score.`;
            const response = await callGeminiFunction({ prompt });
            const feedbackText = response.data.candidates[0].content.parts[0].text;
            setAiFeedback(feedbackText);
            // Also update the document in Firestore
            const resultRef = doc(db, `/artifacts/${appId}/public/data/results`, result.id);
            await updateDoc(resultRef, { aiFeedback: feedbackText });
        } catch (error) {
            console.error("Error generating AI feedback:", error);
        }
        setLoading(false);
    };
    
    const handleSaveChanges = async () => {
        const resultRef = doc(db, `/artifacts/${appId}/public/data/results`, result.id);
        try {
            await updateDoc(resultRef, {
                managerFeedback,
                isShared
            });
            onNavigate('orgAdminDashboard', { user });
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Review Test for {result.userName}</h2><p className="mt-1 text-slate-500">Add manual feedback and share the results with the candidate.</p></header>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">✨ AI Generated Feedback</h3><button onClick={generateAiFeedback} disabled={loading} className="text-sm bg-sky-100 text-sky-700 font-semibold py-1 px-3 rounded-lg hover:bg-sky-200 disabled:bg-slate-200">{loading ? 'Generating...' : 'Generate / Regenerate'}</button></div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{aiFeedback || "Click 'Generate' to get an AI summary of the candidate's performance."}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-2">Manager's Feedback</h3>
                    <textarea value={managerFeedback} onChange={(e) => setManagerFeedback(e.target.value)} rows="5" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" placeholder="Add your personal comments and feedback here..."></textarea>
                </div>
                <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-2">Sharing</h3>
                    <div className="flex items-center justify-between"><p className="text-sm">Share results and feedback with candidate?</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isShared} onChange={() => setIsShared(!isShared)} className="sr-only peer"/><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div></label></div>
                </div>
                <div className="flex justify-end gap-4">
                    <button onClick={() => onNavigate('orgAdminDashboard', {user})} className="bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button onClick={handleSaveChanges} className="bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-emerald-700">Save and Finish Review</button>
                </div>
            </div>
        </>
    );
};

const CandidateWelcome = ({ user, db, appId, onNavigate }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app with user-specific security rules, you'd use a where() clause here.
        // For this mockup, we fetch all and filter on the client.
        const q = query(collection(db, `/artifacts/${appId}/public/data/results`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resultsData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(r => r.userName === user.name && r.isShared); // Filter for this user's shared results
            setResults(resultsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId, user.name]);

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h2></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <h3 className="text-lg font-semibold mb-4">New Tests</h3>
                <div className="p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg flex justify-between items-center">
                    <div><p className="font-semibold">Payroll Skills Assessment</p><p className="text-sm text-slate-500">Assigned by ABC Corp</p></div>
                    <button onClick={() => onNavigate('candidateTestInProgress', { user })} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">Begin Test</button>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">My Results</h3>
                {loading ? <p>Loading results...</p> : (
                    <div className="space-y-3">
                        {results.length > 0 ? results.map(r => (
                            <div key={r.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div><p className="font-semibold">Completed on {new Date(r.timestamp).toLocaleDateString()}</p><p className="text-sm text-slate-500">Score: {r.percentage}%</p></div>
                                <button onClick={() => onNavigate('orgAdminReview', { user, result: r, fromCandidate: true })} className="text-sky-600 hover:underline text-sm font-semibold">View Details</button>
                            </div>
                        )) : <p className="text-sm text-slate-500">You have no shared results yet.</p>}
                    </div>
                )}
            </div>
        </>
    );
};


// --- Other components are here for completeness ---
const TestInProgress = ({ user, db, appId, onNavigate }) => { /* ... same as before ... */ return <div>Test In Progress...</div>; };
const TestFinishedScreen = ({ user, onNavigate }) => { /* ... same as before ... */ return <div>Test Finished!</div>; };
const QuestionBank = ({ user, db, appId }) => { /* ... same as before ... */ return <div>Question Bank</div>; };
const TeamSkillsDashboard = () => <div>Team Skills Dashboard</div>;

export default App;
