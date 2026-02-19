
const readXlsxFile = require('read-excel-file/node')
const path = require('path')

const FILE_PATH = 'c:\\Users\\Micro\\Desktop\\JACANAWORKANA\\Modelo_cronograma.xlsx'

// Schema igual ao do arquivo import-project.ts
const SCHEMA = {
  'Nome da tarefa': {
    prop: 'task',
    type: String,
    column: 'Nome da tarefa',
    required: true
  },
  'Início': {
    prop: 'start',
    type: String,
    column: 'Início'
  },
  'Término': {
    prop: 'end',
    type: String,
    column: 'Término'
  },
  'Duração': {
    prop: 'duration',
    type: String,
    column: 'Duração'
  },
  '% concluída': {
    prop: 'progress',
    type: Number,
    column: '% concluída'
  },
  'Predecessoras': {
    prop: 'predecessors',
    type: String,
    column: 'Predecessoras'
  },
  'Nomes dos recursos': {
    prop: 'resources',
    type: String,
    column: 'Nomes dos recursos'
  }
}

async function run() {
  try {
    console.log('Lendo arquivo:', FILE_PATH)

    // 1. Ler Rows Puras (sem schema) para ver cabeçalhos
    const rawRows = await readXlsxFile(FILE_PATH)
    console.log('\n--- Cabeçalhos encontrados (Linha 1) ---')
    console.log(rawRows[0])
    console.log('--- Primeira linha de dados (Linha 2) ---')
    console.log(rawRows[1])

    // 2. Ler com Schema
    const { rows, errors } = await readXlsxFile(FILE_PATH, { schema: SCHEMA })
    
    console.log('\n--- Resultado do Parsing com Schema ---')
    if (errors && errors.length > 0) {
      console.log('ERROS ENCONTRADOS:', errors)
    } else {
      console.log('Nenhum erro de schema.')
    }

    console.log(`Linhas extraídas: ${rows.length}`)
    if (rows.length > 0) {
      console.log('Primeira tarefa extraída:', rows[0])
    }

  } catch (error) {
    console.error('Erro fatal:', error)
  }
}

run()
