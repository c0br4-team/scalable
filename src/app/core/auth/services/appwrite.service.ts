import { Injectable } from '@angular/core';
import { Account, Client } from 'appwrite';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppwriteService {
  private client: Client;
  private account: Account;

  constructor() {
    this.client = new Client()
      .setEndpoint(environment.appwrite.endpoint)
      .setProject(environment.appwrite.projectId);

    this.account = new Account(this.client);
  }

  async createSession(email: string, password: string): Promise<void> {
    await this.account.createEmailPasswordSession(email, password);
  }

  async createJWT(): Promise<string> {
    const response = await this.account.createJWT();
    return response.jwt;
  }

  async deleteSession(): Promise<void> {
    await this.account.deleteSession('current');
  }
}
