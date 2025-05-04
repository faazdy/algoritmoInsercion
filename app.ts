import axios from 'axios';
import { writeJson } from 'fs-extra';

const BASE_URL = 'https://servapibi.xm.com.co';

async function fetchAndSave(endpoint: string, filename: string, payload: object) {
  try {
    const { data } = await axios.post(`${BASE_URL}/${endpoint}`, payload);
    await writeJson(`./data/${filename}.json`, data, { spaces: 2 });
    console.log(`✅ Datos de "${endpoint}" guardados en ${filename}.json`);
  } catch (error: any) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
  }
}

async function run() {
  await fetchAndSave('hourly', 'hourly', {
    MetricId: 'ExpoMoneda',
    StartDate: '2025-02-01',
    EndDate: '2025-02-28',
    Entity: 'Sistema',
    Filter: []
  });

  await fetchAndSave('daily', 'daily', {
    MetricId: 'ENFICC',
    StartDate: '2025-02-01',
    EndDate: '2025-02-28',
    Entity: 'Recurso',
    Filter: []
  });

  await fetchAndSave('monthly', 'monthly', {
    MetricId: 'MetricID',
    StartDate: '2025-02-01',
    EndDate: '2025-02-28',
    Entity: 'Cruce',
    Filter: [] 
  });

  await fetchAndSave('Lists', 'lists', {
    MetricId: 'ListadoRecursos'
  });
}

run();
