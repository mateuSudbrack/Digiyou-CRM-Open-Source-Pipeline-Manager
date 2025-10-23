
class CrmService {
  private baseUrl = '/api';
  private companyId: string | null = null;

  setCompanyId(id: string) {
    this.companyId = id;
  }

  private async request(method: string, path: string, data?: any) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.companyId) {
      headers['X-Company-ID'] = this.companyId;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Something went wrong');
    }
    return response.json();
  }

  async getCrmData(): Promise<any> {
    return this.request('GET', '/data');
  }

  async createPipeline(name: string): Promise<any> {
    return this.request('POST', '/pipelines', { name });
  }

  async updatePipeline(id: string, name: string): Promise<any> {
    return this.request('PUT', `/pipelines/${id}`, { name });
  }

  async deletePipeline(id: string): Promise<any> {
    return this.request('DELETE', `/pipelines/${id}`);
  }

  async createStage(pipelineId: string, name: string): Promise<any> {
    return this.request('POST', `/pipelines/${pipelineId}/stages`, { name });
  }

  async updateStage(pipelineId: string, stageId: string, name: string): Promise<any> {
    return this.request('PUT', `/pipelines/${pipelineId}/stages/${stageId}`, { name });
  }

  async deleteStage(pipelineId: string, stageId: string): Promise<any> {
    return this.request('DELETE', `/stages/${stageId}`);
  }

  async createDeal(deal: any): Promise<any> {
    return this.request('POST', '/deals', deal);
  }

  async updateDeal(id: string, deal: any): Promise<any> {
    return this.request('PUT', `/deals/${id}`, deal);
  }

  async deleteDeal(id: string): Promise<any> {
    return this.request('DELETE', `/deals/${id}`);
  }

  async createContact(contact: any): Promise<any> {
    return this.request('POST', '/contacts', contact);
  }

  async updateContact(id: string, contact: any): Promise<any> {
    return this.request('PUT', `/contacts/${id}`, contact);
  }

  async deleteContact(id: string): Promise<any> {
    return this.request('DELETE', `/contacts/${id}`);
  }

  async bulkDeleteDeals(dealIds: string[]): Promise<any> {
    return this.request('DELETE', '/deals/bulk', { ids: dealIds });
  }

  async updateWebhookUrl(url: string): Promise<any> {
    return this.request('POST', '/settings/webhook', { url });
  }

  async createCustomFieldDefinition(name: string): Promise<any> {
    return this.request('POST', '/settings/custom-fields', { name });
  }

  async updateCustomFieldDefinition(id: string, data: any): Promise<any> {
    return this.request('PUT', `/settings/custom-fields/${id}`, data);
  }

  async deleteCustomFieldDefinition(id: string): Promise<any> {
    return this.request('DELETE', `/settings/custom-fields/${id}`);
  }

  async createContactCustomFieldDefinition(name: string): Promise<any> {
    return this.request('POST', '/settings/contact-custom-fields', { name });
  }

  async updateContactCustomFieldDefinition(id: string, data: any): Promise<any> {
    return this.request('PUT', `/settings/contact-custom-fields/${id}`, data);
  }

  async deleteContactCustomFieldDefinition(id: string): Promise<any> {
    return this.request('DELETE', `/settings/contact-custom-fields/${id}`);
  }

  async createUser(username: string, password: string): Promise<any> {
    return this.request('POST', '/users', { username, password });
  }

  async deleteUser(username: string): Promise<any> {
    return this.request('DELETE', `/users/${username}`);
  }

  async testSmtpConnection(config: any, testEmail: string): Promise<any> {
    return this.request('POST', '/settings/smtp/test', { config, testEmail });
  }

  async updateSmtpConfig(config: any): Promise<any> {
    return this.request('POST', '/settings/smtp', config);
  }

  async saveEvolutionConfig(apiUrl: string, apiKey: string, companyId: string): Promise<any> {
    return this.request('POST', '/settings/evolution', { apiUrl, apiKey, companyId });
  }

  async getEvolutionStatus(): Promise<any> {
    return this.request('GET', '/evolution/status');
  }

  async createEvolutionInstance(instanceName: string, generateQrCode: boolean, companyId: string): Promise<any> {
    return this.request('POST', '/evolution/instance', { instanceName, generateQrCode, companyId });
  }

  async getEvolutionConnection(): Promise<any> {
    return this.request('GET', '/evolution/connect');
  }

  async deleteEvolutionInstance(): Promise<any> {
    return this.request('DELETE', '/evolution/instance');
  }

  async getContacts(searchTerm?: string, filterBy?: string, filterValue?: string): Promise<any> {
    let path = '/contacts';
    const params = new URLSearchParams();
    if (searchTerm) {
      params.append('searchTerm', searchTerm);
    }
    if (filterBy && filterValue) {
      params.append('filterBy', filterBy);
      params.append('filterValue', filterValue);
    }
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    return this.request('GET', path);
  }
}

export const crmService = new CrmService();
