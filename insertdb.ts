import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'masivasdb',
  password: '', // cambiar la pass
  port: 5432,
});


const API_URL = ''; //  URL endpoint que devuelve los datos en formato JSON

async function insertarDatos() {
  let data = [];
  try {
    const response = await axios.get(API_URL);
    data = response.data;
  } catch (error: any) {
    console.error('❌ Error al obtener los datos desde la API:', error.message);
    return;
  }

  for (const item of data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Tipo de agente
      const tipoAgenteRes = await client.query(
        'SELECT idtipo_agente FROM tipo_agente WHERE nombre = $1',
        [item.tipo_agente]
      );
      let idtipo_agente = tipoAgenteRes.rows[0]?.idtipo_agente;
      if (!idtipo_agente) {
        const r = await client.query(
          'INSERT INTO tipo_agente(nombre) VALUES($1) RETURNING idtipo_agente',
          [item.tipo_agente]
        );
        idtipo_agente = r.rows[0].idtipo_agente;
      }

      // Zona
      const zonaRes = await client.query(
        'SELECT idzona FROM zona WHERE nombre_zona = $1',
        [item.zona]
      );
      let idzona = zonaRes.rows[0]?.idzona;
      if (!idzona) {
        const r = await client.query(
          'INSERT INTO zona(nombre_zona) VALUES($1) RETURNING idzona',
          [item.zona]
        );
        idzona = r.rows[0].idzona;
      }

      // Agente
      const agenteRes = await client.query(
        'SELECT idagente FROM agente WHERE nombre = $1',
        [item.nombre_agente]
      );
      let idagente = agenteRes.rows[0]?.idagente;
      if (!idagente) {
        const r = await client.query(
          'INSERT INTO agente(nombre, idtipo_agente, idzona) VALUES($1, $2, $3) RETURNING idagente',
          [item.nombre_agente, idtipo_agente, idzona]
        );
        idagente = r.rows[0].idagente;
      }

      // Energía
      const energiaRes = await client.query(
        'SELECT idenergia FROM energia WHERE fecha = $1 AND hora = $2',
        [item.fecha, item.hora]
      );
      let idenergia = energiaRes.rows[0]?.idenergia;
      if (!idenergia) {
        const r = await client.query(
          `INSERT INTO energia(fecha, hora, precbolsnaci, costmargdesp, demareal, gene)
           VALUES($1, $2, $3, $4, $5, $6) RETURNING idenergia`,
          [item.fecha, item.hora, item.precbolsnaci, item.costmargdesp, item.demareal, item.gene]
        );
        idenergia = r.rows[0].idenergia;
      }

      // Transacción
      const transRes = await client.query(
        'SELECT idtransaccion FROM transaccion WHERE idagente = $1 AND idenergia = $2 AND fecha = $3',
        [idagente, idenergia, item.fecha]
      );
      let idtransaccion = transRes.rows[0]?.idtransaccion;
      if (!idtransaccion) {
        const r = await client.query(
          `INSERT INTO transaccion(idagente, idenergia, fecha, ventbolsnaciener, compbolsnaciener, demarealener, geneener)
           VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING idtransaccion`,
          [
            idagente,
            idenergia,
            item.fecha,
            item.ventbolsnaciener,
            item.compbolsnaciener,
            item.demarealener,
            item.geneener
          ]
        );
        idtransaccion = r.rows[0].idtransaccion;
      }

      // Resultado financiero
      const resultRes = await client.query(
        'SELECT 1 FROM resultados_financieros WHERE idtransaccion = $1',
        [idtransaccion]
      );
      if (resultRes.rowCount === 0) {
        await client.query(
          `INSERT INTO resultados_financieros(idtransaccion, monto_ingreso, monto_costo)
           VALUES($1, $2, $3)`,
          [idtransaccion, item.ventbolsnaciener, item.compbolsnaciener]
        );
      }

      await client.query('COMMIT');
      console.log(`✔ Insertado: ${item.nombre_agente} - ${item.fecha}`);
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error('✖ Error en transacción:', e.message);
    } finally {
      client.release();
    }
  }

  await pool.end();
}

insertarDatos();
