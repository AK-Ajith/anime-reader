import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';

const USERS_KEY = 'anime-reader-users';
const SESSION_KEY = 'anime-reader-session';
const DEMO_USER: User = {
  displayName: 'Reader',
  email: 'demo@reader.app',
  password: 'demo123'
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  private readonly users = signal<User[]>(this.getInitialUsers());
  private readonly sessionUser = signal<User | null>(this.storage.getItem<User | null>(SESSION_KEY, null));

  readonly currentUser = computed(() => this.sessionUser());
  readonly isAuthenticated = computed(() => !!this.sessionUser());

  signup(payload: User): { success: boolean; message: string } {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const exists = this.users().some((user) => user.email.toLowerCase() === normalizedEmail);

    if (exists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser = {
      ...payload,
      email: normalizedEmail,
      displayName: payload.displayName.trim()
    };

    const updatedUsers = [...this.users(), newUser];
    this.users.set(updatedUsers);
    this.storage.setItem(USERS_KEY, updatedUsers);
    this.setSession(newUser);

    return { success: true, message: 'Account created successfully.' };
  }

  login(email: string, password: string): { success: boolean; message: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users().find(
      (storedUser) => storedUser.email.toLowerCase() === normalizedEmail && storedUser.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid email or password.' };
    }

    this.setSession(user);
    return { success: true, message: 'Welcome back.' };
  }

  logout(): void {
    this.sessionUser.set(null);
    this.storage.removeItem(SESSION_KEY);
    void this.router.navigate(['/login']);
  }

  private getInitialUsers(): User[] {
    const storedUsers = this.storage.getItem<User[]>(USERS_KEY, []);
    const withoutOldDemoVariants = storedUsers.filter(
      (user) => !(user.email.toLowerCase() === DEMO_USER.email && user.password !== DEMO_USER.password)
    );
    const hasDemoUser = withoutOldDemoVariants.some(
      (user) => user.email.toLowerCase() === DEMO_USER.email && user.password === DEMO_USER.password
    );
    const seededUsers = hasDemoUser ? withoutOldDemoVariants : [...withoutOldDemoVariants, DEMO_USER];

    this.storage.setItem(USERS_KEY, seededUsers);
    return seededUsers;
  }

  private setSession(user: User): void {
    this.sessionUser.set(user);
    this.storage.setItem(SESSION_KEY, user);
  }
}
