import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, getDocs, doc, setDoc } from "firebase/firestore";
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

// --- Main App Component ---
function App() {
    const [view, setView] = useState('loading');
    const [user, setUser] = useState(null);
    const [appId] = useState('payroll-skills-app-v1');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setView('login');
            } else {
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
        if (view === 'loading') return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading Platform...</div>;
        if (view === 'error') return <div className="flex items-center justify-center min-h-screen text-red-500">An error occurred. Please refresh.</div>;

        switch (view) {
            case 'login': return <LoginScreen onNavigate={navigateTo} />;
            case 'orgAdminTeamSkills': return <TeamSkillsDashboard user={user} db={db} appId={appId} />;
            case 'orgAdminDashboard': return <CandidateDashboard user={user} db={db} appId={appId} onNavigate={navigateTo}/>;
            case 'orgAdminQuestionBank': return <QuestionBank user={user} db={db} appId={appId} />;
            case 'candidateDashboard': return <CandidateWelcome user={user} onNavigate={navigateTo} />;
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
            { id: 'orgAdminTeamSkills', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', label: 'Team Skills' },
            { id: 'orgAdminDashboard', icon: 'M9 17v-2a3 3 0 013-3h2a3 3 0 013 3v2m-6 0h6M12 4a3 3 0 100 6 3 3 0 000-6z', label: 'Candidates' },
            { id: 'orgAdminQuestionBank', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Question Bank' },
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
                <div className="text-center"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Skills Platform</h1><p className="mt-2 text-slate-500 dark:text-slate-400">Welcome back! Please sign in.</p></div>
                <div className="space-y-6">
                    <button onClick={() => onNavigate('orgAdminTeamSkills', orgAdminUser)} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700">Sign in as Payroll Manager</button>
                    <button onClick={() => onNavigate('candidateDashboard', candidateUser)} className="w-full flex justify-center py-3 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">Sign in as Candidate</button>
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
            const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResults(resultsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    const teamStats = useMemo(() => {
        if (results.length === 0) return { averageScore: 0, testCount: 0 };
        const totalScore = results.reduce((sum, r) => sum + r.percentage, 0);
        return {
            averageScore: Math.round(totalScore / results.length),
            testCount: results.length,
        };
    }, [results]);

    const teamPerformanceData = {
        labels: results.map(r => r.userName),
        datasets: [{
            label: 'Overall Score',
            data: results.map(r => r.percentage),
            backgroundColor: results.map(r => r.percentage >= 80 ? '#10b981' : r.percentage >= 60 ? '#f59e0b' : '#ef4444'),
        }]
    };

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold">Team Skills Overview</h2>
                <p className="mt-1 text-slate-500">An at-a-glance summary of your team's payroll competencies.</p>
            </header>
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

const CandidateDashboard = ({ db, appId }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/results`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResults(resultsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    if (loading) return <div>Loading candidates...</div>;

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Candidate Results</h2><p className="mt-1 text-slate-500">Review completed test results.</p></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">All Results</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-600 text-sm text-slate-500">
                            <tr><th className="py-2 px-4">Candidate</th><th className="py-2 px-4">Score</th><th className="py-2 px-4">Date</th></tr>
                        </thead>
                        <tbody>
                            {results.length > 0 ? results.map(r => (
                                <tr key={r.id} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="py-3 px-4 font-medium">{r.userName}</td>
                                    <td className="py-3 px-4">{r.percentage}% ({r.score}/{r.totalQuestions})</td>
                                    <td className="py-3 px-4 text-sm text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</td>
                                </tr>
                            )) : <tr><td colSpan="3" className="text-center py-4">No results have been submitted yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};


const QuestionBank = ({ db, appId }) => {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], answer: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/question_bank`));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const questionsData = [];
            querySnapshot.forEach((doc) => questionsData.push({ id: doc.id, ...doc.data() }));
            setQuestions(questionsData);
            setLoading(false);
        }, (err) => {
            setError("Failed to load questions."); setLoading(false);
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

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (!newQuestion.text || newQuestion.options.some(opt => !opt) || !newQuestion.answer) {
            setError("Please fill out all fields."); return;
        }
        if (!newQuestion.options.includes(newQuestion.answer)) {
            setError("The correct answer must be one of the four options provided."); return;
        }
        try {
            await addDoc(collection(db, `/artifacts/${appId}/public/data/question_bank`), {
                text: newQuestion.text, options: newQuestion.options, answer: newQuestion.answer,
            });
            setNewQuestion({ text: '', options: ['', '', '', ''], answer: '' });
            setSuccess('Question added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError("Could not save the question.");
        }
    };

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Question Bank</h2><p className="mt-1 text-slate-500">Add, view, and manage test questions.</p></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Add New Question</h3>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                    <div><label className="block text-sm font-medium">Question Text</label><input type="text" name="text" value={newQuestion.text} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required /></div>
                    {newQuestion.options.map((opt, index) => (
                        <div key={index}><label className="block text-sm font-medium">Option {index + 1}</label><input type="text" name="option" value={opt} onChange={(e) => handleInputChange(e, index)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required /></div>
                    ))}
                    <div><label className="block text-sm font-medium">Correct Answer</label><input type="text" name="answer" value={newQuestion.answer} onChange={handleInputChange} placeholder="Copy the correct option text here" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md" required /></div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {success && <p className="text-sm text-emerald-600">{success}</p>}
                    <button type="submit" className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">Add Question</button>
                </form>
            </div>
            <div className="mt-8 bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Existing Questions</h3>
                {loading ? <p>Loading questions...</p> : <ul className="space-y-2">{questions.map(q => <li key={q.id} className="text-sm p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">{q.text}</li>)}</ul>}
            </div>
        </>
    );
};

const CandidateWelcome = ({ user, onNavigate }) => (
    <>
         <header className="mb-8"><h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h2><p className="mt-1 text-slate-500">Here are your assigned skills assessments.</p></header>
        <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4">Tests to Take</h3>
            <div className="p-4 bg-sky-50 dark:bg-sky-900/50 rounded-lg flex justify-between items-center">
                <div><p className="font-semibold">Payroll Skills Assessment</p><p className="text-sm text-slate-500">Assigned by ABC Corp</p></div>
                <button onClick={() => onNavigate('candidateTestInProgress', user)} className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">Begin Test</button>
            </div>
        </div>
    </>
);

const TestInProgress = ({ user, db, appId, onNavigate }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submittedAnswers, setSubmittedAnswers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            const questionsCol = collection(db, `/artifacts/${appId}/public/data/question_bank`);
            const questionSnapshot = await getDocs(questionsCol);
            setQuestions(questionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        };
        fetchQuestions();
    }, [db, appId]);

    const handleFinishTest = async () => {
        const finalAnswers = [...submittedAnswers, { questionId: questions[currentQuestionIndex].id, answer: selectedAnswer }];
        let score = 0;
        finalAnswers.forEach(ans => {
            const question = questions.find(q => q.id === ans.questionId);
            if (question && question.answer === ans.answer) score++;
        });

        const resultData = {
            userId: auth.currentUser.uid, userName: user.name, score, totalQuestions: questions.length,
            percentage: Math.round((score / questions.length) * 100), answers: finalAnswers, timestamp: new Date().toISOString(),
        };

        try {
            const resultId = `${user.name.replace(/\s+/g, '-')}-${Date.now()}`;
            await setDoc(doc(db, `/artifacts/${appId}/public/data/results`, resultId), resultData);
            onNavigate('testFinished', user);
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
    if (questions.length === 0) return <div className="text-center">No questions available for this test. Please ask an admin to add some.</div>;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <header className="flex justify-between items-center mb-6">
                <div><h2 className="text-2xl font-bold">Payroll Skills Assessment</h2><p className="text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p></div>
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
        <p className="text-slate-600 dark:text-slate-400 mt-2 mb-8">Your answers have been submitted successfully. Your manager will be able to view your results.</p>
        <button onClick={() => onNavigate('candidateDashboard', user)} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-700">Back to Dashboard</button>
    </div>
);

export default App;
