import { DataSource } from 'typeorm';
import { runSeeders, Seeder, SeederFactoryManager } from 'typeorm-extension';
import { dataSource } from '../data-source';

class MainSeeder implements Seeder {
  async run(
    dataSource: DataSource,
    factoryManager: SeederFactoryManager,
  ): Promise<void> {
    console.log('Seeding completed');
  }
}

dataSource
  .initialize()
  .then(async () => {
    await runSeeders(dataSource, {
      seeds: [MainSeeder],
    });
    await dataSource.destroy();
  })
  .catch((error) => console.log(error));
