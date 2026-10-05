import {
  DisasterEvent,
  DashboardKpis,
  FloodResult,
  Settlement,
  Bridge,
  RoadSegment,
  InfrastructureAsset,
  RescuePriority,
  RescueTeam,
  Mission,
  Resource,
} from '../types';

const API_BASE = '/api';

export const api = {
  async getDisasters(): Promise<DisasterEvent[]> {
    const res = await fetch(`${API_BASE}/disasters`);
    if (!res.ok) throw new Error('Failed to fetch disasters');
    return res.json();
  },

  async getKpis(disasterId: number = 1): Promise<DashboardKpis> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/kpis`);
    if (!res.ok) throw new Error('Failed to fetch KPIs');
    return res.json();
  },

  async getFloodResult(disasterId: number = 1): Promise<FloodResult> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/flood`);
    if (!res.ok) throw new Error('Failed to fetch flood result');
    return res.json();
  },

  async getSettlements(disasterId: number = 1): Promise<Settlement[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/settlements`);
    if (!res.ok) throw new Error('Failed to fetch settlements');
    return res.json();
  },

  async getDamage(disasterId: number = 1): Promise<{
    assets: InfrastructureAsset[];
    bridges: Bridge[];
    roads: RoadSegment[];
  }> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/damage`);
    if (!res.ok) throw new Error('Failed to fetch damage overview');
    return res.json();
  },

  async getPriorities(disasterId: number = 1): Promise<RescuePriority[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/priority`);
    if (!res.ok) throw new Error('Failed to fetch rescue priorities');
    return res.json();
  },

  async getResources(disasterId: number = 1): Promise<Resource[]> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/resources`);
    if (!res.ok) throw new Error('Failed to fetch resources');
    return res.json();
  },

  async getTeams(disasterId: number = 1): Promise<RescueTeam[]> {
    const res = await fetch(`${API_BASE}/missions/teams?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  async getMissions(disasterId: number = 1): Promise<Mission[]> {
    const res = await fetch(`${API_BASE}/missions?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch missions');
    return res.json();
  },

  async analyzeDisaster(disasterId: number = 1, params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/disasters/${disasterId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run disaster pipeline');
    return res.json();
  },

  async submitFieldReport(reportData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/missions/field-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) throw new Error('Failed to submit field report');
    return res.json();
  },

  async runSimulation(simulationData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/simulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(simulationData),
    });
    if (!res.ok) throw new Error('Failed to run scenario simulation');
    return res.json();
  },

  async queryCopilot(query: string, disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, disaster_id: disasterId }),
    });
    if (!res.ok) throw new Error('Copilot query failed');
    return res.json();
  },

  async getSituationReport(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/reports/${disasterId}`);
    if (!res.ok) throw new Error('Failed to generate situation report');
    return res.json();
  },

  async getVulnerability(): Promise<any> {
    const res = await fetch(`${API_BASE}/vulnerability`);
    if (!res.ok) throw new Error('Failed to get vulnerability index');
    return res.json();
  },

  async getFloodPath(params: any): Promise<any> {
    const res = await fetch(`${API_BASE}/flood-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate downstream flood path');
    return res.json();
  }
};
