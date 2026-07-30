import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Input } from '../components/Input';

interface ActivityItem {
  type: 'document' | 'scan' | 'update';
  title: string;
  description: string;
  created_at: string;
}

export const Records: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'document' | 'scan' | 'update'>('all');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const response = await fetch('/api/activities', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setActivities(data);
        }
      } catch (err) {
        console.error('Failed to fetch timeline activities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const filteredRecords = activities.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ? true : item.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getDotBorderColor = (type: string) => {
    switch (type) {
      case 'document': return 'border-primary';
      case 'scan': return 'border-amber-500';
      case 'update': return 'border-slate-500';
      default: return 'border-outline';
    }
  };

  const getDotTextColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-primary';
      case 'scan': return 'text-amber-600';
      case 'update': return 'text-slate-600';
      default: return 'text-outline';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'document': return 'Document';
      case 'scan': return 'Scan Event';
      case 'update': return 'Profile Update';
      default: return '';
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'document': return 'bg-primary/10 text-primary';
      case 'scan': return 'bg-amber-500/10 text-amber-800';
      case 'update': return 'bg-slate-500/10 text-slate-800';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'document': return 'description';
      case 'scan': return 'qr_code_scanner';
      case 'update': return 'manage_accounts';
      default: return 'info';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="font-label-caps text-xs text-on-surface-variant/70 tracking-widest block mb-1">Timeline</span>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold">Records &amp; History</h1>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon="search"
        />

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'scan', label: 'Scans' },
            { id: 'document', label: 'Documents' },
            { id: 'update', label: 'Updates' }
          ].map((chip) => {
            const isActive = filter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFilter(chip.id as 'all' | 'document' | 'scan' | 'update')}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/30 hover:bg-surface-variant'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline list */}
      <div className="relative pl-6 md:pl-8 mt-6">
        {/* Vertical background line */}
        <div className="absolute left-6 md:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent z-0 transform -translate-x-1/2" />

        {loading ? (
          <div className="py-8 text-center text-outline-variant font-medium text-sm">
            Loading timeline history...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-on-surface-variant font-medium text-sm">
            No records match your filters.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRecords.map((item, idx) => (
              <div key={idx} className="relative flex gap-4 group z-10">
                {/* Bullet node */}
                <div className={`w-10 h-10 rounded-full bg-white border-2 ${getDotBorderColor(item.type)} ${getDotTextColor(item.type)} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                  <span className="material-symbols-outlined text-[18px] filled-icon">{getIconName(item.type)}</span>
                </div>

                {/* Glass Card content */}
                <GlassCard className="flex-grow p-5 hover:bg-white/95 border border-white/60 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
                    <h3 className="font-semibold text-sm text-on-surface">{item.title}</h3>
                    <span className="text-xs text-on-surface-variant/70 font-mono">{formatDateTime(item.created_at)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{item.description}</p>
                  <span className={`inline-block px-2.5 py-1 rounded font-semibold text-[9px] uppercase tracking-wide ${getTypeStyle(item.type)}`}>
                    {getTypeLabel(item.type)}
                  </span>
                </GlassCard>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
