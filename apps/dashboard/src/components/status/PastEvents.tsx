"use client";

import { useEffect, useState } from "react";
import { Clock, Zap, Activity, AlertCircle } from "lucide-react";
import { Card } from "../ui/card";
import { motion } from "framer-motion";

export function PastEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetching alchemist log and pipeline status to construct a timeline
        const alchRes = await fetch("http://localhost:8000/governance/alchemist-actions");
        const alchData = await alchRes.json();
        
        const timeline = alchData.map((e: any) => ({
          id: e.timestamp,
          time: new Date(e.timestamp).toLocaleTimeString(),
          type: "Healing",
          title: "Autonomous Remediation",
          description: `Alchemist synthesized ${e.row_count} rows with ${e.diversity_score.toFixed(2)} diversity.`,
          icon: <Zap className="w-4 h-4 text-orange-500" />
        }));

        setEvents(timeline);
      } catch (e) {
        console.error(e);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-heading tracking-tight text-gray-900">System History</h2>
        <p className="text-gray-500 mt-2">Audit trail of all autonomous actions in the last 24 hours.</p>
      </div>

      <div className="relative border-l-2 border-gray-100 ml-4 pl-8 space-y-8">
        {events.length > 0 ? events.map((event, i) => (
          <motion.div 
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative"
          >
            <div className="absolute -left-[41px] top-0 bg-white p-1 rounded-full border-2 border-gray-100">
                {event.icon}
            </div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.time}</span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">{event.type}</span>
            </div>
            <h4 className="font-bold text-gray-900">{event.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
          </motion.div>
        )) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500 font-medium">No system events in the last 24 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
}
