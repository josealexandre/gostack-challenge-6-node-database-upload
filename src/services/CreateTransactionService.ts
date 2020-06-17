import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const findCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    let categoryId;
    if (!findCategory) {
      const newCategory = categoriesRepository.create({
        title: category,
      });

      const insertedCategory = await categoriesRepository.save(newCategory);
      categoryId = insertedCategory.id;
    } else {
      categoryId = findCategory.id;
    }

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Invalid balance');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    const newTransaction = await transactionsRepository.save(transaction);

    return newTransaction;
  }
}

export default CreateTransactionService;
