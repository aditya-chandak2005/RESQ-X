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

  async getQuickReview(disasterId: number = 1, reviewType: string = 'executive'): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/quick-review/${disasterId}?review_type=${reviewType}`);
    if (!res.ok) throw new Error('Failed to fetch quick review');
    return res.json();
  },

  async getDisasterKnowledge(): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/disaster-knowledge`);
    if (!res.ok) throw new Error('Failed to fetch disaster knowledge catalog');
    return res.json();
  },

  async getDisasterKnowledgeDetail(topic: string): Promise<any> {
    const res = await fetch(`${API_BASE}/copilot/disaster-knowledge/${topic}`);
    if (!res.ok) throw new Error(`Failed to fetch disaster knowledge for ${topic}`);
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
  },

  async assessLocation(params: { latitude: number; longitude: number; disaster_id?: number; location_label?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/intelligence/assess-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to assess location');
    return res.json();
  },

  async geocode(query: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/intelligence/geocode?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Geocoding failed');
    return res.json();
  },

  async getAlerts(disasterId?: number, alertLevel?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (disasterId) params.append('disaster_id', disasterId.toString());
    if (alertLevel) params.append('alert_level', alertLevel);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch official alerts');
    return res.json();
  },

  async getNews(disasterId?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (disasterId) params.append('disaster_id', disasterId.toString());
    const res = await fetch(`${API_BASE}/news?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch disaster news');
    return res.json();
  },

  async syncAlerts(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/alerts/sync?disaster_id=${disasterId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync alerts');
    return res.json();
  },

  async syncNews(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/news/sync?disaster_id=${disasterId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to sync news');
    return res.json();
  },

  async getKnowledgeDocuments(category?: string): Promise<any[]> {
    const url = category ? `${API_BASE}/knowledge?category=${encodeURIComponent(category)}` : `${API_BASE}/knowledge`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch knowledge documents');
    return res.json();
  },

  async queryKnowledgeRag(query: string, topK: number = 3): Promise<any> {
    const res = await fetch(`${API_BASE}/knowledge/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK }),
    });
    if (!res.ok) throw new Error('Failed to query knowledge RAG');
    return res.json();
  },

  async getValidationBenchmark(disasterId: number = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/validation/benchmark?disaster_id=${disasterId}`);
    if (!res.ok) throw new Error('Failed to fetch validation benchmark');
    return res.json();
  },

  getSituationReportPdfUrl(disasterId: number = 1): string {
    return `${API_BASE}/reports/${disasterId}/pdf`;
  }
};

