import { useState } from 'react';
import { X, Search, Trash2, Users, MessageSquare, RotateCcw } from 'lucide-react';
import { usePatients } from '../../contexts/PatientContext';
import { useChat } from '../../contexts/ChatContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: () => void;
}

export function Sidebar({ isOpen, onClose, onAddPatient }: SidebarProps) {
  const { patients, selectedPatientId, setSelectedPatientId, deletePatient, loadDemoData, resetAllData } = usePatients();
  const { sessions, switchSession, deleteSession } = useChat();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'patients' | 'chats'>('patients');
  const [confirmReset, setConfirmReset] = useState(false);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'chats') return matchesSearch && !s.patientId;
    return matchesSearch;
  });

  const handlePatientClick = (patientId: string) => {
    setSelectedPatientId(patientId === selectedPatientId ? null : patientId);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-[56px] left-0 bottom-0 z-40 w-[280px] bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-3 md:hidden border-b border-surface-100 dark:border-surface-800">
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-surface-100 dark:border-surface-800">
          <button
            onClick={() => setActiveTab('patients')}
            className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'patients'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1.5" />
            Patients
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-3 text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'chats'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5" />
            Chats
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder={activeTab === 'patients' ? 'Search patients...' : 'Search chats...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border-0 focus:ring-2 focus:ring-primary-500 outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {activeTab === 'patients' ? (
            <>
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-surface-500 text-sm">
                  {patients.length === 0 ? 'No patients yet' : 'No matching patients'}
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`w-full text-left p-3 rounded-lg transition-colors group min-h-[48px] cursor-pointer ${
                      selectedPatientId === patient.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                        : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                    }`}
                    onClick={() => handlePatientClick(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                          {patient.name}
                        </div>
                        <div className="text-xs text-surface-500 mt-0.5">
                          {patient.age}{patient.gender ? ` · ${patient.gender}` : ''} · {patient.prakriti}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatient(patient.id);
                        }}
                        className="p-2 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-surface-500 text-sm">
                  {sessions.length === 0 ? 'No chats yet' : 'No matching chats'}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="w-full text-left p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors group cursor-pointer min-h-[48px]"
                    onClick={() => {
                      switchSession(session.id);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-surface-900 dark:text-white truncate">
                          {session.title}
                        </div>
                        <div className="text-xs text-surface-500 mt-0.5">
                          {session.messages.length} messages
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="p-2 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-surface-100 dark:border-surface-800 space-y-2">
          <button
            onClick={onAddPatient}
            className="w-full py-2.5 px-4 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors min-h-[44px]"
          >
            + Add Patient
          </button>

          {patients.length === 0 ? (
            <button
              onClick={loadDemoData}
              className="w-full py-2 px-4 rounded-lg text-surface-600 dark:text-surface-400 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors min-h-[44px]"
            >
              Load Demo Cases
            </button>
          ) : (
            !confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 px-4 rounded-lg text-surface-500 text-xs hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3 h-3 inline mr-1" />
                Reset All Data
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetAllData();
                    setConfirmReset(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors min-h-[44px]"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2 px-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 text-xs hover:bg-surface-200 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            )
          )}
        </div>
      </aside>
    </>
  );
}
