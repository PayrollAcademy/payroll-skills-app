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
    const [contextData, setContextData] = useState({}); // For passing data like result or testId

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

const TeamSkillsDashboard = ({ db, appId }) => { /* ... same as before ... */ return <div>Team Skills Dashboard</div>; };

const CandidateDashboard = ({ user, db, appId, onNavigate }) => { /* ... same as before ... */ return <div>Candidate Dashboard</div>; };

const ReportAndFeedback = ({ user, result, db, appId, onNavigate }) => { /* ... same as before ... */ return <div>Report and Feedback</div>; };

const QuestionBank = ({ db, appId }) => {
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], answer: '', topic: 'General' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const topics = ["PAYE", "National Insurance", "Statutory Pay", "Pensions", "General"];

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
                text: newQuestion.text, options: newQuestion.options, answer: newQuestion.answer, topic: newQuestion.topic
            });
            setNewQuestion({ text: '', options: ['', '', '', ''], answer: '', topic: 'General' });
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
                    <button type="submit" className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700">Add Question</button>
                </form>
            </div>
             <div className="mt-8 bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold mb-4">Existing Questions</h3>
                {loading ? <p>Loading...</p> : <div className="space-y-2">{questions.map(q => <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md text-sm"><span className="font-semibold bg-sky-100 text-sky-800 text-xs py-1 px-2 rounded-full mr-2">{q.topic}</span>{q.text}</div>)}</div>}
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, `/artifacts/${appId}/public/data/tests`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, appId]);

    return (
        <>
            <header className="mb-8"><h2 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}!</h2></header>
            <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
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
            const testRef = doc(db, `/artifacts/${appId}/public/data/tests`, testId);
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

    const handleFinishTest = async () => { /* ... same as before ... */ };
    const handleNextQuestion = () => { /* ... same as before ... */ };

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
