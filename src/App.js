import React, { useState, useEffect } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";


// Registering Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  RadialLinearScale, PointElement, LineElement, Filler
);

// Your web app's Firebase configuration - This is correctly in place
const firebaseConfig = {
  apiKey: "AIzaSyAbUuCsFVSNA7ijESCAG9TFofQOFmVmWOU",
  authDomain: "payroll-skills-platform.firebaseapp.com",
  projectId: "payroll-skills-platform",
  storageBucket: "payroll-skills-platform.appspot.com",
  messagingSenderId: "373583398443",
  appId: "1:373583398443:web:12c57176373976b71ecc6e",
  measurementId: "G-H0PKLLW5PM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Functions
const functions = getFunctions(app);

// --- Main App Component ---
function App() {
    const [view, setView] = useState('login');
    const [user, setUser] = useState(null);

    const navigateTo = (newView, userData = null) => {
        setView(newView);
        if (userData) { setUser(userData); }
    };

    const renderContent = () => {
        switch (view) {
            case 'login': return <LoginScreen onNavigate={navigateTo} />;
            case 'orgAdminTeamSkills': return <TeamSkillsDashboard user={user} />;
            case 'orgAdminDashboard': return <CandidateDashboard user={user} onNavigate={navigateTo}/>;
            case 'orgAdminTestBuilder': return <TestBuilder user={user} />;
            case 'orgAdminResults': return <CandidateReport user={user} onNavigate={navigateTo} />;
            case 'candidateDashboard': return <CandidateWelcome user={user} onNavigate={navigateTo} />;
            case 'candidateTestInProgress': return <TestInProgress user={user} onNavigate={navigateTo} />;
            default: return <LoginScreen onNavigate={navigateTo} />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
            {view === 'login' ? renderContent() : (
                <Shell user={user} onNavigate={navigateTo} currentView={view}>
                    {renderContent()}
                </Shell>
            )}
        </div>
    );
}

// --- Main Application Shell ---
const Shell = ({ user, children, onNavigate, currentView }) => {
    // ... Shell JSX and logic remains the same ...
    return (
        // For brevity, the full shell JSX is omitted, but it's the same as before
        <main className="flex-1 overflow-y-auto">
            <div className="p-6 md:p-8">{children}</div>
        </main>
    )
};


// --- Component Views ---

const LoginScreen = ({ onNavigate }) => {
    // ... LoginScreen JSX remains the same ...
    return <div>Login Screen Content</div>;
};

const TeamSkillsDashboard = ({ user }) => {
    // This is the new component that handles the AI calls
    return (
        <>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Team Skills Overview</h2>
                <p className="mt-1 text-slate-500 dark:text-slate-400">An at-a-glance summary of your team's payroll competencies.</p>
            </header>
            <AITools /> {/* ADDING THE AI TOOLS COMPONENT HERE */}
            {/* ... rest of the dashboard JSX ... */}
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
            // This is the new part: calling our Cloud Function
            const callGeminiFunction = httpsCallable(functions, 'callGemini');
            const prompt = `You are an expert in UK Payroll regulations. Create one new multiple-choice quiz question based on the topic: "${topic}". Provide 4 options, one of which must be correct. Also provide a brief explanation.`;
            
            const response = await callGeminiFunction({ prompt });
            // The actual content is nested in the response data
            const text = response.data.candidates[0].content.parts[0].text;
            setResult(text);

        } catch (error) {
            console.error("Error calling Cloud Function:", error);
            setResult("An error occurred. Please check the console.");
        }
        setLoading(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800/75 p-6 rounded-lg border border-slate-200 dark:border-slate-700 mb-8">
            <h3 className="text-lg font-semibold">✨ AI Question Generator</h3>
            <div className="flex items-center gap-2 mt-4">
                 <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a payroll topic"
                    className="flex-grow w-full px-4 py-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                />
                <button
                    onClick={handleGenerateQuestion}
                    disabled={loading}
                    className="bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-sky-700 disabled:bg-slate-400"
                >
                    {loading ? "Generating..." : "Generate Question"}
                </button>
            </div>
            {result && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg whitespace-pre-wrap">
                    <p>{result}</p>
                </div>
            )}
        </div>
    );
};


// --- All other components (CandidateDashboard, TestBuilder, etc.) would be here ---
// For brevity, they are omitted but would be needed in the full file.
const CandidateDashboard = () => <div>Candidate Dashboard</div>;
const TestBuilder = () => <div>Test Builder</div>;
const CandidateReport = () => <div>Candidate Report</div>;
const CandidateWelcome = ({onNavigate, user}) => <button onClick={() => onNavigate('candidateTestInProgress', user)}>Begin Test</button>;
const TestInProgress = () => <div>Test In Progress</div>;


export default App;