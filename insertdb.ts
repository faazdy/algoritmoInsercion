import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'masivasdb',
  password: '', //poner la contra de la db del docker
  port: 5432,
});

async function insertarDesdeArchivo(tipo: 'daily' | 'monthly' | 'hourly' | 'list') {
  const filePath = path.join(__dirname, 'data', `${tipo}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const item of data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (tipo === 'hourly') {
        // Reutilizamos tu lógica original para datos energéticos por hora
        let idtipo_agente = (await getOrCreate(client,
          'tipo_agente', 'nombre', item.tipo_agente, 'idtipo_agente')).id;

        let idzona = (await getOrCreate(client,
          'zona', 'nombre_zona', item.zona, 'idzona')).id;

        let idagente = (await getOrCreate(client,
          'agente', 'nombre', item.nombre_agente, 'idagente', [idtipo_agente, idzona],
          'INSERT INTO agente(nombre, idtipo_agente, idzona) VALUES($1, $2, $3) RETURNING idagente')).id;

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

      } else if (tipo === 'daily') {
        await client.query(
          `INSERT INTO energia_diaria(fecha, variable, valor, unidad)
           VALUES ($1, $2, $3, $4)`,
          [item.fecha, item.variable, item.valor, item.unidad]
        );

      } else if (tipo === 'monthly') {
        await client.query(
          `INSERT INTO energia_mensual(fecha, variable, valor, unidad)
           VALUES ($1, $2, $3, $4)`,
          [item.fecha, item.variable, item.valor, item.unidad]
        );

      } else if (tipo === 'list') {
        await client.query(
          `INSERT INTO listado_config(variable, descripcion, unidad)
           VALUES ($1, $2, $3)`,
          [item.variable, item.descripcion, item.unidad]
        );
      }

      await client.query('COMMIT');
      console.log(`✔ Insertado (${tipo}): ${item.variable ?? item.nombre_agente} - ${item.fecha ?? ''}`);
    } catch (e: any) {
      await client.query('ROLLBACK');
      console.error(`✖ Error al insertar (${tipo}):`, e.message);
    } finally {
      client.release();
    }
  }
}

async function getOrCreate(
  client: any,
  table: string,
  field: string,
  value: string,
  idField: string,
  extraValues: any[] = [],
  insertQuery?: string
) {
  const res = await client.query(`SELECT ${idField} as id FROM ${table} WHERE ${field} = $1`, [value]);
  if (res.rows.length > 0) return res.rows[0];

  if (!insertQuery) {
    const r = await client.query(`INSERT INTO ${table}(${field}) VALUES($1) RETURNING ${idField} as id`, [value]);
    return r.rows[0];
  } else {
    const r = await client.query(insertQuery, [value, ...extraValues]);
    return r.rows[0];
  }
}

async function main() {
  await insertarDesdeArchivo('daily');
  await insertarDesdeArchivo('monthly');
  await insertarDesdeArchivo('hourly');
  await insertarDesdeArchivo('list');

  await pool.end();
}

main();
