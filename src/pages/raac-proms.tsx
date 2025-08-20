import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { User, Calendar, FileText, BarChart3, Settings, LogOut, Plus, Edit, Trash2, Download, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Types
interface Patient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  dateChirurgie: string;
  typeChirurgie: 'hanche' | 'genou';
  coteChirurgie: 'gauche' | 'droite';
  chirurgien: string;
  statut: 'actif' | 'termine' | 'suspendu';
  scores: Score[];
  rappels: Rappel[];
}

interface Score {
  id: string;
  patientId: string;
  typeQuestionnaire: 'oxford_hip' | 'oxford_knee' | 'womac';
  timepoint: 'preop' | '6semaines' | '3mois' | '6mois' | '1an';
  dateCompletion: string;
  scoreTotal: number;
  reponses: { [key: string]: number };
  statut: 'complete' | 'partiel' | 'en_attente';
}

interface Rappel {
  id: string;
  patientId: string;
  typeRappel: 'questionnaire' | 'rdv' | 'information';
  dateEnvoi: string;
  datePrevue: string;
  statut: 'envoye' | 'programme' | 'echec';
  contenu: string;
}

// Mock data
const mockPatients: Patient[] = [
  {
    id: '1',
    nom: 'Martin',
    prenom: 'Jean',
    dateNaissance: '1965-03-15',
    email: 'jean.martin@email.com',
    telephone: '05.59.12.34.56',
    dateChirurgie: '2024-01-15',
    typeChirurgie: 'hanche',
    coteChirurgie: 'droite',
    chirurgien: 'Dr. Fagot',
    statut: 'actif',
    scores: [
      {
        id: 's1',
        patientId: '1',
        typeQuestionnaire: 'oxford_hip',
        timepoint: 'preop',
        dateCompletion: '2024-01-10',
        scoreTotal: 28,
        reponses: {},
        statut: 'complete'
      },
      {
        id: 's2',
        patientId: '1',
        typeQuestionnaire: 'oxford_hip',
        timepoint: '6semaines',
        dateCompletion: '2024-02-26',
        scoreTotal: 35,
        reponses: {},
        statut: 'complete'
      }
    ],
    rappels: []
  },
  {
    id: '2',
    nom: 'Dubois',
    prenom: 'Marie',
    dateNaissance: '1972-08-22',
    email: 'marie.dubois@email.com',
    telephone: '05.59.87.65.43',
    dateChirurgie: '2024-02-01',
    typeChirurgie: 'genou',
    coteChirurgie: 'gauche',
    chirurgien: 'Dr. Lascano',
    statut: 'actif',
    scores: [
      {
        id: 's3',
        patientId: '2',
        typeQuestionnaire: 'oxford_knee',
        timepoint: 'preop',
        dateCompletion: '2024-01-28',
        scoreTotal: 22,
        reponses: {},
        statut: 'complete'
      }
    ],
    rappels: []
  }
];

const oxfordHipQuestions = [
  "Comment décririez-vous la douleur que vous ressentez habituellement dans votre hanche ?",
  "Avez-vous eu des difficultés à vous laver et à vous sécher à cause de votre hanche ?",
  "Avez-vous eu des difficultés à entrer et sortir d'une voiture ou à utiliser les transports publics à cause de votre hanche ?",
  "Avez-vous pu mettre vos chaussettes, collants ou bas ?",
  "Avez-vous pu faire vos courses ?",
  "Pendant combien de temps avez-vous pu marcher avant que la douleur dans votre hanche ne devienne sévère ?",
  "Avez-vous pu monter un escalier ?",
  "Après un repas (assis à table), à quel point avez-vous eu des difficultés à vous lever de votre chaise à cause de votre hanche ?",
  "Avez-vous boité en marchant à cause de votre hanche ?",
  "Avez-vous eu une douleur soudaine ou des élancements dans la hanche affectée ?",
  "À quel point votre hanche vous a-t-elle gêné dans votre travail ?",
  "Avez-vous été troublé par la douleur de votre hanche au lit la nuit ?"
];

const oxfordKneeQuestions = [
  "Comment décririez-vous la douleur que vous ressentez habituellement dans votre genou ?",
  "Avez-vous eu des difficultés à vous laver et à vous sécher à cause de votre genou ?",
  "Avez-vous eu des difficultés à entrer et sortir d'une voiture ou à utiliser les transports publics à cause de votre genou ?",
  "Pendant combien de temps avez-vous pu marcher avant que la douleur dans votre genou ne devienne sévère ?",
  "Après un repas (assis à table), à quel point avez-vous eu des difficultés à vous lever de votre chaise à cause de votre genou ?",
  "Avez-vous boité en marchant à cause de votre genou ?",
  "Avez-vous pu vous agenouiller et vous relever ensuite ?",
  "Avez-vous été troublé par la douleur de votre genou au lit la nuit ?",
  "À quel point votre genou vous a-t-il gêné dans votre travail ?",
  "Avez-vous ressenti que votre genou pourrait soudainement 'lâcher' ou vous faire défaut ?",
  "Avez-vous pu faire vos courses ?",
  "Avez-vous pu descendre un escalier ?"
];

const womacQuestions = [
  // Douleur (5 questions)
  "Douleur en marchant sur terrain plat",
  "Douleur en montant ou descendant les escaliers",
  "Douleur la nuit au lit",
  "Douleur en position assise ou allongée",
  "Douleur en restant debout",
  // Raideur (2 questions)
  "Raideur matinale",
  "Raideur après être resté assis, allongé ou au repos",
  // Fonction physique (17 questions)
  "Descendre les escaliers",
  "Monter les escaliers",
  "Se lever d'une position assise",
  "Rester debout",
  "Se pencher vers le sol",
  "Marcher sur terrain plat",
  "Entrer et sortir d'une voiture",
  "Faire ses courses",
  "Enfiler ses chaussettes",
  "Se lever du lit",
  "Enlever ses chaussettes",
  "Rester allongé dans le lit",
  "Entrer et sortir du bain",
  "Rester assis",
  "S'asseoir et se lever des toilettes",
  "Faire le ménage lourd",
  "Faire le ménage léger"
];

export default function RAACProms() {
  const [userType, setUserType] = useState<'admin' | 'patient' | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireType, setQuestionnaireType] = useState<'oxford_hip' | 'oxford_knee' | 'womac'>('oxford_hip');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<{ [key: string]: number }>({});

  // Check URL parameters for patient access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const patientParam = urlParams.get('patient');
    const tokenParam = urlParams.get('token');
    
    if (patientParam && tokenParam) {
      setUserType('patient');
      // In real app, validate token and load patient data
      setSelectedPatient(mockPatients[0]);
    }
  }, []);

  const handleLogin = (type: 'admin' | 'patient') => {
    setUserType(type);
    if (type === 'patient') {
      setSelectedPatient(mockPatients[0]);
    }
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birth = new Date(dateNaissance);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getScoreEvolution = (patient: Patient) => {
    return patient.scores.map(score => ({
      timepoint: score.timepoint,
      score: score.scoreTotal,
      date: score.dateCompletion
    }));
  };

  const startQuestionnaire = (type: 'oxford_hip' | 'oxford_knee' | 'womac') => {
    setQuestionnaireType(type);
    setCurrentQuestionIndex(0);
    setQuestionnaireResponses({});
    setShowQuestionnaire(true);
  };

  const handleQuestionResponse = (response: number) => {
    const newResponses = {
      ...questionnaireResponses,
      [currentQuestionIndex]: response
    };
    setQuestionnaireResponses(newResponses);

    const questions = questionnaireType === 'oxford_hip' ? oxfordHipQuestions :
                    questionnaireType === 'oxford_knee' ? oxfordKneeQuestions : womacQuestions;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Questionnaire terminé
      const totalScore = Object.values(newResponses).reduce((sum, val) => sum + val, 0);
      alert(`Questionnaire terminé! Score total: ${totalScore}`);
      setShowQuestionnaire(false);
    }
  };

  const getCurrentQuestions = () => {
    switch (questionnaireType) {
      case 'oxford_hip': return oxfordHipQuestions;
      case 'oxford_knee': return oxfordKneeQuestions;
      case 'womac': return womacQuestions;
      default: return [];
    }
  };

  // Login Screen
  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Head>
          <title>RAAC PROMs - Connexion | Polyclinique Côte Basque Sud</title>
          <meta name="description" content="Système de suivi des Patient Reported Outcome Measures - Polyclinique Côte Basque Sud" />
        </Head>
        
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <img 
                  src="/POLYCLINIQUE-COTE-BASQUE-SUD-ICONE.png" 
                  alt="Polyclinique Côte Basque Sud" 
                  className="h-16 mx-auto mb-4"
                />
                <h1 className="text-2xl font-bold text-pcbs mb-2">RAAC PROMs</h1>
                <p className="text-gray-600">Système de suivi patient</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleLogin('admin')}
                  className="w-full btn-pcbs flex items-center justify-center gap-3"
                >
                  <Settings className="w-5 h-5" />
                  Accès Équipe Médicale
                </button>
                
                <button
                  onClick={() => handleLogin('patient')}
                  className="w-full btn-pcbs-secondary flex items-center justify-center gap-3"
                >
                  <User className="w-5 h-5" />
                  Portail Patient
                </button>
              </div>

              <div className="mt-8 text-center text-sm text-gray-500">
                <p>Polyclinique Côte Basque Sud</p>
                <p>Système sécurisé RGPD</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questionnaire View
  if (showQuestionnaire) {
    const questions = getCurrentQuestions();
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Questionnaire {questionnaireType.toUpperCase()} | RAAC PROMs</title>
        </Head>

        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/POLYCLINIQUE-COTE-BASQUE-SUD-ICONE.png" alt="PCBS" className="h-8" />
                <h1 className="text-xl font-semibold text-pcbs">
                  Questionnaire {questionnaireType.replace('_', ' ').toUpperCase()}
                </h1>
              </div>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-pcbs">
                  Question {currentQuestionIndex + 1} sur {questions.length}
                </span>
                <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-pcbs h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                {currentQuestion}
              </h2>

              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuestionResponse(value)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-pcbs hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                      <span>
                        {value === 0 && "Aucun problème"}
                        {value === 1 && "Problème léger"}
                        {value === 2 && "Problème modéré"}
                        {value === 3 && "Problème sévère"}
                        {value === 4 && "Problème extrême"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn-pcbs-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setShowQuestionnaire(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Sauvegarder et quitter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (userType === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>RAAC PROMs - Administration | Polyclinique Côte Basque Sud</title>
        </Head>

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <img src="/POLYCLINIQUE-COTE-BASQUE-SUD-ICONE.png" alt="PCBS" className="h-8" />
                <h1 className="text-xl font-semibold text-pcbs">RAAC PROMs - Administration</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Équipe médicale</span>
                <button
                  onClick={() => setUserType(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
                { id: 'patients', label: 'Patients', icon: User },
                { id: 'questionnaires', label: 'Questionnaires', icon: FileText },
                { id: 'rappels', label: 'Rappels', icon: Calendar },
                { id: 'statistiques', label: 'Statistiques', icon: BarChart3 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentView === id 
                      ? 'bg-pcbs text-white' 
                      : 'text-gray-600 hover:text-pcbs hover:bg-blue-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card-pcbs p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Patients actifs</p>
                      <p className="text-2xl font-bold text-pcbs">{patients.filter(p => p.statut === 'actif').length}</p>
                    </div>
                    <User className="w-8 h-8 text-pcbs-secondary" />
                  </div>
                </div>

                <div className="card-pcbs p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Questionnaires complétés</p>
                      <p className="text-2xl font-bold text-pcbs">
                        {patients.reduce((sum, p) => sum + p.scores.filter(s => s.statut === 'complete').length, 0)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="card-pcbs p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rappels programmés</p>
                      <p className="text-2xl font-bold text-pcbs">12</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </div>

                <div className="card-pcbs p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de complétude</p>
                      <p className="text-2xl font-bold text-pcbs">87%</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-pcbs p-6">
                  <h3 className="text-lg font-semibold text-pcbs mb-4">Évolution des scores moyens</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { timepoint: 'Pré-op', oxford: 25, womac: 45 },
                      { timepoint: '6 sem', oxford: 32, womac: 35 },
                      { timepoint: '3 mois', oxford: 38, womac: 25 },
                      { timepoint: '6 mois', oxford: 42, womac: 18 },
                      { timepoint: '1 an', oxford: 45, womac: 12 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timepoint" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="oxford" stroke="#004d71" strokeWidth={2} />
                      <Line type="monotone" dataKey="womac" stroke="#f08486" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-pcbs p-6">
                  <h3 className="text-lg font-semibold text-pcbs mb-4">Patients récents</h3>
                  <div className="space-y-3">
                    {patients.slice(0, 5).map(patient => (
                      <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{patient.prenom} {patient.nom}</p>
                          <p className="text-sm text-gray-600">
                            {patient.typeChirurgie} {patient.coteChirurgie} - {patient.chirurgien}
                          </p>
                        </div>
                        <span className={`badge-${patient.statut === 'actif' ? 'success' : 'warning'}`}>
                          {patient.statut}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Patients View */}
          {currentView === 'patients' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-pcbs">Gestion des patients</h2>
                <button
                  onClick={() => setShowAddPatient(true)}
                  className="btn-pcbs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau patient
                </button>
              </div>

              <div className="card-pcbs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="pcbs-table">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chirurgie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Chirurgien
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scores
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patients.map(patient => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {patient.prenom} {patient.nom}
                              </div>
                              <div className="text-sm text-gray-500">
                                {calculateAge(patient.dateNaissance)} ans - {patient.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {patient.typeChirurgie} {patient.coteChirurgie}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(patient.dateChirurgie).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.chirurgien}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {patient.scores.filter(s => s.statut === 'complete').length} complétés
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`badge-${patient.statut === 'actif' ? 'success' : 'warning'}`}>
                              {patient.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedPatient(patient)}
                                className="text-pcbs hover:text-blue-700"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Statistics View */}
          {currentView === 'statistiques' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-pcbs">Statistiques médicales</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-pcbs p-6">
                  <h3 className="text-lg font-semibold text-pcbs mb-4">Scores moyens par timepoint</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { timepoint: 'Pré-op', oxford: 25, womac: 45 },
                      { timepoint: '6 semaines', oxford: 32, womac: 35 },
                      { timepoint: '3 mois', oxford: 38, womac: 25 },
                      { timepoint: '6 mois', oxford: 42, womac: 18 },
                      { timepoint: '1 an', oxford: 45, womac: 12 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timepoint" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="oxford" fill="#004d71" name="Oxford Score" />
                      <Bar dataKey="womac" fill="#f08486" name="WOMAC Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-pcbs p-6">
                  <h3 className="text-lg font-semibold text-pcbs mb-4">Répartition par type de chirurgie</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Chirurgie de hanche</span>
                      <span className="font-semibold">
                        {patients.filter(p => p.typeChirurgie === 'hanche').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Chirurgie de genou</span>
                      <span className="font-semibold">
                        {patients.filter(p => p.typeChirurgie === 'genou').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-pcbs p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-pcbs">Export des données</h3>
                  <button className="btn-pcbs flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exporter CSV
                  </button>
                </div>
                <p className="text-gray-600">
                  Exportez toutes les données patient et scores pour analyses statistiques externes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Patient Portal
  if (userType === 'patient' && selectedPatient) {
    const evolutionData = getScoreEvolution(selectedPatient);

    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Mon suivi RAAC | {selectedPatient.prenom} {selectedPatient.nom}</title>
        </Head>

        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <img src="/POLYCLINIQUE-COTE-BASQUE-SUD-ICONE.png" alt="PCBS" className="h-8" />
                <h1 className="text-xl font-semibold text-pcbs">Mon suivi RAAC</h1>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {selectedPatient.prenom} {selectedPatient.nom}
                </span>
                <button
                  onClick={() => setUserType(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Patient Info */}
          <div className="card-pcbs p-6 mb-6">
            <h2 className="text-xl font-semibold text-pcbs mb-4">Informations de suivi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Type de chirurgie</p>
                <p className="font-semibold capitalize">
                  {selectedPatient.typeChirurgie} {selectedPatient.coteChirurgie}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date d'intervention</p>
                <p className="font-semibold">
                  {new Date(selectedPatient.dateChirurgie).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Chirurgien</p>
                <p className="font-semibold">{selectedPatient.chirurgien}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut du suivi</p>
                <span className={`badge-${selectedPatient.statut === 'actif' ? 'success' : 'warning'}`}>
                  {selectedPatient.statut}
                </span>
              </div>
            </div>
          </div>

          {/* Questionnaires disponibles */}
          <div className="card-pcbs p-6 mb-6">
            <h3 className="text-lg font-semibold text-pcbs mb-4">Questionnaires disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => startQuestionnaire(selectedPatient.typeChirurgie === 'hanche' ? 'oxford_hip' : 'oxford_knee')}
                className="p-4 border border-gray-200 rounded-lg hover:border-pcbs hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-pcbs" />
                  <span className="font-medium">Oxford Score</span>
                </div>
                <p className="text-sm text-gray-600">
                  Questionnaire spécifique {selectedPatient.typeChirurgie}
                </p>
              </button>

              <button
                onClick={() => startQuestionnaire('womac')}
                className="p-4 border border-gray-200 rounded-lg hover:border-pcbs hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-pcbs" />
                  <span className="font-medium">WOMAC</span>
                </div>
                <p className="text-sm text-gray-600">
                  Évaluation fonctionnelle complète
                </p>
              </button>

              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-700">Complétés</span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPatient.scores.filter(s => s.statut === 'complete').length} questionnaires
                </p>
              </div>
            </div>
          </div>

          {/* Évolution des scores */}
          {evolutionData.length > 0 && (
            <div className="card-pcbs p-6">
              <h3 className="text-lg font-semibold text-pcbs mb-4">Mon évolution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timepoint" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#004d71" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-gray-600">
                <p>Votre progression est suivie par l'équipe médicale pour optimiser votre récupération.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}