import { useState, useCallback } from 'react';

export interface Violation {
  type: 'multiple_faces' | 'face_absent' | 'looking_away' | 'suspicious_movement';
  timestamp: number;
  confidence: number;
  description: string;
  roomId?: string;
  participantId?: string;
}

export function useViolationTracker(roomId?: string, participantId?: string) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [totalViolations, setTotalViolations] = useState(0);

  const addViolation = useCallback((violation: Omit<Violation, 'roomId' | 'participantId'>) => {
    const fullViolation: Violation = {
      ...violation,
      roomId,
      participantId
    };

    setViolations(prev => [...prev.slice(-19), fullViolation]); // Keep last 20
    setTotalViolations(prev => prev + 1);

    // Send to server if needed
    if (roomId && participantId) {
      fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullViolation)
      }).catch(console.error);
    }
  }, [roomId, participantId]);

  const getViolationSummary = useCallback(() => {
    const recent = violations.filter(v => Date.now() - v.timestamp < 300000); // Last 5 minutes
    const byType = recent.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalViolations,
      recent: recent.length,
      byType,
      riskLevel: recent.length > 5 ? 'high' : recent.length > 2 ? 'medium' : 'low'
    };
  }, [violations, totalViolations]);

  const clearViolations = useCallback(() => {
    setViolations([]);
    setTotalViolations(0);
  }, []);

  return {
    violations,
    totalViolations,
    addViolation,
    getViolationSummary,
    clearViolations
  };
}