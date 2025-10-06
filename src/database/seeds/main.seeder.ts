import { runSeeders, Seeder } from 'typeorm-extension';
import { dataSource } from '../data-source';

class MainSeeder implements Seeder {
  run(): Promise<void> {
    console.log('Seeding completed');
    return Promise.resolve();
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
