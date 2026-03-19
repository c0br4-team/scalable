import { Injectable } from '@angular/core';
import { Account, Client, Models } from 'appwrite';
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
    await this.account.deleteSession({ sessionId: 'current' }).catch(() => {});
    await this.account.createEmailPasswordSession({ email, password });
  }

  async createJWT(): Promise<string> {
    const response = await this.account.createJWT();
    return response.jwt;
  }

  async deleteSession(): Promise<void> {
    await this.account.deleteSession({ sessionId: 'current' });
  }

  async getAccount(): Promise<Models.User<Models.Preferences> | null> {
    return this.account.get().catch(() => null);
  }

  async sendPasswordRecovery(email: string, url: string): Promise<void> {
    await this.account.createRecovery({ email, url });
  }

  async updateRecovery(userId: string, secret: string, password: string): Promise<void> {
    await this.account.updateRecovery({ userId, secret, password });
  }
}
