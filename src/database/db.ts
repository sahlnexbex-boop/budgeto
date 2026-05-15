import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

class DatabaseService {
  private dbNative: any = null;
  private isWeb = Platform.OS === 'web';

  async init() {
    if (this.isWeb) {
      if (!localStorage.getItem('antigravity_categories')) {
        this.seedWeb();
      }
      return;
    }

    this.dbNative = await SQLite.openDatabaseAsync('antigravity.db');
    await this.dbNative.execAsync(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, icon TEXT, color TEXT, budget REAL
            );
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT, type TEXT, balance REAL, currency TEXT, icon TEXT
            );
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT, amount REAL, category_id INTEGER, account_id INTEGER, note TEXT, date TEXT
            );
            CREATE TABLE IF NOT EXISTS debts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                person TEXT, amount REAL, type TEXT, note TEXT, date TEXT, status TEXT
            );
        `);

    // Migration: Add account_id to transactions if it doesn't exist
    try {
      await this.dbNative.execAsync('ALTER TABLE transactions ADD COLUMN account_id INTEGER;');
    } catch (e) {
      // Column probably already exists
    }

    // Migration: Add include_in_total to accounts if it doesn't exist
    try {
      await this.dbNative.execAsync('ALTER TABLE accounts ADD COLUMN include_in_total INTEGER DEFAULT 1;');
    } catch (e) {
      // Column probably already exists
    }
    try {
      const result: any = await this.dbNative.getFirstAsync('SELECT COUNT(*) as count FROM categories');
      if (result && result.count === 0) {
        await this.seedNativeDefaults();
      }
    } catch (error) {
      console.log('Error seeding default categories', error);
    }
  }

  private async seedNativeDefaults() {
    const cats = [
      { name: 'Salary', icon: 'briefcase', color: '#10B981', budget: 0 },
      { name: 'Food & Dining', icon: 'utensils', color: '#6366F1', budget: 600 },
      { name: 'Transport', icon: 'car', color: '#22D3EE', budget: 250 },
      { name: 'Shopping', icon: 'shopping-bag', color: '#F472B6', budget: 400 },
      { name: 'Bills & Util', icon: 'zap', color: '#F59E0B', budget: 300 }
    ];
    for (const cat of cats) {
      await this.dbNative.runAsync(
        'INSERT INTO categories (name, icon, color, budget) VALUES (?, ?, ?, ?)',
        [cat.name, cat.icon, cat.color, cat.budget]
      );
    }
  }

  private seedWeb() {
    const cats = [
      { id: 1, name: 'Salary', icon: 'briefcase', color: '#10B981', budget: 0 },
      { id: 2, name: 'Food & Dining', icon: 'utensils', color: '#6366F1', budget: 600 },
      { id: 3, name: 'Transport', icon: 'car', color: '#22D3EE', budget: 250 },
      { id: 4, name: 'Shopping', icon: 'shopping-bag', color: '#F472B6', budget: 400 },
      { id: 5, name: 'Bills & Util', icon: 'zap', color: '#F59E0B', budget: 300 }
    ];
    const txs = [
      { id: 101, type: 'income', amount: 4500, category_id: 1, note: 'Freelance Payout', date: new Date().toISOString() },
      { id: 102, type: 'expense', amount: 32.50, category_id: 2, note: 'Starbucks Coffee', date: new Date().toISOString() },
      { id: 103, type: 'expense', amount: 15.00, category_id: 3, note: 'Bus Pass', date: new Date().toISOString() }
    ];
    const debts = [
      { id: 1, person: 'Alex Smith', amount: 50.0, type: 'owed_to_me', note: 'Lunch', date: new Date().toISOString(), status: 'pending' },
      { id: 2, person: 'Rental Agency', amount: 1200.0, type: 'i_owe', note: 'Security Deposit', date: new Date().toISOString(), status: 'pending' }
    ];
    const accounts = [
      { id: 1, name: 'Main Wallet', type: 'cash', balance: 1000.0, currency: 'INR', icon: 'wallet' },
      { id: 2, name: 'HDFC Bank', type: 'debit', balance: 50000.0, currency: 'INR', icon: 'landmark' }
    ];
    localStorage.setItem('antigravity_categories', JSON.stringify(cats));
    localStorage.setItem('antigravity_transactions', JSON.stringify(txs));
    localStorage.setItem('antigravity_debts', JSON.stringify(debts));
    localStorage.setItem('antigravity_accounts', JSON.stringify(accounts));
  }

  async wipeData() {
    if (this.isWeb) {
      localStorage.clear();
      this.seedWeb();
      return;
    }
    await this.dbNative.runAsync('DELETE FROM transactions');
    await this.dbNative.runAsync('DELETE FROM categories');
    await this.dbNative.runAsync('DELETE FROM debts');
    await this.dbNative.runAsync('DELETE FROM accounts');
  }

  async getCategories() {
    if (this.isWeb) {
      return JSON.parse(localStorage.getItem('antigravity_categories') || '[]');
    }
    return await this.dbNative.getAllAsync('SELECT * FROM categories');
  }

  async addCategory(cat: { name: string; icon: string; color: string; budget: number }) {
    if (this.isWeb) {
      const cats = JSON.parse(localStorage.getItem('antigravity_categories') || '[]');
      const newCat = { ...cat, id: Date.now() };
      cats.push(newCat);
      localStorage.setItem('antigravity_categories', JSON.stringify(cats));
      return newCat;
    }
    const result = await this.dbNative.runAsync(
      'INSERT INTO categories (name, icon, color, budget) VALUES (?, ?, ?, ?)',
      [cat.name, cat.icon, cat.color, cat.budget]
    );
    return { ...cat, id: result.lastInsertRowId };
  }

  async updateCategory(id: number, cat: { name: string; icon: string; color: string; budget: number }) {
    if (this.isWeb) {
      const cats = JSON.parse(localStorage.getItem('antigravity_categories') || '[]');
      const index = cats.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        cats[index] = { ...cat, id };
        localStorage.setItem('antigravity_categories', JSON.stringify(cats));
      }
      return;
    }
    await this.dbNative.runAsync(
      'UPDATE categories SET name = ?, icon = ?, color = ?, budget = ? WHERE id = ?',
      [cat.name, cat.icon, cat.color, cat.budget, id]
    );
  }

  async deleteCategory(id: number) {
    if (this.isWeb) {
      let cats = JSON.parse(localStorage.getItem('antigravity_categories') || '[]');
      cats = cats.filter((c: any) => c.id !== id);
      localStorage.setItem('antigravity_categories', JSON.stringify(cats));
      return;
    }
    await this.dbNative.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    await this.dbNative.runAsync('DELETE FROM transactions WHERE category_id = ?', [id]);
  }

  async getTransactions() {
    if (this.isWeb) {
      const txs = JSON.parse(localStorage.getItem('antigravity_transactions') || '[]');
      const cats = await this.getCategories();
      const accounts = await this.getAccounts();
      return txs.map((t: any) => {
        const cat = cats.find((c: any) => c.id === t.category_id);
        const acc = accounts.find((a: any) => a.id === t.account_id);
        return {
          ...t,
          category_name: cat?.name,
          category_color: cat?.color,
          icon: cat?.icon,
          account_name: acc?.name
        };
      });
    }
    return await this.dbNative.getAllAsync('SELECT t.*, c.name as category_name, c.color as category_color, c.icon as icon, a.name as account_name FROM transactions t LEFT JOIN categories c ON t.category_id = c.id LEFT JOIN accounts a ON t.account_id = a.id ORDER BY date DESC');
  }

  async addTransaction(tx: any) {
    if (this.isWeb) {
      const txs = JSON.parse(localStorage.getItem('antigravity_transactions') || '[]');
      const newTx = { ...tx, id: Date.now() };
      txs.unshift(newTx);
      localStorage.setItem('antigravity_transactions', JSON.stringify(txs));

      if (tx.account_id) {
        await this.updateAccountBalance(tx.account_id, tx.amount, tx.type === 'income' ? 'add' : 'subtract');
      }
      return;
    }
    await this.dbNative.runAsync(
      'INSERT INTO transactions (type, amount, category_id, account_id, note, date) VALUES (?, ?, ?, ?, ?, ?)',
      [tx.type, tx.amount, tx.category_id, tx.account_id, tx.note, tx.date]
    );
    if (tx.account_id) {
      await this.updateAccountBalance(tx.account_id, tx.amount, tx.type === 'income' ? 'add' : 'subtract');
    }
  }

  async deleteTransaction(id: number) {
    let tx: any = null;
    if (this.isWeb) {
      let txs = JSON.parse(localStorage.getItem('antigravity_transactions') || '[]');
      tx = txs.find((t: any) => t.id === id);
      txs = txs.filter((t: any) => t.id !== id);
      localStorage.setItem('antigravity_transactions', JSON.stringify(txs));
    } else {
      tx = await this.dbNative.getFirstAsync('SELECT * FROM transactions WHERE id = ?', [id]);
      await this.dbNative.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    }

    if (tx && tx.account_id) {
      await this.updateAccountBalance(tx.account_id, tx.amount, tx.type === 'income' ? 'subtract' : 'add');
    }
  }

  async updateTransaction(id: number, tx: any) {
    let oldTx: any = null;
    if (this.isWeb) {
      const txs = JSON.parse(localStorage.getItem('antigravity_transactions') || '[]');
      const index = txs.findIndex((t: any) => t.id === id);
      if (index !== -1) {
        oldTx = { ...txs[index] };
        txs[index] = { ...txs[index], ...tx };
        localStorage.setItem('antigravity_transactions', JSON.stringify(txs));
      }
    } else {
      oldTx = await this.dbNative.getFirstAsync('SELECT * FROM transactions WHERE id = ?', [id]);
      await this.dbNative.runAsync(
        'UPDATE transactions SET type = ?, amount = ?, category_id = ?, account_id = ?, note = ?, date = ? WHERE id = ?',
        [tx.type, tx.amount, tx.category_id, tx.account_id, tx.note, tx.date, id]
      );
    }

    // Adjust balances
    if (oldTx && oldTx.account_id) {
      await this.updateAccountBalance(oldTx.account_id, oldTx.amount, oldTx.type === 'income' ? 'subtract' : 'add');
    }
    if (tx.account_id) {
      await this.updateAccountBalance(tx.account_id, tx.amount, tx.type === 'income' ? 'add' : 'subtract');
    }
  }

  // Account Methods
  async getAccounts() {
    if (this.isWeb) {
      return JSON.parse(localStorage.getItem('antigravity_accounts') || '[]');
    }
    return await this.dbNative.getAllAsync('SELECT * FROM accounts');
  }

  async addAccount(acc: any) {
    if (this.isWeb) {
      const accounts = JSON.parse(localStorage.getItem('antigravity_accounts') || '[]');
      const newAcc = { ...acc, id: Date.now() };
      accounts.push(newAcc);
      localStorage.setItem('antigravity_accounts', JSON.stringify(accounts));
      return newAcc;
    }
    const result = await this.dbNative.runAsync(
      'INSERT INTO accounts (name, type, balance, currency, icon, include_in_total) VALUES (?, ?, ?, ?, ?, ?)',
      [acc.name, acc.type, acc.balance, acc.currency, acc.icon, acc.include_in_total === undefined ? 1 : acc.include_in_total]
    );
    return { ...acc, id: result.lastInsertRowId };
  }

  async updateAccount(id: number, acc: any) {
    if (this.isWeb) {
      const accounts = JSON.parse(localStorage.getItem('antigravity_accounts') || '[]');
      const index = accounts.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        accounts[index] = { ...acc, id };
        localStorage.setItem('antigravity_accounts', JSON.stringify(accounts));
      }
      return;
    }
    await this.dbNative.runAsync(
      'UPDATE accounts SET name = ?, type = ?, balance = ?, currency = ?, icon = ?, include_in_total = ? WHERE id = ?',
      [acc.name, acc.type, acc.balance, acc.currency, acc.icon, acc.include_in_total === undefined ? 1 : acc.include_in_total, id]
    );
  }

  async deleteAccount(id: number) {
    if (this.isWeb) {
      let accounts = JSON.parse(localStorage.getItem('antigravity_accounts') || '[]');
      accounts = accounts.filter((a: any) => a.id !== id);
      localStorage.setItem('antigravity_accounts', JSON.stringify(accounts));
    } else {
      await this.dbNative.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
    }
    // Set account_id to NULL in transactions
    if (this.isWeb) {
      let txs = JSON.parse(localStorage.getItem('antigravity_transactions') || '[]');
      txs = txs.map((t: any) => t.account_id === id ? { ...t, account_id: null } : t);
      localStorage.setItem('antigravity_transactions', JSON.stringify(txs));
    } else {
      await this.dbNative.runAsync('UPDATE transactions SET account_id = NULL WHERE account_id = ?', [id]);
    }
  }

  async updateAccountBalance(id: number, amount: number, action: 'add' | 'subtract') {
    if (this.isWeb) {
      const accounts = JSON.parse(localStorage.getItem('antigravity_accounts') || '[]');
      const index = accounts.findIndex((a: any) => a.id === id);
      if (index !== -1) {
        if (action === 'add') accounts[index].balance += amount;
        else accounts[index].balance -= amount;
        localStorage.setItem('antigravity_accounts', JSON.stringify(accounts));
      }
      return;
    }
    if (action === 'add') {
      await this.dbNative.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, id]);
    } else {
      await this.dbNative.runAsync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, id]);
    }
  }

  // Debt Methods
  async getDebts() {
    if (this.isWeb) {
      return JSON.parse(localStorage.getItem('antigravity_debts') || '[]');
    }
    return await this.dbNative.getAllAsync('SELECT * FROM debts ORDER BY date DESC');
  }

  async addDebt(debt: any) {
    if (this.isWeb) {
      const debts = JSON.parse(localStorage.getItem('antigravity_debts') || '[]');
      const newDebt = { ...debt, id: Date.now() };
      debts.unshift(newDebt);
      localStorage.setItem('antigravity_debts', JSON.stringify(debts));
      return;
    }
    await this.dbNative.runAsync(
      'INSERT INTO debts (person, amount, type, note, date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [debt.person, debt.amount, debt.type, debt.note, debt.date, debt.status]
    );
  }

  async deleteDebt(id: number) {
    if (this.isWeb) {
      let debts = JSON.parse(localStorage.getItem('antigravity_debts') || '[]');
      debts = debts.filter((d: any) => d.id !== id);
      localStorage.setItem('antigravity_debts', JSON.stringify(debts));
      return;
    }
    await this.dbNative.runAsync('DELETE FROM debts WHERE id = ?', [id]);
  }

  async updateDebtStatus(id: number, status: string) {
    if (this.isWeb) {
      const debts = JSON.parse(localStorage.getItem('antigravity_debts') || '[]');
      const index = debts.findIndex((d: any) => d.id === id);
      if (index !== -1) {
        debts[index].status = status;
        localStorage.setItem('antigravity_debts', JSON.stringify(debts));
      }
      return;
    }
    await this.dbNative.runAsync('UPDATE debts SET status = ? WHERE id = ?', [status, id]);
  }

  // Sync / Export Methods
  async exportDatabaseJson() {
    if (this.isWeb) {
      return JSON.stringify({
        categories: JSON.parse(localStorage.getItem('antigravity_categories') || '[]'),
        accounts: JSON.parse(localStorage.getItem('antigravity_accounts') || '[]'),
        transactions: JSON.parse(localStorage.getItem('antigravity_transactions') || '[]'),
        debts: JSON.parse(localStorage.getItem('antigravity_debts') || '[]')
      });
    }

    const categories = await this.dbNative.getAllAsync('SELECT * FROM categories');
    const accounts = await this.dbNative.getAllAsync('SELECT * FROM accounts');
    const transactions = await this.dbNative.getAllAsync('SELECT * FROM transactions');
    const debts = await this.dbNative.getAllAsync('SELECT * FROM debts');

    return JSON.stringify({ categories, accounts, transactions, debts });
  }

  async importDatabaseJson(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.categories || !data.accounts || !data.transactions || !data.debts) {
        throw new Error("Invalid budgeto backup file format.");
      }

      if (this.isWeb) {
        localStorage.setItem('antigravity_categories', JSON.stringify(data.categories));
        localStorage.setItem('antigravity_accounts', JSON.stringify(data.accounts));
        localStorage.setItem('antigravity_transactions', JSON.stringify(data.transactions));
        localStorage.setItem('antigravity_debts', JSON.stringify(data.debts));
        return true;
      }

      // Complete wipe
      await this.dbNative.execAsync('DELETE FROM categories; DELETE FROM accounts; DELETE FROM transactions; DELETE FROM debts;');

      // Restore
      for (const cat of data.categories) {
        await this.dbNative.runAsync('INSERT INTO categories (id, name, icon, color, budget) VALUES (?, ?, ?, ?, ?)', [cat.id, cat.name, cat.icon, cat.color, cat.budget]);
      }
      for (const acc of data.accounts) {
        await this.dbNative.runAsync('INSERT INTO accounts (id, name, type, balance, currency, icon) VALUES (?, ?, ?, ?, ?, ?)', [acc.id, acc.name, acc.type, acc.balance, acc.currency, acc.icon]);
      }
      for (const t of data.transactions) {
        await this.dbNative.runAsync('INSERT INTO transactions (id, type, amount, category_id, account_id, note, date) VALUES (?, ?, ?, ?, ?, ?, ?)', [t.id, t.type, t.amount, t.category_id, t.account_id, t.note, t.date]);
      }
      for (const d of data.debts) {
        await this.dbNative.runAsync('INSERT INTO debts (id, person, amount, type, note, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [d.id, d.person, d.amount, d.type, d.note, d.date, d.status]);
      }

      return true;
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService();
export const initDatabase = () => dbService.init();
