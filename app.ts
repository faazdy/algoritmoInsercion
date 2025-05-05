import axios from 'axios';
import { writeJson } from 'fs-extra';

const BASE_URL = 'https://servapibi.xm.com.co';

async function fetchAndSave(endpoint: string, filename: string, payload: object) {
  try {
    const { data } = await axios.post(`${BASE_URL}/${endpoint}`, payload);
    console.log(`🔍 Respuesta de ${endpoint}:`, data);

    //asegurar el array de oiobjetos en json
    const normalizado = Array.isArray(data) ? data : data?.datos || data?.items || [data];

    await writeJson(`./data/${filename}.json`, normalizado, { spaces: 2 });
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
    Filter: [
      "Codigo Submercado Generación"
    ]
  });

  await fetchAndSave('monthly', 'monthly', {
    MetricId: 'FAER',
    StartDate: '2023-01-01',
    EndDate: '2024-02-28',
    Entity: 'Sistema',
    Filter: [] 
  });

  await fetchAndSave('Lists', 'lists', {
    MetricId: 'ListadoRecursos'
  });
}

run();
