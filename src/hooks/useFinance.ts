import { useState, useCallback } from 'react';
import { dbService } from '../database/db';

export const useFinance = () => {
    const [loading, setLoading] = useState(false);

    const addTransaction = useCallback(async (tx: any) => {
        setLoading(true);
        await dbService.addTransaction(tx);
        setLoading(false);
    }, []);

    const getTransactions = useCallback(async () => {
        return await dbService.getTransactions();
    }, []);

    const getCategories = useCallback(async () => {
        return await dbService.getCategories();
    }, []);

    return { addTransaction, getTransactions, getCategories, loading };
};
