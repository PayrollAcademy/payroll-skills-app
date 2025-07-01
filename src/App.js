import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, getDocs, doc, setDoc, updateDoc, where } from "firebase/firestore";
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
    const [contextData, setContextData] = useState({});

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
        setContextData(navData);
    };

    const renderContent = () => {
        if (view === 'loading') return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading Platform...</div>;
        if (view === 'error') return <div className="flex items-center justify-center min-h-screen text-red-500">An error occurred. Please refresh.</div>;

        switch (view) {
            case 'login': return <LoginScreen onNavigate={navigateTo} />;
            case 'orgAdminTeamSkills': return <TeamSkillsDashboard user={user} db={db} appId={appId} />;
            case 'orgAdminDashboard': return <CandidateDashboard user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'orgAdminQuestionBank': return <QuestionBank user={user} db={db} appId={appId} />;
            case 'orgAdminTestBuilder': return <TestBuilder user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'orgAdminReportDetail': return <ReportAndFeedback user={user} result={contextData.result} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'candidateDashboard': return <CandidateWelcome user={user} db={db} appId={appId} onNavigate={navigateTo} />;
            case 'candidateTestInProgress': return <TestInProgress user={user} testId={contextData.testId} db={db} appId={appId} onNavigate={navigateTo} />;
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
            { id: 'orgAdminTeamSkills', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Team Skills' },
            { id: 'orgAdminDashboard', icon: 'M9 17v-2a3 3 0 013-3h2a3 3 0 013 3v2m-6 0h6M12 4a3 3 0 100 6 3 3 0 000-6z', label: 'Candidates' },
            { id: 'orgAdminQuestionBank', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Question Bank' },
            { id: 'orgAdminTestBuilder', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', label: 'Test Builder' },
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
    const candidateUser = { name: 'Liam Gallagher', role: 'candidate', company: 'Candidate', avatar: 'https://placehold.co/100x100/60a5fa/1e3a8a?text=L' };

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

const TeamSkillsDashboard = ({ db, appId }) => {
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

    const teamStats = useMemo(() => {
        if (results.length === 0) return { averageScore: 0, testCount: 0 };
        const totalScore = results.reduce((sum, r) => sum + r.percentage, 0);
        return { averageScore: Math.round(totalScore / results.length), testCount: results.length };
    }, [results]);

    const teamPerformanceData = {
        labels: results.map(r => r.userName),
        datasets: [{
            label: 'Overall Score', data: results.map(r => r.percentage),
            backgroundColor: results.map(r => r.percentage >= 80 ? '#10b981' : r.percentage >= 60 ? '#f59e0b' : '#ef4444'),
        }]
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Team Skills Overview</h2><p className="mt-1 text-slate-500">An at-a-glance summary of your team's payroll competencies.</p></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="kpi-card"><p className="text-sm font-medium text-slate-500">Team Average Score</p><p className="text-4xl font-bold mt-2 text-sky-600">{teamStats.averageScore}%</p></div>
                <div className="kpi-card"><p className="text-sm font-medium text-slate-500">Tests Completed</p><p className="text-4xl font-bold mt-2 text-emerald-600">{teamStats.testCount}</p></div>
                <div className="kpi-card"><p className="text-sm font-medium text-slate-500">Area for Development</p><p className="text-4xl font-bold mt-2 text-amber-600">Statutory Pay</p></div>
            </div>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Team Performance</h3>
                {results.length > 0 ? <Bar data={teamPerformanceData} options={{ scales: { y: { beginAtZero: true, max: 100, ticks: { callback: value => value + '%' } } }, plugins: { legend: { display: false } } }}/> : <p>No results yet.</p>}
            </div>
        </>
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
                                        <button onClick={() => onNavigate('orgAdminReportDetail', { user, result: r })} className="text-sky-600 hover:underline text-sm font-semibold">View Report</button>
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

const ReportAndFeedback = ({ user, result, db, appId, onNavigate }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiFeedback, setAiFeedback] = useState(result.aiFeedback || '');
    const [managerFeedback, setManagerFeedback] = useState(result.managerFeedback || '');
    const [isShared, setIsShared] = useState(result.isShared || false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const isManagerView = user.role === 'orgAdmin';

    useEffect(() => {
        const fetchQuestions = async () => {
            const questionsCol = collection(db, `/artifacts/${appId}/public/data/question_bank`);
            const questionSnapshot = await getDocs(questionsCol);
            setQuestions(questionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchQuestions();
    }, [db, appId]);

    const generateAiFeedback = async () => {
        setIsAiLoading(true);
        try {
            const callGeminiFunction = httpsCallable(functions, 'callGemini');
            const prompt = `Analyze the following UK payroll test result for a candidate named ${result.userName} who scored ${result.percentage}%. Their topic scores were: ${JSON.stringify(result.topicScores)}. Generate a concise, professional performance summary (2 paragraphs). Highlight strengths and identify key knowledge gaps based on their scores.`;
            const response = await callGeminiFunction({ prompt });
            const feedbackText = response.data.candidates[0].content.parts[0].text;
            setAiFeedback(feedbackText);
            const resultRef = doc(db, `/artifacts/${appId}/public/data/results`, result.id);
            await updateDoc(resultRef, { aiFeedback: feedbackText });
        } catch (error) {
            console.error("Error generating AI feedback:", error);
        }
        setIsAiLoading(false);
    };
    
    const handleSaveChanges = async () => {
        const resultRef = doc(db, `/artifacts/${appId}/public/data/results`, result.id);
        try {
            await updateDoc(resultRef, { managerFeedback, isShared });
            onNavigate('orgAdminDashboard', { user });
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };
    
    const getTrafficLightColor = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 50) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) return <div>Loading report...</div>;

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Report for: {result.userName}</h2>
                <p className="mt-1 text-slate-500">Score: {result.percentage}% ({result.score}/{result.totalQuestions})</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {isManagerView && (
                        <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">✨ AI Generated Feedback</h3><button onClick={generateAiFeedback} disabled={isAiLoading} className="text-sm bg-sky-100 text-sky-700 font-semibold py-1 px-3 rounded-lg hover:bg-sky-200 disabled:bg-slate-200">{isAiLoading ? 'Generating...' : 'Generate / Regenerate'}</button></div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{aiFeedback || "Click 'Generate' to get an AI summary."}</p>
                        </div>
                    )}
                    {aiFeedback && !isManagerView && (
                         <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold mb-2">✨ AI Generated Feedback</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{aiFeedback}</p>
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-2">Manager's Feedback</h3>
                        {isManagerView ? (
                            <textarea value={managerFeedback} onChange={(e) => setManagerFeedback(e.target.value)} rows="5" className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600" placeholder="Add your personal comments..."></textarea>
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{managerFeedback || "No feedback provided by manager."}</p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                         <h3 className="text-lg font-semibold mb-4">Answer Review</h3>
                        <div className="space-y-4">
                            {result.answers.map((ans, index) => {
                                const question = questions.find(q => q.id === ans.questionId);
                                if (!question) return null;
                                const isCorrect = ans.answer === question.answer;
                                return (
                                    <div key={index} className="pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                        <h4 className="font-semibold text-sm mb-2">{index + 1}. {question.text}</h4>
                                        <div className={`p-2 rounded-md text-sm ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/50' : 'bg-red-50 dark:bg-red-900/50'}`}>
                                            <span className="font-bold">Your answer: </span>{ans.answer}
                                            {isCorrect ? <span className="font-bold text-emerald-600"> (Correct)</span> : <span className="font-bold text-red-600"> (Incorrect)</span>}
                                        </div>
                                        {!isCorrect && <div className="mt-1 p-2 rounded-md text-sm bg-slate-100 dark:bg-slate-700"><span className="font-bold">Correct answer: </span>{question.answer}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-4">Skills Summary</h3>
                        <div className="space-y-3">
                            {result.topicScores && Object.entries(result.topicScores).map(([topic, score]) => (
                                <div key={topic}>
                                    <div className="flex justify-between items-center mb-1 text-sm"><span className="font-medium">{topic}</span><span>{score}%</span></div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                        <div className={`${getTrafficLightColor(score)} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {isManagerView && (
                         <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold mb-2">Sharing</h3>
                            <div className="flex items-center justify-between"><p className="text-sm">Share results with candidate?</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={isShared} onChange={() => setIsShared(!isShared)} className="sr-only peer"/><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div></label></div>
                        </div>
                    )}
                </div>
            </div>
            {isManagerView && (
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={() => onNavigate('orgAdminDashboard', {user})} className="bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300">Cancel</button>
                    <button onClick={handleSaveChanges} className="bg-emerald-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-emerald-700">Save and Finish Review</button>
                </div>
            )}
        </>
    );
};


const QuestionBank = ({ db, appId }) => {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], answer: '', topic: 'General' });
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [topics, setTopics] = useState(["PAYE", "National Insurance", "Statutory Pay", "Pensions", "General"]);
    const [newTopic, setNewTopic] = useState('');

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/question_bank`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setQuestions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleInputChange = (e, index) => {
        const { name, value } = e.target;
        if (name === 'option') {
            const updatedOptions = [...newQuestion.options];
            updatedOptions[index] = value;
            setNewQuestion({ ...newQuestion, options: updatedOptions });
        } else {
            setNewQuestion({ ...newQuestion, [name]: value });
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!newQuestion.text || newQuestion.options.some(opt => !opt) || !newQuestion.answer) {
            setError("Please fill out all fields."); return;
        }
        if (!newQuestion.options.includes(newQuestion.answer)) {
            setError("The correct answer must be one of the four options provided."); return;
        }

        const questionData = { text: newQuestion.text, options: newQuestion.options, answer: newQuestion.answer, topic: newQuestion.topic };

        try {
            if (editingQuestion) {
                const questionRef = doc(db, `/artifacts/${appId}/public/data/question_bank`, editingQuestion.id);
                await updateDoc(questionRef, questionData);
                setSuccess('Question updated successfully!');
            } else {
                await addDoc(collection(db, `/artifacts/${appId}/public/data/question_bank`), questionData);
                setSuccess('Question added successfully!');
            }
            setNewQuestion({ text: '', options: ['', '', '', ''], answer: '', topic: 'General' });
            setEditingQuestion(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Could not save the question.");
        }
    };

    const handleEditClick = (question) => {
        setEditingQuestion(question);
        setNewQuestion({
            text: question.text,
            options: question.options,
            answer: question.answer,
            topic: question.topic,
        });
        window.scrollTo(0, 0);
    };

    const handleAddTopic = () => {
        if (newTopic && !topics.includes(newTopic)) {
            setTopics([...topics, newTopic]);
            setNewTopic('');
        }
    };

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Question Bank</h2><p className="mt-1 text-slate-500">Add, view, and manage test questions.</p></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium">Question Text</label><input type="text" name="text" value={newQuestion.text} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" /></div>
                    <div>
                        <label className="block text-sm font-medium">Topic</label>
                        <select name="topic" value={newQuestion.topic} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md">
                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {newQuestion.options.map((opt, index) => (
                        <div key={index}><label className="block text-sm font-medium">Option {index + 1}</label><input type="text" name="option" value={opt} onChange={(e) => handleInputChange(e, index)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" /></div>
                    ))}
                    <div><label className="block text-sm font-medium">Correct Answer</label><input type="text" name="answer" value={newQuestion.answer} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" placeholder="Copy the correct option text here" /></div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-emerald-500">{success}</p>}
                    <div className="flex items-center gap-4">
                        <button type="submit" className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">{editingQuestion ? 'Update Question' : 'Add Question'}</button>
                        {editingQuestion && <button onClick={() => { setEditingQuestion(null); setNewQuestion({ text: '', options: ['', '', '', ''], answer: '', topic: 'General' }); }} className="text-sm text-slate-500 hover:underline">Cancel Edit</button>}
                    </div>
                </form>
                 <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-md font-semibold mb-2">Manage Topics</h4>
                    <div className="flex gap-2"><input type="text" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="Add new topic" className="block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" /><button onClick={handleAddTopic} className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 whitespace-nowrap">Add Topic</button></div>
                </div>
            </div>
             <div className="mt-8 bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Existing Questions</h3>
                {loading ? <p>Loading...</p> : <div className="space-y-2">{questions.map(q => <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md flex justify-between items-center"><div className="text-sm"><span className="font-semibold bg-sky-100 text-sky-800 text-xs py-1 px-2 rounded-full mr-2">{q.topic}</span>{q.text}</div><button onClick={() => handleEditClick(q)} className="text-sm text-sky-600 hover:underline font-semibold ml-4">Edit</button></div>)}</div>}
            </div>
        </>
    );
};

const TestBuilder = ({ user, db, appId, onNavigate }) => {
    const [allQuestions, setAllQuestions] = useState([]);
    const [testName, setTestName] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/question_bank`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAllQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const handleAddQuestionToTest = (question) => {
        if (!selectedQuestions.find(q => q.id === question.id)) {
            setSelectedQuestions([...selectedQuestions, question]);
        }
    };

    const handleRemoveQuestionFromTest = (questionId) => {
        setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
    };

    const handleSaveTest = async () => {
        if (!testName || selectedQuestions.length === 0) {
            setError('Please provide a test name and select at least one question.');
            return;
        }
        setError('');
        const testData = {
            name: testName,
            questionIds: selectedQuestions.map(q => q.id),
            createdAt: new Date().toISOString(),
        };
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/tests`), testData);
            onNavigate('orgAdminDashboard', { user });
        } catch (err) {
            setError('Could not save the test.');
        }
    };

    if (loading) return <div>Loading questions...</div>;

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Test Builder</h2><p className="mt-1 text-slate-500">Create a new assessment by selecting questions from your bank.</p></header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">Available Questions</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {allQuestions.map(q => (
                            <div key={q.id} className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md flex justify-between items-center">
                                <span className="text-sm">{q.text}</span>
                                <button onClick={() => handleAddQuestionToTest(q)} className="text-sky-600 text-sm font-semibold hover:underline flex-shrink-0 ml-4">Add +</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4">New Test</h3>
                    <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Test Name (e.g., Graduate Intake 2025)" className="mb-4 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" />
                    <div className="space-y-2 mb-4">
                        {selectedQuestions.length > 0 ? selectedQuestions.map(q => (
                             <div key={q.id} className="p-2 bg-sky-50 dark:bg-sky-900/50 rounded-md flex justify-between items-center">
                                <span className="text-sm">{q.text}</span>
                                <button onClick={() => handleRemoveQuestionFromTest(q.id)} className="text-red-500 text-sm font-semibold hover:underline flex-shrink-0 ml-4">Remove</button>
                            </div>
                        )) : <p className="text-sm text-slate-400">Select questions from the left to add them to this test.</p>}
                    </div>
                    {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                    <button onClick={handleSaveTest} className="w-full bg-emerald-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-emerald-700">Save Test</button>
                </div>
            </div>
        </>
    );
};

const CandidateWelcome = ({ user, db, appId, onNavigate }) => {
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/tests`)), (snapshot) => {
            setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const fetchResults = onSnapshot(query(collection(db, `/artifacts/${appId}/public/data/results`), where("userName", "==", user.name), where("isShared", "==", true)), (snapshot) => {
            setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        setLoading(false);
        return () => {
            fetchTests();
            fetchResults();
        };
    }, [db, appId, user.name]);

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h2></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
                <h3 className="text-lg font-semibold mb-4">Available Tests</h3>
                {loading ? <p>Loading tests...</p> : (
                    <div className="space-y-3">
                        {tests.length > 0 ? tests.map(t => (
                            <div key={t.id} className="p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg flex justify-between items-center">
                                <div><p className="font-semibold">{t.name}</p><p className="text-sm text-slate-500">{t.questionIds.length} questions</p></div>
                                <button onClick={() => onNavigate('candidateTestInProgress', { user, testId: t.id })} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">Begin Test</button>
                            </div>
                        )) : <p className="text-sm text-slate-500">There are no tests available at this time.</p>}
                    </div>
                )}
            </div>
             <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">My Results</h3>
                {loading ? <p>Loading results...</p> : (
                    <div className="space-y-3">
                        {results.length > 0 ? results.map(r => (
                            <div key={r.id} className="p-4 border rounded-lg flex justify-between items-center">
                                <div><p className="font-semibold">Completed on {new Date(r.timestamp).toLocaleDateString()}</p><p className="text-sm text-slate-500">Score: {r.percentage}%</p></div>
                                <button onClick={() => onNavigate('orgAdminReportDetail', { user, result: r })} className="text-sky-600 hover:underline text-sm font-semibold">View Details</button>
                            </div>
                        )) : <p className="text-sm text-slate-500">You have no shared results yet.</p>}
                    </div>
                )}
            </div>
        </>
    );
};

const TestInProgress = ({ user, testId, db, appId, onNavigate }) => {
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submittedAnswers, setSubmittedAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTest = async () => {
            if (!testId) return;
            const testSnap = await getDocs(query(collection(db, `/artifacts/${appId}/public/data/tests`), where("__name__", "==", testId)));
            
            if (!testSnap.empty) {
                const testData = { id: testSnap.docs[0].id, ...testSnap.docs[0].data() };
                setTest(testData);

                if (testData.questionIds && testData.questionIds.length > 0) {
                    const questionsQuery = query(collection(db, `/artifacts/${appId}/public/data/question_bank`), where('__name__', 'in', testData.questionIds));
                    const questionSnapshot = await getDocs(questionsQuery);
                    setQuestions(questionSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            }
            setLoading(false);
        };
        fetchTest();
    }, [db, appId, testId]);

    const handleFinishTest = async () => {
        const finalAnswers = [...submittedAnswers, { questionId: questions[currentQuestionIndex].id, answer: selectedAnswer }];
        
        let score = 0;
        finalAnswers.forEach(ans => {
            const question = questions.find(q => q.id === ans.questionId);
            if (question && question.answer === ans.answer) score++;
        });

        const topicScores = {};
        const topicCounts = {};
        finalAnswers.forEach(ans => {
            const question = questions.find(q => q.id === ans.questionId);
            if (question) {
                const topic = question.topic || 'General';
                if (!topicScores[topic]) { topicScores[topic] = 0; topicCounts[topic] = 0; }
                topicCounts[topic]++;
                if (question.answer === ans.answer) topicScores[topic]++;
            }
        });

        const finalTopicScores = {};
        for (const topic in topicScores) {
            finalTopicScores[topic] = Math.round((topicScores[topic] / topicCounts[topic]) * 100);
        }

        const resultData = {
            userId: auth.currentUser.uid, userName: user.name, score, totalQuestions: questions.length,
            percentage: Math.round((score / questions.length) * 100), answers: finalAnswers, timestamp: new Date().toISOString(),
            topicScores: finalTopicScores, isShared: false,
        };

        try {
            const resultId = `${user.name.replace(/\s+/g, '-')}-${Date.now()}`;
            await setDoc(doc(db, `/artifacts/${appId}/public/data/results`, resultId), resultData);
            onNavigate('testFinished', { user });
        } catch (error) {
            console.error("Error saving test results: ", error);
        }
    };
    
    const handleNextQuestion = () => {
        setSubmittedAnswers([...submittedAnswers, { questionId: questions[currentQuestionIndex].id, answer: selectedAnswer }]);
        setSelectedAnswer(null);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
    };

    if (loading) return <div className="text-center">Loading Test...</div>;
    if (!test || questions.length === 0) return <div className="text-center">Could not load test questions.</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-bold">{test.name}</h2><p className="text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p></div>
            </header>
            <div className="mb-6 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"><div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div></div>
            <div className="bg-white dark:bg-slate-800/75 p-8 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-6 leading-relaxed">{currentQuestion.text}</h3>
                <div className="space-y-4">
                    {currentQuestion.options.map((option, index) => (
                        <button key={index} onClick={() => setSelectedAnswer(option)} 
                                className={`answer-option ${selectedAnswer === option ? 'selected' : ''}`}>
                            {option}
                        </button>
                    ))}
                </div>
                <div className="mt-8 flex justify-end">
                    {currentQuestionIndex < questions.length - 1 ? (
                        <button onClick={handleNextQuestion} disabled={!selectedAnswer} className="bg-sky-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-sky-700 disabled:bg-slate-400">Next Question →</button>
                    ) : (
                        <button onClick={handleFinishTest} disabled={!selectedAnswer} className="bg-emerald-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400">Finish Test</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const TestFinishedScreen = ({ user, onNavigate }) => (
    <div className="text-center py-10 max-w-xl mx-auto">
        <svg className="w-16 h-16 mx-auto text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <h2 className="text-2xl font-bold mt-4">Test Complete!</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">Your answers have been submitted successfully.</p>
        <button onClick={() => onNavigate('candidateDashboard', { user })} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-700">Back to Dashboard</button>
    </div>
);

export default App;
