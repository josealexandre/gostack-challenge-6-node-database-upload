import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import { getRepository, getCustomRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface CsvLine {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const readCsvStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      delimiter: ',',
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCsv = readCsvStream.pipe(parseStream);

    const transactions: CsvLine[] = [];
    const categoriesTitle: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line;

      if (!(title && type && value && category)) return;

      transactions.push({ title, type, value, category });
      categoriesTitle.push(category);
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categoriesTitle),
      },
    });

    const existentCategoryTitle = existentCategories.map(
      category => category.title,
    );

    let newCategoryTitles = categoriesTitle.filter(
      category => !existentCategoryTitle.includes(category),
    );

    // Remove duplicate values
    newCategoryTitles = Array.from(new Set(newCategoryTitles));

    const newCategories = categoriesRepository.create(
      newCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(csvFilePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
