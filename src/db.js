// src/db.js
import Dexie from 'dexie';

export class ClipboardDB extends Dexie {
  items;
  categories;

  constructor() {
    super('ClipboardManagerDB');
    this.version(1).stores({
      items: '++id, title, content, category, color, createdAt, updatedAt',
      categories: '++id, name, color, icon'
    });
    this.items = this.table('items');
    this.categories = this.table('categories');
  }

  async initDefaultCategories() {
    const defaultCategories = [
      { name: 'Git命令', color: '#F05032', icon: 'git', legacyNames: ['Git'] },
      { name: 'Docker', color: '#2496ED', icon: 'docker', legacyNames: [] },
      { name: 'SQL', color: '#4479A1', icon: 'database', legacyNames: [] },
      { name: 'Markdown', color: '#000000', icon: 'markdown', legacyNames: [] },
      { name: '通用', color: '#607D8B', icon: 'code', legacyNames: [] }
    ];

    const existingCategories = await this.categories.toArray();
    const existingByName = new Map(existingCategories.map(category => [category.name, category]));

    for (const defaultCategory of defaultCategories) {
      if (existingByName.has(defaultCategory.name)) continue;

      const legacyCategory = defaultCategory.legacyNames
        .map(name => existingByName.get(name))
        .find(Boolean);

      if (legacyCategory) {
        await this.categories.update(legacyCategory.id, {
          name: defaultCategory.name,
          color: legacyCategory.color || defaultCategory.color,
          icon: legacyCategory.icon || defaultCategory.icon
        });

        await this.items
          .where('category')
          .equals(legacyCategory.name)
          .modify({ category: defaultCategory.name });

        existingByName.delete(legacyCategory.name);
        existingByName.set(defaultCategory.name, {
          ...legacyCategory,
          name: defaultCategory.name
        });
        continue;
      }

      const { legacyNames, ...categoryToAdd } = defaultCategory;
      const newId = await this.categories.add(categoryToAdd);
      existingByName.set(categoryToAdd.name, { id: newId, ...categoryToAdd });
    }
  }
}

export const db = new ClipboardDB();