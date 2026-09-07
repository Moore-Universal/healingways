'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Loader2 } from 'lucide-react';
import { getAllCasesForAdmin, updatePatientCase, PatientCase } from '@/app/lib/firebase/services';

interface Task {
  id: string;
  caseDbId: string;
  title: string;
  isAuto?: boolean;
  patientName: string;
  caseId: string;
  dueDate: string;
  completed: boolean;
}

type FilterTab = 'All' | 'Open' | 'Done';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const loadTasksFromDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const cases = await getAllCasesForAdmin();
      const loaded: Task[] = [];

      cases.forEach((c) => {
        if (c.tasks && c.tasks.length > 0) {
          c.tasks.forEach((t, i) => {
            loaded.push({
              id: t.id || `${c.id}-task-${i}`,
              caseDbId: c.id,
              title: t.title,
              isAuto: t.auto_generated !== false,
              patientName: c.patient_name || 'Patient',
              caseId: c.case_number || c.id,
              dueDate: t.due_date || 'Due Soon',
              completed: t.status === 'completed',
            });
          });
        } else {
          // Dynamic initial task for this real database case
          loaded.push({
            id: `${c.id}-task-review`,
            caseDbId: c.id,
            title: `Begin case review & coordination for ${c.need || 'General Consultation'}`,
            isAuto: true,
            patientName: c.patient_name || 'Patient',
            caseId: c.case_number || c.id,
            dueDate: 'Due Soon',
            completed: c.status !== 'New' && c.workflow_stage !== 'Consultation Submitted',
          });
        }
      });

      setTasks(loaded);
    } catch (err) {
      console.error('Error loading tasks from database:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasksFromDatabase();
  }, [loadTasksFromDatabase]);

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t))
    );

    // Sync to database if possible
    try {
      const targetCase = (await getAllCasesForAdmin()).find((c) => c.id === task.caseDbId);
      if (targetCase && targetCase.tasks) {
        const updatedTasks = targetCase.tasks.map((t) =>
          t.id === taskId || t.title === task.title
            ? { ...t, status: (newCompleted ? 'completed' : 'open') as 'completed' | 'open' }
            : t
        );
        await updatePatientCase(task.caseDbId, { tasks: updatedTasks });
      }
    } catch (err) {
      console.error('Error syncing task status:', err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'Open') return !task.completed;
    if (activeTab === 'Done') return task.completed;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 min-w-0">
      {/* Title Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]">Tasks</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Everything your team needs to action, across every case.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['All', 'Open', 'Done'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-[#1E3A8A] text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-400 text-xs sm:text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
            <span>Loading tasks from database...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center text-slate-400 text-xs sm:text-sm">
            No tasks found in this section. Tasks are created automatically from active patient cases in the database.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 transition-all hover:shadow-md min-w-0"
            >
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(task.id)}
                  className="mt-1 h-4 w-4 sm:h-5 sm:w-5 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-[#2563EB]"
                />

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-xs sm:text-sm font-semibold transition-all break-words ${
                        task.completed
                          ? 'line-through text-slate-400 font-normal'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>

                    {task.isAuto && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 shrink-0">
                        <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        Auto
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                    {task.patientName} &middot; {task.caseId} &middot; {task.dueDate}
                  </p>
                </div>
              </div>

              <Link
                href={`/admin/cases/${task.caseDbId}`}
                className="text-xs font-bold text-[#1E3A8A] hover:underline shrink-0 self-end sm:self-start sm:mt-0.5 pl-7 sm:pl-0"
              >
                Open Case &rarr;
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}